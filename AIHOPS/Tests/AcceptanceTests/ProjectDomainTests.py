import unittest
from Domain.src.Server import Server
from Service.config import Base, engine

import random

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
        for f in self.factors:
            self.server.add_project_factor(cookie, pid, f[0], f[1])

    def set_default_severity_factors_for_project(self, cookie, pid):
        self.server.set_project_severity_factors(cookie, pid, self.severities)

    def start_and_create_project(self):
        self.create_server()
        self.register_all()
        cookie1 = self.server.enter().result.cookie
        self.login(cookie1, self.AliceCred)
        pid = self.create_project(cookie1, self.AliceCred, *self.p1_data)
        return cookie1, pid


    def start_project_with_bob_member(self):
        cookie, pid = self.start_and_create_project()
        self.server.add_member(cookie, pid, self.BobCred[0])
        self.set_default_factors_for_project(cookie, pid)
        self.set_default_severity_factors_for_project(cookie, pid)
        self.server.confirm_project_factors(cookie, pid)
        self.server.confirm_project_severity_factors(cookie, pid)
        self.server.publish_project(cookie, pid)

        cookie_bob = self.server.enter().result.cookie
        self.login(cookie_bob, self.BobCred)
        res = self.server.approve_member(cookie_bob, pid)
        self.assertTrue(res.success, f"user bob failed to be approved member {res.msg}")
        return cookie_bob, pid

    # ------------- Project ------------------

    def test_create_project_success(self):
        cookie1, pid = self.start_and_create_project()
        projects = self.get_projects_dict(self.server)
        self.assertTrue(projects is not None)
        project = projects.get(pid)
        self.assertTrue([project.name, project.desc] == self.p1_data)

    def test_create_project_failure_no_name(self):
        cookie1, pid = self.start_and_create_project()
        self.create_project_fail(cookie1, pid, "", "sus")

    def test_create_project_failure_no_desc(self):
        cookie1, pid = self.start_and_create_project()
        self.create_project_fail(cookie1, pid, "sus", None)


    def test_get_member_vote_success(self):
        cookie, pid = self.start_project_with_bob_member()
        factors = self.server.get_project_factors(cookie, pid).result
        factor_ids = [factor["id"] for factor in factors]
        votes = [random.randint(0, 4) for _ in range(len(factor_ids))]
        factor_votes = {}
        for i in range(len(factor_ids)):
            self.server.vote_on_factor(cookie, pid, factor_ids[i], votes[i])
            factor_votes[factor_ids[i]] = votes[i]

        # vote on severities
        severity_votes = [50,30,10,7,3]
        self.server.vote_severities(cookie, pid, severity_votes)

        # reload server so everything loaded from db
        self.server = Server()

        # get_member_votes of bob on alices project, veirfy correctness
        cookie = self.server.enter().result.cookie
        self.login(cookie, self.BobCred)
        res = self.server.get_member_vote_on_project(cookie, pid)
        self.assertTrue(res.success, f"user {pid} failed to get vote on project {pid}, {res.msg}")

        fetched_factor_votes = res.result["factor_votes"]
        fetched_severity_votes = res.result["severity_votes"]

        self.assertTrue(factor_votes == fetched_factor_votes, f"factor votes: expected: {factor_votes}, actual: {fetched_factor_votes}")
        self.assertTrue(severity_votes == fetched_severity_votes, f"severity votes: expected: {severity_votes}, actual: {fetched_severity_votes}")

    def text_get_member_vote_no_member(self):
        ...

    def text_get_member_vote_no_project(self):
        ...

    def text_get_member_vote_no_vote(self):
        ...

    # def test_create_project_failure_duplicate_published(self):
    #     ...



    # def test_add_project_factor_success(self):
    #     cookie1, pid = self.start_and_create_project()
    #     self.set_default_factors_for_project(cookie1, pid)
    #     projects = self.get_projects_dict(self.server)
    #     self.assertTrue(projects is not None)
    #     project = projects.get(pid)
    #     self.assertTrue(project.get_factors == self.defa)

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













