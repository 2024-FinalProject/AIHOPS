from Domain.src.Server import Server
from Service.config import app
from flask import Flask, request, jsonify
from Service.config import Base, engine

from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://127.0.0.1:5173", "http://localhost:5173"]}})

# --------  init session and user management ---------------

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
    

@app.route("/login", methods=["POST"])
# excpecting json with {cookie, user_name, passwd}
def login():
    data = request.json
    res = server.login(int(data["cookie"]), data["userName"], data["passwd"])
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/logout", methods=["POST"])
# expecting json with {cookie}
def logout():
    data = request.json
    res = server.logout(int(data["cookie"]))
    return jsonify({"message": res.msg, "success": res.success})

# -------- Project Management ---------------

@app.route("/project/create", methods=["POST"])
# expecting json with {cookie, name, description}
def create_project():
    data = request.json
    res = server.create_project(int(data["cookie"]), data["name"], data["description"])
    return jsonify({"message": res.msg, "success": res.success, "project_id": res.result if res.success else None})

@app.route("/project/factors", methods=["POST"])
# expecting json with {cookie, pid, factors}
def set_project_factors():
    data = request.json
    res = server.set_project_factors(int(data["cookie"]), int(data["pid"]), data["factors"])
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/project/severity-factors", methods=["POST"])
# expecting json with {cookie, pid, severityFactors}
def set_project_severity_factors():
    data = request.json
    res = server.set_project_severity_factors(int(data["cookie"]), int(data["pid"]), data["severityFactors"])
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/project/publish", methods=["POST"])
# expecting json with {cookie, pid}
def publish_project():
    data = request.json
    res = server.publish_project(int(data["cookie"]), int(data["pid"]))
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/project/close", methods=["POST"])
# expecting json with {cookie, pid}
def close_project():
    data = request.json
    res = server.close_project(int(data["cookie"]), int(data["pid"]))
    return jsonify({"message": res.msg, "success": res.success})

# -------- Project Members Management ---------------

@app.route("/project/members/add", methods=["POST"])
# expecting json with {cookie, pid, userNames}
def add_members():
    data = request.json
    res = server.add_members(int(data["cookie"]), int(data["pid"]), data["userNames"])
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/project/members/remove", methods=["POST"])
# expecting json with {cookie, pid, userName}
def remove_member():
    data = request.json
    res = server.remove_member(int(data["cookie"]), int(data["pid"]), data["userName"])
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
    res = server.approve_member(int(data["cookie"]), int(data["pid"]))
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/project/members/reject", methods=["POST"])
# expecting json with {cookie, pid}
def reject_member():
    data = request.json
    res = server.reject_member(int(data["cookie"]), int(data["pid"]))
    return jsonify({"message": res.msg, "success": res.success})

# -------- Project Information ---------------
@app.route("/projects", methods=["GET"])
def get_projects():
    try:
        cookie = request.args.get("cookie", type = int)
        
        res = server.get_projects(cookie)
        
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
# expecting query param: cookie
def get_pending_requests():
    cookie = request.args.get("cookie", type=int)
    res = server.get_pending_requests(cookie)
    return jsonify({"message": res.msg, "success": res.success, "requests": res.result if res.success else None})

# -------- Voting and Scoring ---------------

@app.route("/project/vote", methods=["POST"])
# expecting json with {cookie, pid, factorsValues, severityFactorsValues}
def vote():
    data = request.json
    res = server.vote(int(data["cookie"]), int(data["pid"]), data["factorsValues"], data["severityFactorsValues"])
    return jsonify({"message": res.msg, "success": res.success})

@app.route("/project/score", methods=["GET"])
# expecting query params: cookie, pid
def get_score():
    cookie = request.args.get("cookie", type=int)
    pid = request.args.get("pid", type=int)
    res = server.get_score(cookie, pid)
    return jsonify({"message": res.msg, "success": res.success, "score": res.result if res.success else None})

# run the backed server
if __name__ == "__main__":
    Base.metadata.create_all(engine)

    server = Server()
    # running the server
    app.run(debug=True, port=5555)  # when debug mode runs only 1 thread
    # app.run(threaded=True, port=5555)  # runs multithreaded