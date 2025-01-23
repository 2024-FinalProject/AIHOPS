import unittest

from DAL.Objects.DBFactors import DBFactors
from Domain.src.DS.FactorsPool import FactorsPool, DEFAULT_FACTORS
from Domain.src.DS import FactorsPool as FP
from Domain.src.ProjectModule.Project import DEFAULT_SEVERITY_FACTORS
from Domain.src.Server import Server
from Service.config import Base, engine
import copy
from sqlalchemy import event

import random

# How to run the tests:
# In a terminal, run:
#   cd AIHOPS
#   python3 -m unittest test_project

class ProjectTests(unittest.TestCase):
    # ------------- Base ------------------

    def setUp(self) -> None:
        Base.metadata.create_all(engine)  # must initialize the database
        FP.insert_defaults()
        self.server = Server()
        self.cookie1 = self.server.enter().result.cookie
        self.cookie2 = self.server.enter().result.cookie
        self.server.register(self.cookie1, "Alice", "")
        self.server.register(self.cookie2, "Bob", "")

    def tearDown(self) -> None:
        self.server.clear_db()
        FP.insert_defaults()

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

    def create_project(self, cookie, user, project_name, project_desc, use_defaults):
        res = self.server.create_project(cookie, project_name, project_desc, use_defaults)
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

    def start_and_create_project(self, use_defaults=False):
        self.create_server()
        self.register_all()
        cookie1 = self.server.enter().result.cookie
        self.login(cookie1, self.AliceCred)
        pid = self.create_project(cookie1, self.AliceCred, *self.p1_data, use_defaults)
        return cookie1, pid



  

    def start_project_with_bob_member(self, publish= True):
        cookie, pid = self.start_and_create_project()
        self.server.add_member(cookie, pid, self.BobCred[0])
        self.set_default_factors_for_project(cookie, pid)
        self.set_default_severity_factors_for_project(cookie, pid)
        self.server.confirm_project_factors(cookie, pid)
        self.server.confirm_project_severity_factors(cookie, pid)
        if publish:
            self.server.publish_project(cookie, pid)
            cookie_bob = self.server.enter().result.cookie
            self.login(cookie_bob, self.BobCred)
            res = self.server.approve_member(cookie_bob, pid)
            self.assertTrue(res.success, f"user bob failed to be approved member {res.msg}")
            return cookie, cookie_bob, pid
        return cookie, pid

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



    def test_get_score(self):
        cookie_alice, cookie_bob, pid = self.start_project_with_bob_member()

        factors = self.server.get_project_factors(cookie_bob, pid).result
        factor_ids = [factor["id"] for factor in factors]
        votes = [random.randint(1, 4) for _ in range(len(factor_ids))]
        factor_votes = {}
        for i in range(len(factor_ids)):
            self.server.vote_on_factor(cookie_bob, pid, factor_ids[i], votes[i])
            factor_votes[factor_ids[i]] = votes[i]

        # vote on severities
        severity_votes = [50, 30, 10, 7, 3]
        self.server.vote_severities(cookie_bob, pid, severity_votes)

        res = self.server.get_score(cookie_alice, pid)
        self.assertTrue(res.success, f"failed to get score {res.msg}")


    def test_project_default_factors_success(self):
        self.create_server()
        self.register_all()
        cookie1 = self.server.enter().result.cookie
        self.login(cookie1, self.AliceCred)

        pid = self.server.create_project(cookie1, *self.p1_data, True).result
        default_factors_list_dicts = [f.to_dict() for f in DEFAULT_FACTORS]

        factors = self.server.get_project_factors(cookie1, pid).result
        severity_factors = self.server.get_project_severity_factors(cookie1, pid).result

        self.assertTrue(factors == default_factors_list_dicts, f"default factors not entered")
        self.assertTrue(severity_factors == DEFAULT_SEVERITY_FACTORS, f"default severity factors not entered")

        self.server = Server()
        cookie1 = self.server.enter().result.cookie
        self.login(cookie1, self.AliceCred)

        factors = self.server.get_project_factors(cookie1, pid).result
        self.assertTrue(len(factors) == len(DEFAULT_FACTORS), f"number of factors loaded: {len(factors)}, expected {len(DEFAULT_FACTORS)}")
        for factor in default_factors_list_dicts:
            self.assertTrue(factor in factors, f"factor {factor} not loaded")

        severity_factors = self.server.get_project_severity_factors(cookie1, pid).result
        self.assertTrue(severity_factors == DEFAULT_SEVERITY_FACTORS, f"default severity factors not loaded correctly")




    def test_update_factor(self):
        cookie_alice, cookie_bob, pid = self.start_project_with_bob_member()
        factors = self.server.get_project_factors(cookie_alice, pid).result

        factor_old = copy.deepcopy(random.choice(factors))
        new_fields = ["new name", "new desc"]

        res = self.server.update_factor(cookie_alice, factor_old["id"], *new_fields)
        self.assertTrue(res.success, f"failed to update factor {res.msg}")

        # check factor updated in factor pool
        factors = self.server.get_factor_pool_of_member(cookie_alice).result
        self._check_factor_updated(factors, cookie_alice, factor_old, new_fields)

        # check factor updated in project
        factors = self.server.get_project_factors(cookie_alice, pid).result
        self._check_factor_updated(factors, cookie_alice, factor_old, new_fields)

    def _check_factor_updated(self, factors, cookie_alice, factor_old, new_fields):
        self.assertFalse(factor_old in factors, f"old factor is still in factors pool for alice")
        found = False
        for f in factors:
            if f["id"] == factor_old["id"]:
                self.assertTrue(f["description"] == new_fields[1], f"factor desc not updated")
                self.assertTrue(f["name"] == new_fields[0], f"factor name not updated")
                found = True
                break
        self.assertTrue(found, f"factor not found")

    def test_update_factor_after_db_loaded(self):
        cookie_alice, cookie_bob, pid = self.start_project_with_bob_member()
        factors = self.server.get_project_factors(cookie_alice, pid).result

        factor_old = copy.deepcopy(random.choice(factors))
        new_fields = ["new name", "new desc"]

        self.server = Server()
        cookie_alice = self.enter_login(self.AliceCred)

        res = self.server.update_factor(cookie_alice, factor_old["id"], *new_fields)
        self.assertTrue(res.success, f"failed to update factor {res.msg}")

        # check factor updated in factor pool
        factors = self.server.get_factor_pool_of_member(cookie_alice).result
        self._check_factor_updated(factors, cookie_alice, factor_old, new_fields)

        # check factor updated in project
        factors = self.server.get_project_factors(cookie_alice, pid).result
        self._check_factor_updated(factors, cookie_alice, factor_old, new_fields)

        # check again
        self.server = Server()
        cookie_alice = self.enter_login(self.AliceCred)
        # check factor updated in factor pool
        factors = self.server.get_factor_pool_of_member(cookie_alice).result
        self._check_factor_updated(factors, cookie_alice, factor_old, new_fields)

        # check factor updated in project
        factors = self.server.get_project_factors(cookie_alice, pid).result
        self._check_factor_updated(factors, cookie_alice, factor_old, new_fields)


    # def test_update_factor_not_exist(self):
    #     ...
    #
    # def test_update_factor_published_project(self):
    #     ...
    #
    # def test_update_factor_project_not_exists(self):
    #     ...
    #
    # def test_update_factor_not_owner_of_project(self):
    #     ...

    def test_get_member_vote_success(self):
        c, cookie, pid = self.start_project_with_bob_member()
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

    
    def test_get_member_vote_no_member(self):
        cooike, pid = self.start_and_create_project()
        
        # enter with a new member
        invaild_cookie = self.server.enter().result.cookie
        self.server.register(invaild_cookie, "Charlie", "")
        self.login(invaild_cookie, ["Charlie", ""])

        # get the vote with invalid member
        res = self.server.get_member_vote_on_project(invaild_cookie, pid)   

        self.assertFalse(res.success, f"Actor Charlie not in project {pid}" )
    
    def test_get_member_vote_no_project(self):
        c, cookie, pid = self.start_project_with_bob_member()

        res = self.server.get_member_vote_on_project(cookie, pid + 1)
        self.assertFalse(res.success, f"Got vote on project that doesn't exist")
    

    def test_get_member_vote_no_vote(self):
        c, cookie, pid = self.start_project_with_bob_member()

        # get the vote with invalid member
        res = self.server.get_member_vote_on_project(cookie, pid)  

        self.assertTrue(res.success, f"Got vote on project that has no votes")

        factors_votes = res.result["factor_votes"] 
        severity_votes = res.result["severity_votes"]

        self.assertTrue(factors_votes == {}, f"Got vote on project that has no votes")
        self.assertTrue(severity_votes == [], f"Got vote on project that has no votes")


    def test_create_project_failure_duplicate_published(self):
        c, cookie, pid1 = self.start_project_with_bob_member()
        res = self.server.create_project(cookie, *self.p1_data)
        pid2 = res.result

        self.server.publish_project(cookie, pid1)
        res = self.server.publish_project(cookie, pid2)

        self.assertFalse(res.success, f"Can not publish 2 projects with the same name and desc")


    def test_add_project_factor_success(self):
        cookie1, pid = self.start_and_create_project()
        self.set_default_factors_for_project(cookie1, pid)


        # reload server
        self.server = Server()
        cookie1 = self.server.enter().result.cookie
        self.login(cookie1, self.AliceCred)
        projects = self.get_projects_dict(self.server)

        self.assertTrue(projects is not None)
        project = projects.get(pid)
        res = project.get_factors(self.AliceCred[0])
        self.assertTrue(len(res.result) == 4)

        factors = res.result

        for i in range(len(factors)):
            self.assertTrue(factors[i].name == self.factors[i][0])
            self.assertTrue(factors[i].description == self.factors[i][1])


    def test_add_project_factor_fail_not_owner(self):
        c, cookie, pid = self.start_project_with_bob_member()
        cookie2 = self.server.enter().result.cookie
        self.login(cookie2, self.BobCred)
        res = self.server.add_project_factor(cookie2, pid, "factor1", "desc1")
        self.assertFalse(res.success, f"Bob added factor to alices project")

    def test_add_project_factor_fail_project_doesnt_exists(self):
        c, cookie, pid = self.start_project_with_bob_member()
        res = self.server.add_project_factor(cookie, pid + 1, "factor1", "desc1")
        self.assertFalse(res.success, f"Added factor to project that doesn't exist") 
    
    def test_add_project_factors_multiple_success(self):
        cookie1, pid = self.start_and_create_project()
        for i in range(4):
            res = self.server.add_project_factor(cookie1, pid, self.factors[i][0], self.factors[i][1])
            self.assertTrue(res.success, f"failed to add factor {self.factors[i]}")
        
        # reload server
        self.server = Server()
        cookie1 = self.server.enter().result.cookie
        self.login(cookie1, self.AliceCred)
        projects = self.get_projects_dict(self.server)
        self.assertTrue(projects is not None)
        project = projects.get(pid)
        res = project.get_factors(self.AliceCred[0])
        factors = res.result
        for i in range(len(factors)):
            self.assertTrue(factors[i].name == self.factors[i][0])
            self.assertTrue(factors[i].description == self.factors[i][1])
    

        
    def test_remove_project_factor_success(self):
        cookie1, pid = self.start_and_create_project()
        self.set_default_factors_for_project(cookie1, pid)
        factors = self.server.get_project_factors(cookie1, pid).result
        factor = random.choice(factors)
        res = self.server.delete_project_factor(cookie1, pid, factor["id"])
        self.assertTrue(res.success, f"failed to remove factor {factor}")

        # reload server
        self.server = Server()
        cookie1 = self.server.enter().result.cookie
        self.login(cookie1, self.AliceCred)
        projects = self.get_projects_dict(self.server)
        self.assertTrue(projects is not None)
        project = projects.get(pid)
        res = project.get_factors(self.AliceCred[0])
        factors = res.result
        self.assertFalse(factor in factors, f"factor {factor} still in project")
    
    def test_remove_project_factor_fail_no_factor(self):
        cookie1, pid = self.start_and_create_project()
        res = self.server.delete_project_factor(cookie1, pid, 0)
        self.assertFalse(res.success, f"removed factor that doesn't exist")

    def test_remove_project_factor_fail_not_owner(self):
        c, cookie, pid = self.start_project_with_bob_member()
        factors = self.server.get_project_factors(cookie, pid).result
        factor = random.choice(factors)
        cookie2 = self.server.enter().result.cookie
        self.login(cookie2, self.BobCred)
        res = self.server.delete_project_factor(cookie2, pid, factor["id"])
        self.assertFalse(res.success, f"Bob removed factor from alices project")

    
    def test_set_severity_factors_success(self):
        cookie1, pid = self.start_and_create_project()
        self.set_default_severity_factors_for_project(cookie1, pid)

        # reload server
        self.server = Server()

        cookie1 = self.server.enter().result.cookie
        self.login(cookie1, self.AliceCred)
        projects = self.get_projects_dict(self.server)
        self.assertTrue(projects is not None)
        project = projects.get(pid)
        res = project.get_severity_factors()
        self.assertTrue(res.result == self.severities)

    
    def test_update_project_name_and_desc_Serializable_success(self):
        cookie, pid = self.start_project_with_bob_member(False)
        new_name = "new name"
        new_desc = "new desc"
        res = self.server.update_project_name_and_desc(cookie, pid, new_name, new_desc)
        self.assertTrue(res.success, f"failed to update project name {res.msg}")

        # reload server
        self.server = Server()
        cookie = self.server.enter().result.cookie
        self.login(cookie, self.AliceCred)
        projects = self.get_projects_dict(self.server)
        self.assertTrue(projects is not None)
        project = projects.get(pid)
        self.assertTrue([project.name, project.desc] == [new_name, new_desc])

        res = self.server.publish_project(cookie, pid)
        self.assertTrue(res.success, f"failed to publish project {res.msg}")

        # try to update project name and desc after publish
        new_name = "new name2"
        new_desc = "new desc2"
        res = self.server.update_project_name_and_desc(cookie, pid, new_name, new_desc)
        self.assertFalse(res.success, f"updated project name or desc after publish")
        
    
    def _get_all_project_members_lists(self, pid):
        pendings = self.server.project_manager._get_pending_emails_by_projects_list(pid)
        project_to_invite = self.server.project_manager.projects.get(pid).to_invite_when_published.list
        project_members = self.server.project_manager.projects.get(pid).members.list
        return pendings, project_to_invite, project_members

    def test_add_member_b4_publish_fail_no_project(self):
        cookie_alice, pid = self.start_and_create_project()
        res = self.server.add_member(cookie_alice, 12, "bob")
        self.assertFalse(res.success, f"failed to fail add member \n res: {res.msg} \n pid is invalid: 12")
        self._assert_member_not_added_in_any_way_to_project(pid, "bob")


    def _assert_member_not_added_in_any_way_to_project(self, pid, member):
        pendings, project_to_invite, project_members = self._get_all_project_members_lists(pid)
        self.assertFalse("bob" in pendings, "bob added to pending even tho invalid project")
        self.assertFalse("bob" in project_to_invite, "bob added to to_invite even tho invalid project")
        self.assertFalse("bob" in project_members, "bob added to members even tho invalid project")

    def test_add_member_b4_publish_fail_wrong_cookie(self):
        cookie_alice, pid = self.start_and_create_project()
        cookie = self.server.enter().result.cookie
        res = self.server.add_member(cookie, pid, "bob")
        self.assertFalse(res.success, f"failed to fail add member, cookie is not project owners")
        self._assert_member_not_added_in_any_way_to_project(pid, "bob")


    def test_add_member_b4_publish_success(self):
        cookie_alice, pid = self.start_and_create_project()
        # try to add member b4 publish
        res = self.server.add_member(cookie_alice, pid, "bob")
        # verify it only added into the to_invite list inside project, not in members and not in invited
        pendings, project_to_invite, project_members = self._get_all_project_members_lists(pid)

        self.assertFalse("bob" in pendings, "bob added to pending, project not published")
        self.assertTrue("bob" in project_to_invite, "bob not added to to_invite")
        self.assertFalse("bob" in project_members, "bob added to members, project not published")

        self.server = Server()
        pendings, project_to_invite, project_members = self._get_all_project_members_lists(pid)

        self.assertFalse("bob" in pendings, "bob added to pending, project not published")
        self.assertTrue("bob" in project_to_invite, "bob not added to to_invite")
        self.assertFalse("bob" in project_members, "bob added to members, project not published")

    def test_remove_member_b4_publish(self):
        cookie_alice, pid = self.start_and_create_project()
        # try to add member b4 publish
        res = self.server.add_member(cookie_alice, pid, "bob")

        self.server.remove_member(cookie_alice, pid, "bob")
        self._assert_member_not_added_in_any_way_to_project(pid, "bob")
        self.server = Server()
        self._assert_member_not_added_in_any_way_to_project(pid, "bob")

    def _enter_create_project_defaults_publish(self):
        cookie_alice, pid = self.start_and_create_project(use_defaults=True)
        self.server.add_member(cookie_alice, pid, "bob")
        self.server.confirm_project_factors(cookie_alice, pid)
        self.server.confirm_project_severity_factors(cookie_alice, pid)
        res = self.server.publish_project(cookie_alice, pid)
        return cookie_alice, pid

    def test_publish_success(self):
        cookie_alice, pid = self._enter_create_project_defaults_publish()

        # self.server.publish_project(cookie_alice, pid)
        pendings, project_to_invite, project_members = self._get_all_project_members_lists(pid)

        self.assertTrue("bob" in pendings, "bob not added to pending, project published")
        self.assertFalse("bob" in project_to_invite, "bob in to_invite")
        self.assertFalse("bob" in project_members, "bob added to members, project published but bob not approved")

    def test_add_member_fail_duplicate_member_b4_publish(self):
        cookie_alice, pid = self.start_and_create_project(use_defaults=True)
        self.server.add_member(cookie_alice, pid, "bob")
        res = self.server.add_member(cookie_alice, pid, "bob")
        self.assertFalse(res.success, "added duplicate member")

    def test_add_member_fail_duplicate_member_after_publish(self):
        cookie_alice, cookie_bob, pid = self.start_project_with_bob_member()
        res = self.server.add_member(cookie_alice, pid, self.BobCred[0])
        self.assertFalse(res.success, "added duplicate member")


    def test_add_member_fail_duplicate_member_after_publish_member_approved(self):
        cookie_alice, cookie_bob, pid = self.start_project_with_bob_member()
        self.server.approve_member(cookie_bob, pid)
        res = self.server.add_member(cookie_alice, pid, self.BobCred[0])
        self.assertFalse(res.success, "added duplicate member")

    def test_confirm_factors_without_any(self):
        cookie_alice, pid = self.start_and_create_project()
        res = self.server.confirm_project_factors(cookie_alice, pid)
        self.assertFalse(res.success, "confirmed project factors, without factors")

    def test_publish_fails_factors_not_confirmed(self):
        cookie_alice, pid = self.start_and_create_project(use_defaults=True)
        self.server.add_member(cookie_alice, pid, "bob")
        self.server.confirm_project_severity_factors(cookie_alice, pid)
        res = self.server.publish_project(cookie_alice, pid)
        self.assertFalse(res.success, "published project witout comfirming factors")

    def test_publish_fails_severities_not_confirmed(self):
        cookie_alice, pid = self.start_and_create_project(use_defaults=True)
        self.server.add_member(cookie_alice, pid, "bob")
        self.server.confirm_project_factors(cookie_alice, pid)
        res = self.server.publish_project(cookie_alice, pid)
        self.assertFalse(res.success, "published project witout comfirming severity factors")

    def test_publish_fails_no_members_to_invite(self):
        cookie_alice, pid = self.start_and_create_project(use_defaults=True)
        self.server.confirm_project_factors(cookie_alice, pid)
        self.server.confirm_project_severity_factors(cookie_alice, pid)
        res = self.server.publish_project(cookie_alice, pid)
        self.assertFalse(res.success, "published project witout any members to invite")


    def test_remove_member_after_publish(self):
        cookie_alice, pid = self._enter_create_project_defaults_publish()
        res = self.server.remove_member(cookie_alice, pid, "bob")
        self.assertTrue(res.success, "failed to removed member")
        self._assert_member_not_added_in_any_way_to_project(pid, "bob")


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













