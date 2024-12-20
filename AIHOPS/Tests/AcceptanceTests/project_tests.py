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

 # ------------- Project ------------------

    def test_create_project_success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        self.assertTrue(res.success, res.msg)

    def test_create_project_fail_empty_cookie(self):
        res = self.server.create_project(None, "Project1", "Description1", "Alice")
        self.assertFalse(res.success, f'Create project succeeded when it should have failed - empty cookie')

    def test_create_project_fail_not_logged_in(self):
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        self.assertFalse(res.success, f'Create project succeeded when it should have failed - not logged in')

    def test_create_project_fail_existing_and_active_project(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, ["factor1, factor2, factor3, factor4"])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id, "Alice")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")       
        self.assertFalse(res.success, f'Create project succeeded when it should have failed - existing and active project')

    def test_create_project_success_existing_and_not_active__duplicate_projects(self):
        self.server.login(self.cookie1, "Alice", "")
        self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        self.assertTrue(res.success, f'Create project failed when it should have succeeded - existing and not active duplicate projects')

    def test_create_project_fail_empty_name(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "", "Description1", "Alice")
        self.assertFalse(res.success, f'Create project succeeded when it should have failed - empty name')

    def test_create_project_fail_empty_description(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "", "Alice")
        self.assertFalse(res.success, f'Create project succeeded when it should have failed - empty description')

    def test_create_project_fail_empty_founder(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "")
        self.assertFalse(res.success, f'Create project succeeded when it should have failed - empty founder')
    
    def test_set_project_factors_success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        res = self.server.set_project_factors(self.cookie1, project_id, ["factor1, factor2, factor3, factor4"])
        self.assertTrue(res.success, res.msg)

    def test_set_project_factors_fail_empty_cookie(self):
        res = self.server.set_project_factors(None, 1, ["factor1, factor2, factor3, factor4"])
        self.assertFalse(res.success, f'Set project factors succeeded when it should have failed - empty cookie')
    
    def test_set_project_factors_fail_not_logged_in(self):
        res = self.server.set_project_factors(self.cookie1, 1, ["factor1, factor2, factor3, factor4"])
        self.assertFalse(res.success, f'Set project factors succeeded when it should have failed - not logged in')

    def test_set_project_factors_fail_project_not_found(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.set_project_factors(self.cookie1, -999, ["factor1, factor2, factor3, factor4"])
        self.assertFalse(res.success, f'Set project factors succeeded when it should have failed - project not found')

    def test_set_project_factors_fail_empty_factors(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        res = self.server.set_project_factors(self.cookie1, project_id, [])
        self.assertFalse(res.success, f'Set project factors succeeded when it should have failed - empty factors')
    
    def test_set_project_severity_factors_success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        res = self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        self.assertTrue(res.success, res.msg)

    def test_set_project_severity_factors_fail_empty_cookie(self):
        res = self.server.set_project_severity_factors(None, 1, [1, 2, 3, 4, 5])
        self.assertFalse(res.success, f'Set project severity factors succeeded when it should have failed - empty cookie')

    def test_set_project_severity_factors_fail_not_logged_in(self):
        res = self.server.set_project_severity_factors(self.cookie1, 1, [1, 2, 3, 4, 5])
        self.assertFalse(res.success, f'Set project severity factors succeeded when it should have failed - not logged in')

    def test_set_project_severity_factors_fail_project_not_found(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.set_project_severity_factors(self.cookie1, -999, [1, 2, 3, 4, 5])
        self.assertFalse(res.success, f'Set project severity factors succeeded when it should have failed - project not found')

    def test_set_project_severity_factors_fail_empty_severity_factors(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        res = self.server.set_project_severity_factors(self.cookie1, project_id, [])
        self.assertFalse(res.success, f'Set project severity factors succeeded when it should have failed - empty severity factors')

    def test_set_project_severity_factors_fail_negative_severity_factors(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        res = self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, -5])
        self.assertFalse(res.success, f'Set project severity factors succeeded when it should have failed - negative severity factors')

    def test_set_project_severity_factors_fail_less_than_5_severity_factors(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        res = self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4])
        self.assertFalse(res.success, f'Set project severity factors succeeded when it should have failed - less than 5 severity factors')

    def test_set_project_severity_factors_fail_more_than_5_severity_factors(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        res = self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5, 6])
        self.assertFalse(res.success, f'Set project severity factors succeeded when it should have failed - more than 5 severity factors')

    def test_add_member_success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, ["factor1, factor2, factor3, factor4"])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id, "Alice")
        res = self.server.add_members(self.cookie1, "Alice", project_id, ["Bob"])
        self.assertTrue(res.success, res.msg)

    def test_add_member_fail_adding_existing_member_twice(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, ["factor1, factor2, factor3, factor4"])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id, "Alice")
        res = self.server.add_members(self.cookie1, "Alice", project_id, ["Bob", "Bob"])
        self.assertFalse(res.success, res.msg)

    def test_add_member_fail_empty_cookie(self):
        res = self.server.add_members(None, "Alice", 1, ["Bob"])
        self.assertFalse(res.success, f'Add member succeeded when it should have failed - empty cookie')

    def test_add_member_fail_not_logged_in(self):
        res = self.server.add_members(self.cookie1, "Alice", 1, ["Bob"])
        self.assertFalse(res.success, f'Add member succeeded when it should have failed - not logged in')
    
    def test_add_member_fail_project_not_found(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.add_members(self.cookie1, "Alice", -999, ["Bob"])
        self.assertFalse(res.success, f'Add member succeeded when it should have failed - project not found')

    def test_add_member_fail_project_not_published(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, ["factor1, factor2, factor3, factor4"])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        res = self.server.add_members(self.cookie1, "Alice", project_id, ["Bob"])
        self.assertFalse(res.success, f'Add member succeeded when it should have failed - project not published')

    def test_add_member_fail_project_not_finalized(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        self.server.publish_project(self.cookie1, project_id, "Alice")
        res = self.server.add_members(self.cookie1, "Alice", project_id, ["Bob"])
        self.assertFalse(res.success, f'Add member succeeded when it should have failed - project not finalized')

    def test_publish_project_success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, ["factor1, factor2, factor3, factor4"])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        res = self.server.publish_project(self.cookie1, project_id, "Alice")
        self.assertTrue(res.success, res.msg)

    def test_publish_project_fail_empty_cookie(self):
        res = self.server.publish_project(None, 1, "Alice")
        self.assertFalse(res.success, f'Publish project succeeded when it should have failed - empty cookie')

    def test_publish_project_fail_not_logged_in(self):
        res = self.server.publish_project(self.cookie1, 1, "Alice")
        self.assertFalse(res.success, f'Publish project succeeded when it should have failed - not logged in')

    def test_publish_project_fail_project_not_found(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.publish_project(self.cookie1, -999, "Alice")
        self.assertFalse(res.success, f'Publish project succeeded when it should have failed - project not found')

    def test_publish_project_fail_project_not_finalized(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        res = self.server.publish_project(self.cookie1, project_id, "Alice")
        self.assertFalse(res.success, f'Publish project succeeded when it should have failed - project not finalized')

    def test_publish_project_fail_project_already_published(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, ["factor1, factor2, factor3, factor4"])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id, "Alice")
        res = self.server.publish_project(self.cookie1, project_id, "Alice")
        self.assertFalse(res.success, f'Publish project succeeded when it should have failed - project already published')

    def test_publish_project_fail_dupicated_projects_created_then_one_is_published_and_second_tries_publish_too(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, ["factor1, factor2, factor3, factor4"])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        res_2 = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id_2 = res_2.result
        self.server.set_project_factors(self.cookie1, project_id_2, ["factor1, factor2, factor3, factor4"])
        self.server.set_project_severity_factors(self.cookie1, project_id_2, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id, "Alice")
        res_2 = self.server.publish_project(self.cookie1, project_id_2, "Alice")
        self.assertFalse(res_2.success, res_2.msg)

    def test_close_project_success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, ["factor1, factor2, factor3, factor4"])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id, "Alice")
        res = self.server.close_project(self.cookie1, project_id)
        self.assertTrue(res.success, res.msg)

    def test_close_project_fail_empty_cookie(self):
        res = self.server.close_project(None, 1)
        self.assertFalse(res.success, f'Close project succeeded when it should have failed - empty cookie')

    def test_close_project_fail_not_logged_in(self):
        res = self.server.close_project(self.cookie1, 1)
        self.assertFalse(res.success, f'Close project succeeded when it should have failed - not logged in')

    def test_close_project_fail_project_not_found(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.close_project(self.cookie1, -999)
        self.assertFalse(res.success, f'Close project succeeded when it should have failed - project not found')

    def test_close_project_fail_project_not_published(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        res = self.server.close_project(self.cookie1, project_id)
        self.assertFalse(res.success, f'Close project succeeded when it should have failed - project not published')

    def test_close_project_fail_project_already_closed(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, ["factor1, factor2, factor3, factor4"])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id, "Alice")
        self.server.close_project(self.cookie1, project_id)
        res = self.server.close_project(self.cookie1, project_id)
        self.assertFalse(res.success, f'Close project succeeded when it should have failed - project already closed')
    
    def test_remove_member_success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, ["factor1, factor2, factor3, factor4"])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id, "Alice")
        self.server.add_members(self.cookie1, "Alice", project_id, ["Bob"])
        res = self.server.remove_member(self.cookie1, "Alice", project_id, "Bob")
        self.assertTrue(res.success, res.msg)

    def test_remove_member_fail_empty_cookie(self):
        res = self.server.remove_member(None, "Alice", 1, "Bob")
        self.assertFalse(res.success, f'Remove member succeeded when it should have failed - empty cookie')

    def test_remove_member_fail_not_logged_in(self):
        res = self.server.remove_member(self.cookie1, "Alice", 1, "Bob")
        self.assertFalse(res.success, f'Remove member succeeded when it should have failed - not logged in')

    def test_remove_member_fail_project_not_found(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.remove_member(self.cookie1, "Alice", -999, "Bob")
        self.assertFalse(res.success, f'Remove member succeeded when it should have failed - project not found')

    def test_remove_member_fail_non_existent_member(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, ["factor1, factor2, factor3, factor4"])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id, "Alice")
        res = self.server.remove_member(self.cookie1, "Alice", project_id, "Bob")
        self.assertFalse(res.success, res.msg)

    def test_remove_member_fail_empty_asking(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.remove_member(self.cookie1, "", 1, "Bob")
        self.assertFalse(res.success, f'Remove member succeeded when it should have failed - empty asking')

    def test_remove_member_fail_asking_not_found(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.remove_member(self.cookie1, "Alice", 1, "Bob")
        self.assertFalse(res.success, f'Remove member succeeded when it should have failed - asking not found')
    
    def test_get_members_of_project_success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, ["factor1, factor2, factor3, factor4"])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id, "Alice")
        self.server.add_members(self.cookie1, "Alice", project_id, ["Bob"])
        res = self.server.get_members_of_project(self.cookie1, "Alice", project_id)
        self.assertTrue(res.success, res.msg)

    def test_get_members_of_project_fail_empty_cookie(self):
        res = self.server.get_members_of_project(None, "Alice", 1)
        self.assertFalse(res.success, f'Get members of project succeeded when it should have failed - empty cookie')

    def test_get_members_of_project_fail_not_logged_in(self):
        res = self.server.get_members_of_project(self.cookie1, "Alice", 1)
        self.assertFalse(res.success, f'Get members of project succeeded when it should have failed - not logged in')

    def test_get_members_of_project_fail_project_not_found(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.get_members_of_project(self.cookie1, "Alice", -999)
        self.assertFalse(res.success, f'Get members of project succeeded when it should have failed - project not found')

    def test_get_projects_success(self):
        self.server.login(self.cookie1, "Alice", "")
        self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        res = self.server.get_projects(self.cookie1, "Alice")
        self.assertTrue(res.success, res.msg)

    def test_get_projects_fail_empty_cookie(self):
        res = self.server.get_projects(None, "Alice")
        self.assertFalse(res.success, f'Get projects succeeded when it should have failed - empty cookie')

    def test_get_projects_fail_not_logged_in(self):
        res = self.server.get_projects(self.cookie1, "Alice")
        self.assertFalse(res.success, f'Get projects succeeded when it should have failed - not logged in')

    def test_get_projects_fail_no_projects(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.get_projects(self.cookie1, "Alice")
        self.assertFalse(res.success, f'Get projects succeeded when it should have failed - no projects')

    def test_vote_success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, ["factor1, factor2, factor3, factor4"])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id, "Alice")
        res = self.server.vote(self.cookie1, project_id, "Alice", [2, 3, 4, 1], [0.15, 0.15, 0.1, 0.1, 0.5])
        self.assertTrue(res.success, res.msg)

    #Should update the vote of the user
    def test_vote_success_double_vote_same_project_same_user(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, ["factor1, factor2, factor3, factor4"])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id, "Alice")
        self.server.vote(self.cookie1, project_id, "Alice", [2, 3, 4, 1], [0.15, 0.15, 0.1, 0.1, 0.5])
        res = self.server.vote(self.cookie1, project_id, "Alice", [2, 1, 2, 1], [0.2, 0.1, 0.1, 0.1, 0.5])
        self.assertTrue(res.success, res.msg)

    def test_vote_fail_empty_cookie(self):
        res = self.server.vote(None, 1, "Alice", [2, 3, 4, 1], [0.15, 0.15, 0.1, 0.1, 0.5])
        self.assertFalse(res.success, f'Vote succeeded when it should have failed - empty cookie')

    def test_vote_fail_not_logged_in(self):
        res = self.server.vote(self.cookie1, 1, "Alice", [2, 3, 4, 1], [0.15, 0.15, 0.1, 0.1, 0.5])
        self.assertFalse(res.success, f'Vote succeeded when it should have failed - not logged in')

    def test_vote_fail_project_not_found(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.vote(self.cookie1, -999, "Alice", [2, 3, 4, 1], [0.15, 0.15, 0.1, 0.1, 0.5])
        self.assertFalse(res.success, f'Vote succeeded when it should have failed - project not found')

    def test_vote_fail_project_not_published(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, ["factor1, factor2, factor3, factor4"])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        res = self.server.vote(self.cookie1, project_id, "Alice", [2, 3, 4, 1], [0.15, 0.15, 0.1, 0.1, 0.5])
        self.assertFalse(res.success, f'Vote succeeded when it should have failed - project not published')

    def test_vote_fail_factor_values_not_in_range_value_of_5(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, ["factor1, factor2, factor3, factor4"])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id, "Alice")
        res = self.server.vote(self.cookie1, project_id, "Alice", [5, 3, 4, 1], [0.15, 0.15, 0.1, 0.1, 0.5])
        self.assertFalse(res.success, res.msg)

    def test_vote_fail_factor_values_not_in_range_value_of_minues_1(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, ["factor1, factor2, factor3, factor4"])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id, "Alice")
        res = self.server.vote(self.cookie1, project_id, "Alice", [1, 3, 4, -1], [0.15, 0.15, 0.1, 0.1, 0.5])
        self.assertFalse(res.success, res.msg)

    def test_vote_fail_severity_factor_values_not_in_range_value_of_bigger_than_1(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, ["factor1, factor2, factor3, factor4"])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id, "Alice")
        res = self.server.vote(self.cookie1, project_id, "Alice", [1, 3, 4, 2], [1.01, 0.15, 0.1, 0.1, 0.5])
        self.assertFalse(res.success, res.msg)

    def test_vote_fail_severity_factor_values_not_in_range_value_of_smaller_than_1(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, ["factor1, factor2, factor3, factor4"])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id, "Alice")
        res = self.server.vote(self.cookie1, project_id, "Alice", [1, 3, 4, 2], [-0.01, 0.15, 0.1, 0.1, 0.5])
        self.assertFalse(res.success, res.msg)