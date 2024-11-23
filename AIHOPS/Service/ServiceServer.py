from Domain.src.Server import Server
from Service.config import app
from flask import request, jsonify
from Service.config import Base, engine

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


# run the backed server
if __name__ == "__main__":
    Base.metadata.create_all(engine)

    server = Server()
    # running the server
    app.run(debug=True, port=5555)