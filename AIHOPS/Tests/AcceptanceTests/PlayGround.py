from Domain.src.Server import Server
from Service.config import Base, engine

if __name__ == '__main__':
    Base.metadata.create_all(engine)  # must initialize the database
    server = Server()
    cookie1 = server.enter().result.cookie
    cookie2 = server.enter().result.cookie
    server.register(cookie1, "alice", "")
    server.register(cookie2, "sus_approved", "")
    server.login(cookie2, "sus_approved", "")
    server.login(cookie1, "alice", "")
    server.create_project(cookie1, "alice", "desc", True)
    server.confirm_project_factors(cookie1, 0)
    server.confirm_project_severity_factors(cookie1, 0)
    server.add_member(cookie1, 0, "sus_approved")
    server.add_member(cookie1, 0, "sus_pending")
    server.publish_project(cookie1, 0)
    server.approve_member(cookie2, 0)

    server.archive_project(cookie1, 0)
    res = server.add_member(cookie1, 0, "after")
    print("sus")
    # server.update_project_name_and_desc(cookie1, 0, "asd", "desc")


    # cookie2 = server.enter().result.cookie
    # server.register(cookie1, "Alice", "")
    # server.register(cookie2, "Bob", "")
    #
    # server.login(cookie1, "Alice", "")
    # res = server.create_project(cookie1, "Project1", "Description1")
    # project_id = res.result
    # project_id = 0

    # server.set_project_factors(cookie1, project_id,
    #                                 [["factor1", "desc1"], ["factor2", "desc2"], ["factor3", "desc3"],
    #                                  ["factor4", "desc4"]])
    # server.set_project_severity_factors(cookie1, project_id, [1, 2, 3, 4, 5])
    # server.publish_project(cookie1, project_id)
    # res = server.add_members(cookie1, project_id, ["Bob", "Bob"])

    # login_bob_res = server.login(cookie2, "Bob", "")
    # approve_res = server.approve_member(cookie2, project_id)
    # vote_res = server.vote(cookie2, project_id, [1,1,1,1], [10,70,10,5,5])
    print("sus")