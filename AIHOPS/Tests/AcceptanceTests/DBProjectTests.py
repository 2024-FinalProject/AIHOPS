import unittest
from Domain.src.Server import Server
from Service.config import Base, engine

class DBProjectTests(unittest.TestCase):



    def setUp(self) -> None:
        Base.metadata.create_all(engine)
        self.server = None

    def tearDown(self) -> None:
        self.server.clear_db()

    def create_server(self):
        self.server = Server()
        self.AliceCred = ["Alice", ""]
        self.BobCred = ["Bob", ""]
        self.EveCred = ["Eve", ""]

        self.p1_data = ["project1", "desc1"]
        self.p2_data = ["project2", "desc2"]
        self.cookie = self.server.enter().result.cookie

        self.factors = [["factor1", "desc1"], ["factor2", "desc2"], ["factor3", "desc3"], ["factor4", "desc4"]]
        self.severities = [1,2,3,4,5]


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
        self.assertFalse(res.success, f"created project {project_name}, {project_desc} user: {user}, when should have failed")

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
        return  self.server.add_members(cookie, pid, user_names)

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

    def test_insert_basic_project_check_if_loaded_happy(self):
        cookie1, pid = self.start_and_create_project()

        self.server = Server()
        projects = self.get_projects_dict(self.server)
        projects_loaded = projects.size()
        self.assertTrue(projects_loaded == 1, f"projects_loaded == {projects_loaded} but should be 1")

        p1 = self.server.project_manager.projects.get(pid)
        #check name and description
        name = p1.name
        desc = p1.desc
        self.assertTrue(self.p1_data[0] == name and self.p1_data[1] == desc, f"expected: {name}, {desc}, got: {self.p1_data[0]}, {self.p1_data[1]}")
        self.assertTrue(self.server.project_manager.project_id_maker.next_id() > pid, "incorrect pid after load")

    # #TODO: prob1, adjust
    # def test_insert_basic_project_check_if_loaded_sad(self):
    #     # adding same project twice making sure the second 1 is not persisted
    #     cookie1, pid = self.start_and_create_project()
    #     self.create_project_fail(cookie1, self.AliceCred, *self.p1_data)
    #
    #     self.server = Server()
    #     projects = self.get_projects_dict(self.server)
    #     projects_loaded = projects.size()
    #     self.assertTrue(projects_loaded == 1, f"projects_loaded == {projects_loaded} but should be 1")


    def test_factors_loading(self):
        cookie1, pid = self.start_and_create_project()

        factors = [["factor1", "desc1"], ["factor2", "desc2"], ["factor3", "desc3"], ["factor4", "desc4"]]
        self.server.set_project_factors(cookie1, pid, factors)

        self.server = Server()
        projects = self.get_projects_dict(self.server)
        project = projects.get(pid)
        factors_loaded = project.vote_manager.get_factors()
        amount_loaded = len(factors_loaded)
        self.assertTrue(amount_loaded == len(factors), f"incorrect factors num, expected {len(factors)}, got {amount_loaded}")
        self.assertFalse(project.factors_inited, "factors inited field is True even tho factors are not yet confirmed")
        self.assertFalse(project.is_published(), "loaded project is active, expected -> not Active")
        factors_loaded = project.vote_manager.get_factors()
        for factor in factors_loaded:
            self.assertTrue([factor.name, factor.description] in factors, f"factor not loaded: {factor.name}, {factor.description}")


    def test_severities_loading(self):
        cookie1, pid = self.start_and_create_project()

        severities = [1,2,3,4,5]
        self.server.set_project_severity_factors(cookie1, pid, severities)

        self.server = Server()
        projects = self.get_projects_dict(self.server)
        project = projects.get(pid)
        self.assertFalse(project.severity_factors_inited, "severity_factors_factors inited field is True even tho severity factors not confirmed")
        self.assertFalse(project.is_published(), "loaded project is active, expected -> not Active")
        severities_loaded = project.severity_factors

        self.assertTrue(severities_loaded == severities, f"severities not loaded correctly expected: {severities}, got: {severities_loaded}")

    def create_project_with_default_factors_and_severities(self):
        cookie1, pid = self.start_and_create_project()
        self.set_default_factors_for_project(cookie1, pid)
        self.set_default_severity_factors_for_project(cookie1, pid)
        return cookie1, pid

    def test_to_invite_loading(self):
        cookie1, pid = self.create_project_with_default_factors_and_severities()
        self.server = Server()
        cookie1 = self.server.enter().result.cookie
        self.login(cookie1, self.AliceCred)
        self.add_member_to_project(cookie1, pid, ["bob"])
        self.server = Server()

        projects = self.get_projects_dict(self.server)
        project = projects.get(pid)
        self.assertTrue(project.to_invite_when_published.pop() == "bob", "")

    def test_loading_pending(self):
        cookie1, pid = self.create_project_with_default_factors_and_severities()
        self.add_member_to_project(cookie1, pid, [self.EveCred[0], self.BobCred[0]])
        self.server.confirm_project_factors(cookie1, pid)
        self.server.confirm_project_severity_factors(cookie1, pid)
        self.server.publish_project(cookie1, pid)
        # reload server and check pending list
        self.server = Server()
        pending = self.server.project_manager.pending_requests
        pending_amount = pending.size()
        self.assertTrue(pending_amount == 2, "")
        pendings_for_email_1 = pending.get(self.EveCred[0])
        pendings_for_email_2 = pending.get(self.BobCred[0])
        self.assertTrue(pendings_for_email_1 == [pid] and pendings_for_email_2 == [pid], f"")


    def test_loading_project_members(self):
        cookie1, pid = self.create_project_with_default_factors_and_severities()
        # add members
        self.add_member_to_project(cookie1, pid, [self.EveCred[0], self.BobCred[0]])
        res1 = self.server.confirm_project_factors(cookie1, pid)
        res2 = self.server.confirm_project_severity_factors(cookie1, pid)
        res3 = self.server.publish_project(cookie1, pid)

        self.server = Server()

        cookie_bob = self.enter_login(self.BobCred)
        cookie_eve = self.enter_login(self.EveCred)
        res = self.approve_members_to_project([cookie_eve, cookie_bob], pid, [self.EveCred[0], self.BobCred[0]])

        # reload server and check pending list
        self.server = Server()
        pending = self.server.project_manager.pending_requests
        pending_amount = pending.size()
        self.assertTrue(pending_amount == 0, "")

        members = self.server.project_manager.projects.get(pid).members
        members_amount = members.size()
        self.assertTrue(3 == members_amount, f"")

        self.assertTrue(not members.contains(self.BobCred[0]) or not not members.contains(self.EveCred[0]), f"")

    def test_loading_member_votes(self):
        cookie1, pid = self.create_project_with_default_factors_and_severities()
        self.add_member_to_project(cookie1, pid, [self.EveCred[0], self.BobCred[0]])
        res1 = self.server.confirm_project_factors(cookie1, pid)
        res2 = self.server.confirm_project_severity_factors(cookie1, pid)
        res3 = self.server.publish_project(cookie1, pid)
        # add members
        cookie_bob = self.enter_login(self.BobCred)
        cookie_eve = self.enter_login(self.EveCred)
        self.approve_members_to_project([cookie_eve, cookie_bob], pid, [self.EveCred[0], self.BobCred[0]])

        self.server = Server()
        cookie_bob = self.enter_login(self.BobCred)
        bobs_factor_scores = [1, 2, 3, 4]
        bobs_severity_votes = [45, 25, 15, 10, 5]
        cookie_eve = self.enter_login(self.EveCred)

        factors = self.server.get_project_factors(cookie_bob, pid).result
        for i in range(len(factors)):
            self.server.vote_on_factor(cookie_bob, pid, factors[i].fid, bobs_factor_scores[i])
        self.server.vote_severities(cookie_bob, pid, bobs_severity_votes)

        # self.server.vote(cookie_bob, pid, [1, 2, 3, 4], [45, 25, 15, 10, 5])
        # self.server.vote(cookie_eve, pid, [0, 1, 2, 3], [40, 30, 30, 0, 0])

        # reload server and check pending list
        self.server = Server()
        pending = self.server.project_manager.pending_requests
        pending_amount = pending.size()
        self.assertTrue(pending_amount == 0, "")

        members = self.server.project_manager.projects.get(pid).members
        members_amount = members.size()
        self.assertTrue(3 == members_amount, f"")

        # bob = members.get(self.BobCred[0])
        # bob_factor_votes_loaded = [value for key, value in sorted(bob[0].items())]
        # eve = members.get(self.EveCred[0])
        # eve_factor_votes = [value for key, value in sorted(eve[0].items())]
        # self.assertTrue(bob_factor_votes == [1, 2, 3, 4] and bob[1] == [45, 25, 15, 10, 5], f"")
        # self.assertTrue(eve_factor_votes == [0, 1, 2, 3]and eve[1] == [40, 30, 30, 0, 0] , f"")









