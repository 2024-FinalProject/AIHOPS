import traceback
from Domain.src.DS import FactorsPool
from Domain.src.Server import Server
from Service.config import app, socketio
from flask import Flask, redirect, request, jsonify
from flask.wrappers import Response as FlaskResponse
from Service.config import Base, engine
from sqlalchemy import event
from flask_socketio import emit

import os
from werkzeug.utils import secure_filename
from flask import send_file

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests


from flask_cors import CORS


# app = Flask(__name__)
#
#
# CORS(app)


# --------  init session and user management ---------------

# server = Server()


# Get the project root directory (one level up from Service directory)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_FOLDER = os.path.join(PROJECT_ROOT, 'uploads', 'profile_pictures')
STATIC_FOLDER = os.path.join(PROJECT_ROOT, 'static')

# Make sure these directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(STATIC_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/enter", methods=["GET"])
def start_session():
    res = server.enter()
    print("from service server: " + str(res.result.cookie))
    return jsonify({
            "success": True,
            "cookie": str(res.result.cookie)
        })


@app.route("/register", methods=["POST"])
# excpecting json with {cookie, user_name, passwd}
def register():
    data = request.json
    print("trying to register in service server")
    acceptedTermsVersion = data.get("acceptedTermsVersion", 0)
    
    res = server.register(int(data["cookie"]), data["userName"], data["passwd"], int(acceptedTermsVersion))
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/verify", methods=["POST"])
# excpecting json with {cookie, user_name, passwd, code}
def verify():
    data = request.json
    print("trying to verify in service server")
    res = server.verify(int(data["cookie"]), data["userName"], data["passwd"], data["code"])
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/verify_automatic", methods=["POST"])
# excpecting json with {token}
def verify_automatic():
    try:
        data = request.json
        print("Attempting automatic verification with data:", data)
        
        # Get a cookie from the request or create a new session if none provided
        cookie = None
        if "cookie" in data:
            cookie = int(data["cookie"])
        else:
            # Start a new session if no cookie provided
            enter_res = server.enter()
            if enter_res.success and enter_res.result:
                cookie = enter_res.result.cookie
                print(f"Created new session with cookie: {cookie}")
            else:
                return jsonify({
                    "message": "Failed to create session for verification", 
                    "success": False
                }), 500
        
        # Check that we have a token
        if "token" not in data:
            return jsonify({
                "message": "No verification token provided",
                "success": False
            }), 400
        
        # Attempt verification
        res = server.verify_automatic(cookie, data["token"])
        
        # Create response data
        response_data = {
            "message": res.msg, 
            "success": res.success
        }
        
        # If verification was successful and the result contains an email, include it
        if res.success and res.result:
            response_data["email"] = res.result
        
        return jsonify(response_data)
    
    except Exception as e:
        print(f"Error in verify_automatic: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "message": f"Server error: {str(e)}",
            "success": False
        }), 500

@app.route("/login", methods=["POST"])
# expecting json with {cookie, user_name, passwd}
def login():
    try:
        data = request.json
        res = server.login(int(data["cookie"]), data["userName"], data["passwd"])
        
        # Create a base response dictionary with message and success
        response_data = {
            "message": res.msg,
            "success": res.success
        }
        
        # Only add additional fields if login was successful
        if res.success:
            # Add these fields only if they exist on the response object
            if hasattr(res, 'is_admin'):
                response_data["is_admin"] = res.is_admin
            else:
                response_data["is_admin"] = False
                
            if hasattr(res, 'accepted_tac_version'):
                response_data["accepted_tac_version"] = res.accepted_tac_version
                
            if hasattr(res, 'need_to_accept_new_terms'):
                response_data["need_to_accept_new_terms"] = res.need_to_accept_new_terms
        
        return jsonify(response_data)
    except Exception as e:
        print(f"Error in login route: {str(e)}")
        return jsonify({
            "message": f"Server error: {str(e)}",
            "success": False
        }), 500

@app.route("/logout", methods=["POST"])
# expecting json with {cookie}
def logout():
    data = request.json
    res = server.logout(int(data["cookie"]))
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/accept-terms", methods=["POST"])
def accept_terms():
    data = request.json
    res = server.accept_terms(int(data["cookie"]), int(data["acceptedTermsVersion"]))
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/google_login", methods=["POST"])
def google_login():
    data = request.json
    print(f"google_login received: {data}")
    try:
        cookie = int(data.get("cookie", 0))
        token = data["tokenId"]
        tac_ver = int(data["acceptedTermsVersion"])
    except (KeyError, ValueError, TypeError) as e:
        return jsonify({"message": f"Bad input: {str(e)}", "success": False}), 400

    res = server.google_login(cookie, token, tac_ver)
    
    # Create a response data dictionary
    response_data = {
        "message": res.msg,
        "success": res.success,
        "accepted_tac_version": getattr(res, 'accepted_tac_version', -1),
        "need_to_accept_new_terms": getattr(res, 'need_to_accept_new_terms', False)
    }
    
    # Always include the email in the response if available
    if res.success:
        # First try to get email from result dictionary
        if hasattr(res, 'result') and isinstance(res.result, dict) and 'email' in res.result:
            response_data["email"] = res.result["email"]
        # Fallback: try to extract from Google token if not in result
        elif not "email" in response_data:
            try:
                id_info = id_token.verify_oauth2_token(
                    token, google_requests.Request(), server.GOOGLE_CLIENT_ID
                )
                response_data["email"] = id_info.get('email')
                print(f"Added email from token: {response_data['email']}")
            except Exception as e:
                print(f"Failed to extract email from token: {e}")
    
    return jsonify(response_data)
@app.route("/check_email_exists", methods=["POST"])
def check_email_exists():
    data = request.json
    res = server.check_email_exists(int(data["cookie"]), data["tokenId"])
    response_data = {
        "message": res.msg, 
        "success": res.success,
        "userExists": res.result["userExists"] if res.success else False
    }
    
    if res.success and "email" in res.result:
        response_data["email"] = res.result["email"]
    
    return jsonify(response_data)

# @app.route("/update-password", methods=["POST"])
# # expecting json with {cookie, oldPasswd, newPasswd}
# def update_password():
#     data = request.json
#     res = server.update_password(int(data["cookie"]), data["oldPasswd"], data["newPasswd"])
#     return jsonify({"message": res.msg, "success": res.success})

@app.route("/start_password_recovery", methods=["POST"])
def start_password_recovery():
    data = request.json
    res = server.start_password_recovery(int(data["cookie"]), data["email"])
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/update_password", methods=["POST"])
def update_password():
    data = request.json
    res = server.update_password(int(data["cookie"]), data["email"], data["password"], data["code"])
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/delete_account", methods=["POST"])
# expecting json with {cookie}
def delete_account():
    data = request.json
    res = server.delete_account(int(data["cookie"]))
    return jsonify({"message": res.msg, "success": res.success})

# -------- Project Management ---------------

@app.route("/project/create", methods=["POST"])
# expecting json with {cookie, name, description}
def create_project():
    data = request.json
    res = server.create_project(int(data["cookie"]), data["name"], data["description"], bool(data["defaultFactors"]), is_to_research=bool(data["isToResearch"]))
    return jsonify({"message": res.msg, "success": res.success, "project_id": res.result if res.success else None})

@app.route("/project/factor", methods=["POST"])
# expecting json with {cookie, pid, factor_name, factor_desc, scales_desc, scales_explanation}
def add_project_factor():
    data = request.json
    res = server.add_project_factor(int(data["cookie"]), int(data["pid"]), data["factor_name"], data["factor_desc"], 
                                    data["scales_desc"], data["scales_explanation"])
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/project/factors", methods=["POST"])
# expecting json with {cookie, pid, factors}
def set_project_factors():
    data = request.json
    res = server.set_project_factors(int(data["cookie"]), int(data["pid"]), data["factors"])
    return jsonify({"message": res.msg, "success": res.success})

# TODO: Change this!
@app.route("/project/update-factor", methods=["POST"])
# expecting json with {cookie, fid, new_name, new_desc}
def update_project_factor():
    data = request.json
    res = server.update_factor(int(data["cookie"]), int(data["fid"]), data["pid"], data["name"], data["desc"],
                               data["scales_desc"], data["scales_explenation"], bool(data["apply_to_all_inDesign"]))
    # res = server.update_factor(int(data["cookie"]), int(data["fid"]), data["new_name"], data["new_desc"])
    print(res.msg)
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/project/delete-factor", methods=["POST"])
# expecting json with {cookie, pid, factor}
def delete_project_factor():
    data = request.json
    res = server.delete_project_factor(int(data["cookie"]), int(data["pid"]), int(data["fid"]))
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/project/factor/delete-from-pool", methods=["POST"])
# expecting json with {cookie, pid, factor}
def delete_factor_from_pool():
    data = request.json
    res = server.delete_factor_from_pool(int(data["cookie"]), int(data["fid"]))
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/project/confirm-factors", methods=["POST"])
def confirm_factors():
    data = request.json
    res = server.confirm_project_factors(int(data["cookie"]), int(data["pid"]))
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/project/severity-factors", methods=["POST"])
# expecting json with {cookie, pid, severityFactors}
def set_project_severity_factors():
    data = request.json
    res = server.set_project_severity_factors(int(data["cookie"]), int(data["pid"]), data["severityFactors"])
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/project/confirm-severity-factors", methods=["POST"])
# expecting json with {cookie, pid}
def confirm_severity_factors():
    data = request.json
    res = server.confirm_project_severity_factors(int(data["cookie"]), int(data["pid"]))
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/project/get-factors", methods=["GET"])
# expecting json with {cookie, pid}
def get_project_factors():
    cookie = request.args.get("cookie", type=int)
    pid = request.args.get("pid", type=int)
    res = server.get_project_factors(cookie, pid)
    return jsonify({"message": res.msg, "success": res.success, "factors": res.result if res.success else None})

@app.route("/project/get-progress", methods=["GET"])
# expecting json with {cookie, pid}
def get_project_progress():
    cookie = request.args.get("cookie", type=int)
    pid = request.args.get("pid", type=int)
    res = server.get_project_progress_for_owner(cookie, pid)
    return jsonify({"message": res.msg, "success": res.success, "progress": res.result if res.success else None})

@app.route("/project/get-severity-factors", methods=["GET"])
# expecting json with {cookie, pid}
def get_project_severity_factors():
    cookie = request.args.get("cookie", type=int)
    pid = request.args.get("pid", type=int)
    res = server.get_project_severity_factors(cookie, pid)
    return jsonify({"message": res.msg, "success": res.success, "severityFactors": res.result if res.success else None})

@app.route("/project/get-factors-pool", methods=["GET"])
# expecting query param: cookie
def get_factors_pool_of_member():
    cookie = request.args.get("cookie", type=int)
    res = server.get_factor_pool_of_member(cookie)
    return jsonify({"message": res.msg, "success": res.success, "factors": res.result if res.success else None})

@app.route("/project/get-projects-factors-pool", methods=["GET"])
# expecting query param: cookie
def get_projects_factors_pool_of_member():
    cookie = request.args.get("cookie", type=int)
    pid = request.args.get("pid", type=int)
    res = server.get_projects_factor_pool_of_member(cookie, pid)
    return jsonify({"message": res.msg, "success": res.success, "factors": res.result if res.success else None})

@app.route("/project/publish", methods=["POST"])
# expecting json with {cookie, pid}
def publish_project():
    data = request.json
    res = server.publish_project(int(data["cookie"]), int(data["pid"]))
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/project/archive", methods=["POST"])
# expecting json with {cookie, pid}
def close_project():
    data = request.json
    res = server.archive_project(int(data["cookie"]), int(data["pid"]))
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/project/update-name-and-desc", methods=["POST"])
# expecting json with {cookie, pid, name, description}
def update_project_name_and_desc():
    data = request.json
    res = server.update_project_name_and_desc(int(data["cookie"]), int(data["pid"]), data["name"], data["description"])
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/project/delete-project", methods=["POST"])
# expecting JSON with { cookie, pid }
def delete_project():
    data = request.json
    res = server.delete_project(int(data["cookie"]), int(data["pid"]))
    return jsonify({"message": res.msg, "success": res.success})

# -------- Project Members Management ---------------

@app.route("/project/add-members", methods=["POST"])
# expecting json with {cookie, pid, userNames}
def add_members():
    data = request.json
    res = server.add_members(int(data["cookie"]), int(data["pid"]), data["members"])
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/project/remove-member", methods=["POST"])
# expecting json with {cookie, pid, userName}
def remove_member():
    data = request.json
    res = server.remove_member(int(data["cookie"]), int(data["pid"]), data["member"])
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/project/members", methods=["GET"])
# expecting query params: cookie, pid
def get_members_of_project():
    cookie = request.args.get("cookie", type=int)
    pid = request.args.get("pid", type=int)
    res = server.get_members_of_project(cookie, pid)
    return jsonify({"message": res.msg, "success": res.success, "members": res.result if res.success else None})

@app.route("/project/members/approve", methods=["POST"])
# expecting json with {cookie, pid}
def approve_member():
    data = request.json
    res = server.approve_member(int(data["cookie"]), int(data["projId"]))
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/project/members/reject", methods=["POST"])
# expecting json with {cookie, pid}
def reject_member():
    data = request.json
    res = server.reject_member(int(data["cookie"]), int(data["projId"]))
    return jsonify({"message": res.msg, "success": res.success})

# -------- Project Information ---------------
@app.route("/projects", methods=["GET"])
def get_projects():
    try:
        cookie = request.args.get("cookie", type = int)
        
        res = server.get_projects_of_owner(cookie)
        
        # Make sure we're only sending serializable data
        return jsonify({
            "message": str(res.msg),  # Convert message to string explicitly
            "success": bool(res.success),  # Convert to bool explicitly
            "projects": list(res.result) if res.success and res.result else [],
        })
    except ValueError as e:
        return jsonify({
            "message": f"Invalid cookie format: {str(e)}", 
            "success": False
        }), 400
    except Exception as e:
        return jsonify({
            "message": f"Server error: {str(e)}", 
            "success": False
        }), 500

    # TODO: remove?
@app.route("/project/<int:pid>", methods=["GET"])
# expecting query param: cookie
def get_project(pid):
    cookie = request.args.get("cookie", type=int)
    res = server.get_project(cookie, pid)
    return jsonify({"message": res.msg, "success": res.success, "project": res.result if res.success else None})

@app.route("/project", methods=["GET"])
def get_project_by_name_and_desc():
    try:
        cookie = request.args.get("cookie", type = int)
        name = request.args.get("name")
        desc = request.args.get("desc")
        res = server.get_project_by_name_and_desc(cookie, name, desc)
        
        # Make sure we're only sending serializable data
        return jsonify({
            "message": str(res.msg),  # Convert message to string explicitly
            "success": bool(res.success),  # Convert to bool explicitly
            "project": res.result if res.success and res.result else None,
        })
    except ValueError as e:
        return jsonify({
            "message": f"Invalid cookie format: {str(e)}", 
            "success": False
        }), 400
    except Exception as e:
        return jsonify({
            "message": f"Server error: {str(e)}", 
            "success": False
        }), 500

@app.route("/project/pending-requests", methods=["GET"])
# expecting query param: cookie TODO
def get_pending_requests(): 
    cookie = request.args.get("cookie", type=int)
    res = server.get_pending_requests(cookie)
    return jsonify({"message": res.msg, "success": res.success, "requests": res.result if res.success else None})

@app.route("/project/to-invite", methods=["GET"])
def get_project_to_invite():
    try:
        cookie = request.args.get("cookie", type = int)
        pid = request.args.get("pid", type = int)
        res = server.get_project_to_invite(cookie, pid)
        
        # Make sure we're only sending serializable data
        return jsonify({
            "message": str(res.msg),  # Convert message to string explicitly
            "success": bool(res.success),  # Convert to bool explicitly
            "invites": res.result if res.success and res.result else [],
        })
    except ValueError as e:
        return jsonify({
            "message": f"Invalid cookie format: {str(e)}", 
            "success": False
        }), 400
    except Exception as e:
        return jsonify({
            "message": f"Server error: {str(e)}", 
            "success": False
        }), 500

@app.route("/project/pending-requests-project", methods=["GET"])
def get_pending_requests_for_project():
    try:
        cookie = request.args.get("cookie", type = int)
        pid = request.args.get("pid", type = int)
        res = server.get_pending_emails_for_project(cookie, pid)
        
        # Make sure we're only sending serializable data
        return jsonify({
            "message": str(res.msg),  # Convert message to string explicitly
            "success": bool(res.success),  # Convert to bool explicitly
            "emails": res.result if res.success and res.result else [],
        })
    except ValueError as e:
        return jsonify({
            "message": f"Invalid cookie format: {str(e)}", 
            "success": False
        }), 400
    except Exception as e:
        return jsonify({
            "message": f"Server error: {str(e)}", 
            "success": False
        }), 500

# -------- Voting and Scoring ---------------

# @app.route("/project/vote", methods=["POST"])
# # expecting json with {cookie, pid, factorsValues, severityFactorsValues}
# def vote():
#     data = request.json
#     res = server.vote(int(data["cookie"]), int(data["pid"]), data["factorValue"])
#     return jsonify({"message": res.msg, "success": res.success})

@app.route("/project/score", methods=["POST"])
def get_score():
    data = request.json
    res = server.get_score(int(data["cookie"]), int(data["pid"]), data["weights"])
    return jsonify({"message": res.msg, "success": res.success, "score": res.result if res.success else None})


@app.route("/project/vote_on_factor", methods=["POST"])
# expecting json with {cookie, pid, factorId, score}
def vote_on_factor():
    data = request.json
    res = server.vote_on_factor(int(data["cookie"]), int(data["pid"]), int(data["factorId"]), int(data["score"]))
    return jsonify({"message": res.msg, "success": res.success})


@app.route("/project/vote_on_severities", methods=["POST"])
def vote_on_severities():
    data = request.json
    res = server.vote_severities(int(data["cookie"]), int(data["pid"]), data["severityFactors"])
    return jsonify({"message": res.msg, "success": res.success})


@app.route("/project/get-projects-member", methods=["GET"])
def get_projects_member():
    cookie = request.args.get("cookie", type=int)
    res = server.get_projects_of_member(cookie)
    return jsonify({"message": res.msg, "success": res.success, "projects": res.result if res.success else None})

@app.route("/project/get-member-votes", methods=["GET"])
def get_member_votes():
    cookie = request.args.get("cookie", type=int)
    pid = request.args.get("pid", type=int)
    res = server.get_member_vote_on_project(cookie, pid)
    return jsonify({"message": res.msg, "success": res.success, "votes": res.result if res.success else None})

@app.route("/project/get-factor-votes", methods=["GET"])
def get_project_factors_votes():
    cookie = request.args.get("cookie", type=int)
    pid = request.args.get("pid", type=int)
    res = server.get_project_factors_votes(cookie, pid)
    return jsonify({"message": res.msg, "success": res.success, "votes": res.result if res.success else None})

@app.route("/admin/update-default-factor", methods=["POST"])
def admin_update_default_factor():
    data = request.json
    res = server.admin_change_default_factor(int(data["cookie"]), int(data["fid"]), data["name"], data["desc"],
                               data["scales_desc"], data["scales_explenation"])
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/admin/add-default-factor", methods=["POST"])
def admin_add_default_factor():
    data = request.json
    res = server.admin_add_default_factor(int(data["cookie"]), data["name"], data["desc"],
                               data["scales_desc"], data["scales_explenation"])
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/admin/remove-default-factor", methods=["POST"])
def admin_remove_default_factor():
    data = request.json
    res = server.admin_remove_default_factor(int(data["cookie"]), int(data["fid"]))
    return (jsonify({"message": res.msg, "success": res.success}))


@app.route("/admin/fetch-default-factors", methods=["GET", "POST"])
def admin_fetch_default_factors():
    data = request.json
    res = server.admin_fetch_default_factors(int(data["cookie"]))
    return jsonify({"message": res.msg, "success": res.success, "factors": res.result if res.success else None})


@app.route("/admin/fetch-default-severity-factors", methods=["GET", "POST"])
def admin_fetch_default_severity_factors():
    data = request.json
    res = server.admin_fetch_default_severity_factors(int(data["cookie"]))
    return jsonify({"message": res.msg, "success": res.success, "severity_factors": res.result if res.success else None})

@app.route("/fetch-default-severity-factors-full", methods=["GET"])
def fetch_default_severity_factors_full():
    cookie = int(request.args.get("cookie", 0))  # fallback to 0 or raise error if missing
    res = server.fetch_default_severity_factors_full(cookie)
    return jsonify({
        "message": res.msg,
        "success": res.success,
        "severity_factors": res.result if res.success else None
    })

@app.route("/admin/update-default-severity-factors", methods=["POST"])
def admin_update_default_severity_factors():
    data = request.json
    res = server.admin_update_default_severity_factors(int(data["cookie"]), data["severity_factors"])
    return jsonify({"result": res.result if res.success else None})

@app.route("/admin/update-terms-and-conditions", methods=["POST"])
def admin_update_terms_and_conditions():
    data = request.json
    print(f"trying to update tac: {data['updatedTXT']}")
    res = server.admin_update_terms_and_conditions(int(data["cookie"]), data["updatedTXT"])
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/admin/update-about", methods=["POST"])
def admin_update_about():
    data = request.json
    print(f"trying to update about: {data['updatedTXT']}")
    res = server.admin_update_about(int(data["cookie"]), data["updatedTXT"])
    return jsonify({"message": res.msg, "success": res.success})


@app.route("/admin/fetch-about", methods=["GET"])
def admin_fetch_about():
    cookie = request.args.get("cookie")
    res = server.fetch_about(int(cookie))
    return jsonify({"message": res.msg, "result": res.result})


@app.route("/get-research-projects", methods=["GET"])
def get_research_projects():
    cookie = int(request.args.get("cookie", 0))
    res = server.get_research_projects(cookie)
    return jsonify({
        "message": res.msg,
        "success": res.success,
        "projects": res.result if res.success else []
    })

@app.route("/remove-research-project", methods=["GET"])
def remove_research_project():
    cookie = int(request.args.get("cookie", 0))
    pid = int(request.args.get("pid", -1))
    res = server.remove_research_project(cookie, pid)
    return jsonify({
        "message": res.msg,
        "success": res.success
    })

@app.route("/is-valid-session", methods=["GET"])
def is_valid_session():
    try:
        cookie = int(request.args.get("cookie", 0))
        email = request.args.get("email", None)
        
        # Handle empty or "undefined" email values
        if email in ["undefined", ""]:
            email = None
            
        print(f"Checking session validity - Cookie: {cookie}, Email: {email}")
        
        res = server.is_valid_session(cookie, email)
        
        print(f"Session check result: {res.success} - {res.msg}")
        
        return jsonify({
            "message": res.msg,
            "success": res.success
        })
    except ValueError as e:
        print(f"Invalid cookie format: {str(e)}")
        return jsonify({
            "message": f"Invalid cookie format: {str(e)}",
            "success": False
        }), 400
    except Exception as e:
        print(f"Session check error: {str(e)}")
        return jsonify({
            "message": f"Server error: {str(e)}",
            "success": False
        }), 500

@app.route("/")
def hello():
    return jsonify({"msg": "hello"})

@socketio.on("connect")
def handle_connect():
    print("socket_connected")
    tac_data = server.tac_controller.get_current()
    emit("get_terms", tac_data)


@socketio.on("request_terms")
def handle_request_terms():
    tac_data = server.tac_controller.get_current()
    emit("get_terms", tac_data)

@app.route("/upload_profile_picture", methods=["POST"])
def upload_profile_picture():
    try:
        result = server.handle_upload_profile_picture(request.form, request.files)
        return jsonify(result)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Server error: {str(e)}", "success": False}), 500
    
@app.route("/get_profile_picture/<email>", methods=["GET"])
def get_profile_picture(email):
    try:
        result = server.handle_get_profile_picture(email)
        
        if result["success"]:
            if "redirect_url" in result:
                # Redirect to Cloudinary URL
                return redirect(result["redirect_url"])
            elif "default_avatar" in result:
                # Return generated avatar
                return send_file(result["default_avatar"], mimetype='image/png')
        
        # Fallback - return transparent pixel
        transparent_pixel = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x00\x00\x02\x00\x01\xf4\xb5U\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
        return FlaskResponse(transparent_pixel, mimetype='image/png')
        
    except Exception as e:
        traceback.print_exc()
        print(f"Error retrieving profile picture: {e}")
        
        # Return a transparent pixel as fallback
        transparent_pixel = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x00\x00\x02\x00\x01\xf4\xb5U\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
        return FlaskResponse(transparent_pixel, mimetype='image/png')
    
@app.route("/fetch_google_profile_picture", methods=["POST"])
def fetch_google_profile_picture():
    """
    Endpoint to fetch the user's Google profile picture
    Expects JSON with { "cookie": "...", "tokenId": "...", "source": "..." }
    """
    try:
        result = server.handle_fetch_google_profile_picture(request.json)
        return jsonify(result)
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "message": f"Error fetching Google profile picture: {str(e)}",
            "success": False
        }), 500
    
@app.route("/get_profile_source", methods=["GET"])
def get_profile_source():
    try:
        result = server.handle_get_profile_source(request.args)
        return jsonify(result)
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "message": f"Server error: {str(e)}",
            "success": False
        }), 500

# run the backed server
if __name__ == "__main__":
    Base.metadata.create_all(engine)
    FactorsPool.insert_defaults()

    server = Server(socketio)
    # running the server
    # app.run(debug=True, port=5555)  # when debug mode runs only 1 thread
    socketio.run(app,port=5555)  # when debug mode runs only 1 thread
    # app.run(threaded=True, port=5555)  # runs multithreaded



