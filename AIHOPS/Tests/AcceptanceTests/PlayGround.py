from Domain.src.Server import Server
from Service.config import Base, engine

if __name__ == '__main__':
    Base.metadata.create_all(engine)  # must initialize the database
    server = Server()
    cookie1 = server.enter().result.cookie
    cookie2 = server.enter().result.cookie
    server.register(cookie1, "Alice", "")
    server.register(cookie2, "Bob", "")

    server.login(cookie1, "Alice", "")
    res = server.create_project(cookie1, "Project1", "Description1")
    project_id = res.result
    server.set_project_factors(cookie1, project_id,
                                    [["factor1", "desc1"], ["factor2", "desc2"], ["factor3", "desc3"],
                                     ["factor4", "desc4"]])
    server.set_project_severity_factors(cookie1, project_id, [1, 2, 3, 4, 5])
    server.publish_project(cookie1, project_id)
    res = server.add_members(cookie1, project_id, ["Bob", "Bob"])