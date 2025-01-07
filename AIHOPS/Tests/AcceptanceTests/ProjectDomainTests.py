import unittest
from Domain.src.Server import Server
from Service.config import Base, engine


# How to run the tests:
# In a terminal, run:
#   cd AIHOPS
#   python3 -m unittest test_project

class ProjectTests(unittest.TestCase):
    # ------------- Base ------------------

    def setUp(self) -> None:
        Base.metadata.create_all(engine)  # must initialize the database
        self.server = Server()
        self.cookie1 = self.server.enter().result.cookie
        self.cookie2 = self.server.enter().result.cookie
        self.server.register(self.cookie1, "Alice", "")
        self.server.register(self.cookie2, "Bob", "")

    def tearDown(self) -> None:
        # TODO:
        # 1) Remove the registered users (all of them, including those in the setUp) from the database
        # 2) Remove the organizations created in the tests
        self.server.clear_db()
        pass  # TODO: remove this line after adding the function above

    def text_enter(self):
        res = self.server.enter()
        self.assertTrue(res.success, f'Enter failed')

    def create_server(self):
        self.server = Server()
        self.AliceCred = ["Alice", ""]
        self.BobCred = ["Bob", ""]
        self.EveCred = ["Eve", ""]

        self.p1_data = ["project1", "desc1"]
        self.p2_data = ["project2", "desc2"]
        self.cookie = self.server.enter().result.cookie

        self.factors = [["factor1", "desc1"], ["factor2", "desc2"], ["factor3", "desc3"], ["factor4", "desc4"]]
        self.severities = [1, 2, 3, 4, 5]

    def register_alice_bob(self):
        self.server.register(self.cookie, *self.AliceCred)
        self.server.register(self.cookie, *self.BobCred)

    def register_all(self):
        self.server.register(self.cookie, *self.AliceCred)
        self.server.register(self.cookie, *self.BobCred)
        self.server.register(self.cookie, *self.EveCred)

    def create_project(self, cookie, user, project_name, project_desc):
        res = self.server.create_project(cookie, project_name, project_desc)
        self.assertTrue(res.success, f"failed to create project {project_name} user: {user}, {res.msg}")
        return res.result

    def create_project_fail(self, cookie, user, project_name, project_desc):
        res = self.server.create_project(cookie, project_name, project_desc)
        self.assertFalse(res.success,
                         f"created project {project_name}, {project_desc} user: {user}, when should have failed")

    def login(self, cookie, user):
        res = self.server.login(cookie, *user)
        self.assertTrue(res.success, f"user {user} failed to login {res.msg}")

    def enter_login(self, user):
        cookie = self.server.enter().result.cookie
        res = self.server.login(cookie, *user)
        self.assertTrue(res.success, f"user {user} failed to login {res.msg}")
        return cookie

    def get_projects_dict(self, server):
        return server.project_manager.projects

    def add_member_to_project(self, cookie, pid, user_names):
        return self.server.add_members(cookie, pid, user_names)

    def approve_members_to_project(self, cookies, pid, user_names):
        for i in range(len(cookies)):
            res = self.server.approve_member(cookies[i], pid)
            print("")

    def set_default_factors_for_project(self, cookie, pid):
        self.server.set_project_factors(cookie, pid, self.factors)

    def set_default_severity_factors_for_project(self, cookie, pid):
        self.server.set_project_severity_factors(cookie, pid, self.severities)

    def start_and_create_project(self):
        self.create_server()
        self.register_all()
        cookie1 = self.server.enter().result.cookie
        self.login(cookie1, self.AliceCred)
        pid = self.create_project(cookie1, self.AliceCred, *self.p1_data)
        return cookie1, pid

    # ------------- Project ------------------

    def test_create_project_success(self):
        cookie1, pid = self.start_and_create_project()
        projects = self.get_projects_dict(self.server)
        self.assertTrue(projects is not None)
        project = projects.get(pid)
        self.assertTrue([project.name, project.desc] == self.p1_data)

    # def test_create_project_failure_no_name(self):
    #     ...
    # def test_create_project_failure_no_desc(self):
    #     ...
    # def test_create_project_failure_duplicate_published(self):
    #     ...
    #
    # def test_add_project_factor_success(self):
    #     ...
    #
    # def test_add_project_factor_fail_not_owner(self):
    #
    # def test_add_project_factor_fail_project_doesnt_exists(self):
    #
    # def test_add_project_factors_multiple_success(self):
    #
    # def test_remove_project_factor_success(self):
    #
    # def test_remove_project_factor_fail_no_factor(self):
    #
    # def test_set_severity_factors_success(self):
    #     ...
    #
    # def test_update_project_name_and_desc_Serializable_success(self):
    #
    # def test_add_member_b4_publish(self):
    # def test_remove_member_b4_publish(self):
    #
    # def test_publish_success(self):
    # def test_publish_fails(self):
    #
    # def test_add_member_after_publish(self):
    # def test_remove_member_after_publish(self):
    #
    # def test_remove_dactors/set_severity_factors after test_remove_member_b4_publish()
    #
    # def test_pending projects/email
    #
    # def test_approve\reject_member b4 publish
    #
    # def test_approve\reject_member after publish
    #
    # def test_vote_fail_not_puclished factor/severity
    #
    # def test_vote_on_factor
    # def test_vote_on_severity
    #
    # def test_archive_project













