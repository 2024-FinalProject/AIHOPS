from DAL.Objects.DBFactors import DBFactors
from Domain.src.DS import FactorsPool
from Domain.src.Server import Server
from Service.config import app
from flask import Flask, request, jsonify
from Service.config import Base, engine
from sqlalchemy import event

from flask_cors import CORS

app = Flask(__name__)


CORS(app)


# --------  init session and user management ---------------

# server = Server()

@app.route("/enter", methods=["GET"])
def start_session():
    res = server.enter()
    print("from service server: " + str(res.result.cookie))
    return jsonify({"cookie": str(res.result.cookie)})


@app.route("/register", methods=["POST"])
# excpecting json with {cookie, user_name, passwd}
def register():
    data = request.json
    print("trying to register in service server")
    res = server.register(int(data["cookie"]), data["userName"], data["passwd"])
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/verify", methods=["POST"])
# excpecting json with {cookie, user_name, passwd, code}
def verify():
    data = request.json
    print("trying to verify in service server")
    res = server.verify(int(data["cookie"]), data["userName"], data["passwd"], data["code"])
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/verify_automatic", methods=["POST"])
# excpecting json with {cookie, token}
def verify_automatic():
    data = request.json
    print("trying to verifyAutomatic in service server")
    res = server.verify_automatic(int(data["cookie"]), data["token"])
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    res  = server.login(int(data["cookie"]), data["userName"], data["passwd"])
    out  = {"message": res.msg, "success": res.success}
    if res.success:
        member = server.user_controller.members.get(data["userName"])
        out["termsAccepted"] = bool(member.terms_accepted)
    return jsonify(out)

@app.route("/logout", methods=["POST"])
# expecting json with {cookie}
def logout():
    data = request.json
    res = server.logout(int(data["cookie"]))
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/google_login", methods=["POST"])
def google_login():
    data = request.json
    res = server.google_login(int(data["cookie"]), data["tokenId"])
    response_data = {"message": res.msg, "success": res.success}
    
    if res.success and hasattr(res, 'result') and isinstance(res.result, dict) and 'email' in res.result:
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

# -------- Project Management ---------------

@app.route("/project/create", methods=["POST"])
# expecting json with {cookie, name, description}
def create_project():
    data = request.json
    res = server.create_project(int(data["cookie"]), data["name"], data["description"], bool(data["defaultFactors"]))
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

@app.route("/")
def hello():
    return jsonify({"msg": "hello"})

# run the backed server
if __name__ == "__main__":
    Base.metadata.create_all(engine)
    FactorsPool.insert_defaults()

    server = Server()
    # running the server
    app.run(debug=True, port=5555)  # when debug mode runs only 1 thread
    # app.run(threaded=True, port=5555)  # runs multithreaded

