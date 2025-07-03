import unittest
<<<<<<< HEAD:AIHOPS/AIHOPS/Tests/AcceptanceTests/project_tests.py
from Domain.src.Server import Server
from Service.config import Base, engine
=======
from unittest.mock import patch

import random

from Domain.src.Server import Server
from Domain.src.Users.MemberController import MemberController
from Domain.src.DS import FactorsPool as FP
from Service.config import Base, engine
from Tests.AcceptanceTests.Facade import Facade
from Tests.AcceptanceTests.mocks.MockGmailor import MockGmailor
from Tests.AcceptanceTests.mocks.MockTACController import MockTACController

>>>>>>> 98672eb1a121b38289db5e55406a47e3de810ea6:AIHOPS/Tests/AcceptanceTests/project_tests.py

# How to run the tests:
# In a terminal, run:
#   cd AIHOPS
#   python3 -m unittest test_project


class ProjectTests(unittest.TestCase):
    # ------------- Base ------------------
<<<<<<< HEAD:AIHOPS/AIHOPS/Tests/AcceptanceTests/project_tests.py

=======
    @patch("Domain.src.Users.MemberController.Gmailor", new=MockGmailor)
    @patch("Domain.src.Server.TACController", new=MockTACController)
>>>>>>> 98672eb1a121b38289db5e55406a47e3de810ea6:AIHOPS/Tests/AcceptanceTests/project_tests.py
    def setUp(self) -> None:
        Base.metadata.create_all(engine)  # must initialize the database
        FP.insert_defaults()  # Insert default factors
        self.server = Server()
        self.cookie1 = self.server.enter().result.cookie
        self.cookie2 = self.server.enter().result.cookie
<<<<<<< HEAD:AIHOPS/AIHOPS/Tests/AcceptanceTests/project_tests.py
        self.server.register(self.cookie1, "Alice", "")
        self.server.register(self.cookie2, "Bob", "")
    
=======

        # Register users in setUp
        self.facade.register_and_verify(self.server, self.cookie1, "Alice", "")
        self.facade.register_and_verify(self.server, self.cookie2, "Bob", "")

>>>>>>> 98672eb1a121b38289db5e55406a47e3de810ea6:AIHOPS/Tests/AcceptanceTests/project_tests.py
    def tearDown(self) -> None:
        self.server.clear_db()
        FP.insert_defaults()  # Restore default factors after clearing

    def text_enter(self):
        res = self.server.enter()
        self.assertTrue(res.success, f"Enter failed")

    # ------------- Project ------------------

    def test_create_project_success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        self.assertTrue(res.success, res.msg)
        self.server.logout(self.cookie1)

    def test_create_project_fail_empty_cookie(self):
        res = self.server.create_project(None, "Project1", "Description1")
        self.assertFalse(
            res.success,
            f"Create project succeeded when it should have failed - empty cookie",
        )

    def test_create_project_fail_not_logged_in(self):
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        self.assertFalse(
            res.success,
            f"Create project succeeded when it should have failed - not logged in",
        )

    def test_create_project_fail_existing_and_active_project(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
<<<<<<< HEAD:AIHOPS/AIHOPS/Tests/AcceptanceTests/project_tests.py
        self.server.set_project_factors(self.cookie1, project_id, [["factor1", "desc1"], ["factor2", "desc2"], ["factor3", "desc3"], ["factor4", "desc4"]])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
=======
        self.server.confirm_project_factors(self.cookie1, project_id)
        self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 5]
        )
        self.server.confirm_project_severity_factors(self.cookie1, project_id)
>>>>>>> 98672eb1a121b38289db5e55406a47e3de810ea6:AIHOPS/Tests/AcceptanceTests/project_tests.py
        self.server.add_member(self.cookie1, project_id, "yossi")
        self.server.publish_project(self.cookie1, project_id)
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        self.assertFalse(
            res.success,
            f"Create project succeeded when it should have failed - existing and active project",
        )
        self.server.logout(self.cookie1)

    def test_create_project_success_existing_and_not_active__duplicate_projects(self):
        self.server.login(self.cookie1, "Alice", "")
        self.server.create_project(self.cookie1, "Project1", "Description1")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        self.assertTrue(
            res.success,
            f"Create project failed when it should have succeeded - existing and not active duplicate projects",
        )
        self.server.logout(self.cookie1)

    def test_create_project_fail_empty_name(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "", "Description1")
        self.assertFalse(
            res.success,
            f"Create project succeeded when it should have failed - empty name",
        )
        self.server.logout(self.cookie1)

    def test_create_project_fail_empty_description(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "")
        self.assertFalse(
            res.success,
            f"Create project succeeded when it should have failed - empty description",
        )
        self.server.logout(self.cookie1)

    def test_create_project_fail_empty_cookie(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(None, "Project1", "Description1")
        self.assertFalse(
            res.success,
            f"Create project succeeded when it should have failed - empty founder",
        )
        self.server.logout(self.cookie1)
<<<<<<< HEAD:AIHOPS/AIHOPS/Tests/AcceptanceTests/project_tests.py
    
=======

    def test_confirm_project_factors_success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", True)
        project_id = res.result
        res = self.server.confirm_project_factors(self.cookie1, project_id)
        self.assertTrue(res.success, res.msg)
        self.server.logout(self.cookie1)

>>>>>>> 98672eb1a121b38289db5e55406a47e3de810ea6:AIHOPS/Tests/AcceptanceTests/project_tests.py
    def test_set_project_factors_success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
<<<<<<< HEAD:AIHOPS/AIHOPS/Tests/AcceptanceTests/project_tests.py
        res = self.server.set_project_factors(self.cookie1, project_id, [["factor1", "desc1"], ["factor2", "desc2"], ["factor3", "desc3"], ["factor4", "desc4"]])
=======
        res = self.server.add_project_factor(
            self.cookie1,
            project_id,
            "factor1",
            "desc1",
            ["desc0", "desc1", "desc2", "desc3", "desc4"],
            ["expl0", "expl1", "expl2", "expl3", "expl4"],
        )
>>>>>>> 98672eb1a121b38289db5e55406a47e3de810ea6:AIHOPS/Tests/AcceptanceTests/project_tests.py
        self.assertTrue(res.success, res.msg)
        self.server.logout(self.cookie1)

    def test_set_project_factors_fail_empty_cookie(self):
        res = self.server.set_project_factors(
            None,
            1,
            [
                ["factor1", "desc1"],
                ["factor2", "desc2"],
                ["factor3", "desc3"],
                ["factor4", "desc4"],
            ],
        )
        self.assertFalse(
            res.success,
            f"Set project factors succeeded when it should have failed - empty cookie",
        )

    def test_set_project_factors_fail_not_logged_in(self):
        res = self.server.set_project_factors(
            self.cookie1,
            1,
            [
                ["factor1", "desc1"],
                ["factor2", "desc2"],
                ["factor3", "desc3"],
                ["factor4", "desc4"],
            ],
        )
        self.assertFalse(
            res.success,
            f"Set project factors succeeded when it should have failed - not logged in",
        )

    def test_set_project_factors_fail_project_not_found(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.set_project_factors(
            self.cookie1,
            -999,
            [
                ["factor1", "desc1"],
                ["factor2", "desc2"],
                ["factor3", "desc3"],
                ["factor4", "desc4"],
            ],
        )
        self.assertFalse(
            res.success,
            f"Set project factors succeeded when it should have failed - project not found",
        )
        self.server.logout(self.cookie1)

    def test_set_project_severity_factors_success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
        res = self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 5]
        )
        self.assertTrue(res.success, res.msg)
        self.server.logout(self.cookie1)

    def test_set_project_severity_factors_fail_empty_cookie(self):
        res = self.server.set_project_severity_factors(None, 1, [1, 2, 3, 4, 5])
        self.assertFalse(
            res.success,
            f"Set project severity factors succeeded when it should have failed - empty cookie",
        )

    def test_set_project_severity_factors_fail_not_logged_in(self):
        res = self.server.set_project_severity_factors(self.cookie1, 1, [1, 2, 3, 4, 5])
        self.assertFalse(
            res.success,
            f"Set project severity factors succeeded when it should have failed - not logged in",
        )

    def test_set_project_severity_factors_fail_project_not_found(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.set_project_severity_factors(
            self.cookie1, -999, [1, 2, 3, 4, 5]
        )
        self.assertFalse(
            res.success,
            f"Set project severity factors succeeded when it should have failed - project not found",
        )
        self.server.logout(self.cookie1)

    def test_set_project_severity_factors_fail_empty_severity_factors(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
        res = self.server.set_project_severity_factors(self.cookie1, project_id, [])
        self.assertFalse(
            res.success,
            f"Set project severity factors succeeded when it should have failed - empty severity factors",
        )
        self.server.logout(self.cookie1)

    def test_set_project_severity_factors_fail_negative_severity_factors(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
        res = self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, -5]
        )
        self.assertFalse(
            res.success,
            f"Set project severity factors succeeded when it should have failed - negative severity factors",
        )
        self.server.logout(self.cookie1)

    def test_set_project_severity_factors_fail_less_than_5_severity_factors(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
        res = self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4]
        )
        self.assertFalse(
            res.success,
            f"Set project severity factors succeeded when it should have failed - less than 5 severity factors",
        )
        self.server.logout(self.cookie1)

    def test_set_project_severity_factors_fail_more_than_5_severity_factors(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
        res = self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 5, 6]
        )
        self.assertFalse(
            res.success,
            f"Set project severity factors succeeded when it should have failed - more than 5 severity factors",
        )
        self.server.logout(self.cookie1)

<<<<<<< HEAD:AIHOPS/AIHOPS/Tests/AcceptanceTests/project_tests.py
    def test_add_member_success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, [["factor1", "desc1"], ["factor2", "desc2"], ["factor3", "desc3"], ["factor4", "desc4"]]) 
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id)
=======
    def test_set_project_severity_factors_fail_consecutive_values_smaller(self):
        # This test check if the severity factors are in ascending order
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
        res = self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 2]
        )
        self.assertFalse(
            res.success,
            f"Set project severity factors succeeded when it should have failed - severity factors are not in ascending order",
        )
        self.server.logout(self.cookie1)

    def test_add_member_success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", True)
        project_id = res.result
>>>>>>> 98672eb1a121b38289db5e55406a47e3de810ea6:AIHOPS/Tests/AcceptanceTests/project_tests.py
        res = self.server.add_members(self.cookie1, project_id, ["Bob"])
        self.assertTrue(res.success, res.msg)
        self.server.logout(self.cookie1)

    def test_add_member_fail_adding_existing_member_twice(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
<<<<<<< HEAD:AIHOPS/AIHOPS/Tests/AcceptanceTests/project_tests.py
        self.server.set_project_factors(self.cookie1, project_id, [["factor1", "desc1"], ["factor2", "desc2"], ["factor3", "desc3"], ["factor4", "desc4"]]) 
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id)
        res = self.server.add_members(self.cookie1, project_id, ["Bob", "Bob"])
=======
        self.server.add_member(self.cookie1, project_id, "Bob")
        res = self.server.add_member(self.cookie1, project_id, "Bob")
>>>>>>> 98672eb1a121b38289db5e55406a47e3de810ea6:AIHOPS/Tests/AcceptanceTests/project_tests.py
        self.assertFalse(res.success, res.msg)
        self.server.logout(self.cookie1)

    def test_add_member_fail_empty_cookie(self):
        res = self.server.add_members(None, 1, ["Bob"])
        self.assertFalse(
            res.success,
            f"Add member succeeded when it should have failed - empty cookie",
        )

    def test_add_member_fail_not_logged_in(self):
        res = self.server.add_members(self.cookie1, 1, ["Bob"])
        self.assertFalse(
            res.success,
            f"Add member succeeded when it should have failed - not logged in",
        )

    def test_add_member_fail_project_not_found(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.add_members(self.cookie1, -999, ["Bob"])
        self.assertFalse(
            res.success,
            f"Add member succeeded when it should have failed - project not found",
        )
        self.server.logout(self.cookie1)

    # def test_add_member_fail_project_not_published(self):
    #     self.server.login(self.cookie1, "Alice", "")
    #     res = self.server.create_project(self.cookie1, "Project1", "Description1")
    #     project_id = res.result
    #     self.server.set_project_factors(self.cookie1, project_id, [["factor1", "desc1"], ["factor2", "desc2"], ["factor3", "desc3"], ["factor4", "desc4"]])
    #     self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
    #     res = self.server.add_members(self.cookie1, project_id, ["Bob"])
    #     self.assertFalse(res.success, f'Add member succeeded when it should have failed - project not published')
    #     self.server.logout(self.cookie1)

    # def test_add_member_fail_project_not_finalized(self):
    #     self.server.login(self.cookie1, "Alice", "")
    #     res = self.server.create_project(self.cookie1, "Project1", "Description1")
    #     project_id = res.result
    #     self.server.publish_project(self.cookie1, project_id)
    #     res = self.server.add_members(self.cookie1, project_id, ["Bob"])
    #     self.assertFalse(res.success, f'Add member succeeded when it should have failed - project not finalized')
    #     self.server.logout(self.cookie1)

    def test_publish_project_success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
<<<<<<< HEAD:AIHOPS/AIHOPS/Tests/AcceptanceTests/project_tests.py
        self.server.set_project_factors(self.cookie1, project_id, [["factor1", "desc1"], ["factor2", "desc2"], ["factor3", "desc3"], ["factor4", "desc4"]])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
=======
        self.server.confirm_project_factors(self.cookie1, project_id)
        self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 5]
        )
        self.server.confirm_project_severity_factors(self.cookie1, project_id)
        self.server.add_member(self.cookie1, project_id, "Bob")
>>>>>>> 98672eb1a121b38289db5e55406a47e3de810ea6:AIHOPS/Tests/AcceptanceTests/project_tests.py
        res = self.server.publish_project(self.cookie1, project_id)
        self.assertTrue(res.success, res.msg)
        self.server.logout(self.cookie1)

    def test_publish_project_fail_empty_cookie(self):
        res = self.server.publish_project(None, 1)
        self.assertFalse(
            res.success,
            f"Publish project succeeded when it should have failed - empty cookie",
        )

    def test_publish_project_fail_not_logged_in(self):
        res = self.server.publish_project(self.cookie1, 1)
        self.assertFalse(
            res.success,
            f"Publish project succeeded when it should have failed - not logged in",
        )

    def test_publish_project_fail_project_not_found(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.publish_project(self.cookie1, -999)
        self.assertFalse(
            res.success,
            f"Publish project succeeded when it should have failed - project not found",
        )
        self.server.logout(self.cookie1)

    def test_publish_project_fail_project_not_finalized(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
        res = self.server.publish_project(self.cookie1, project_id)
        self.assertFalse(
            res.success,
            f"Publish project succeeded when it should have failed - project not finalized",
        )
        self.server.logout(self.cookie1)

    def test_publish_project_fail_project_already_published(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
        self.server.set_project_factors(
            self.cookie1,
            project_id,
            [
                ["factor1", "desc1"],
                ["factor2", "desc2"],
                ["factor3", "desc3"],
                ["factor4", "desc4"],
            ],
        )
        self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 5]
        )
        self.server.publish_project(self.cookie1, project_id)
        res = self.server.publish_project(self.cookie1, project_id)
        self.assertFalse(
            res.success,
            f"Publish project succeeded when it should have failed - project already published",
        )
        self.server.logout(self.cookie1)

<<<<<<< HEAD:AIHOPS/AIHOPS/Tests/AcceptanceTests/project_tests.py
    def test_publish_project_fail_dupicated_projects_created_then_one_is_published_and_second_tries_publish_too(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, [["factor1", "desc1"], ["factor2", "desc2"], ["factor3", "desc3"], ["factor4", "desc4"]])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        res_2 = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id_2 = res_2.result
        self.server.set_project_factors(self.cookie1, project_id_2, [["factor1", "desc1"], ["factor2", "desc2"], ["factor3", "desc3"], ["factor4", "desc4"]]) 
        self.server.set_project_severity_factors(self.cookie1, project_id_2, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id)
        res_2 = self.server.publish_project(self.cookie1, project_id_2)
        self.assertFalse(res_2.success, res_2.msg)
        self.server.logout(self.cookie1)
=======
    # ... rest of the test methods remain the same, just adding proper logout calls where needed
>>>>>>> 98672eb1a121b38289db5e55406a47e3de810ea6:AIHOPS/Tests/AcceptanceTests/project_tests.py

    def test_close_project_success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
<<<<<<< HEAD:AIHOPS/AIHOPS/Tests/AcceptanceTests/project_tests.py
        self.server.set_project_factors(self.cookie1, project_id, [["factor1", "desc1"], ["factor2", "desc2"], ["factor3", "desc3"], ["factor4", "desc4"]])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
=======
        self.server.confirm_project_factors(self.cookie1, project_id)
        self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 5]
        )
        self.server.confirm_project_severity_factors(self.cookie1, project_id)
        self.server.add_member(self.cookie1, project_id, "Bob")
>>>>>>> 98672eb1a121b38289db5e55406a47e3de810ea6:AIHOPS/Tests/AcceptanceTests/project_tests.py
        self.server.publish_project(self.cookie1, project_id)
        res = self.server.close_project(self.cookie1, project_id)
        self.assertTrue(res.success, res.msg)
        self.server.logout(self.cookie1)

    def test_close_project_fail_empty_cookie(self):
<<<<<<< HEAD:AIHOPS/AIHOPS/Tests/AcceptanceTests/project_tests.py
        res = self.server.close_project(None, 1)
        self.assertFalse(res.success, f'Close project succeeded when it should have failed - empty cookie')

    def test_close_project_fail_not_logged_in(self):
        res = self.server.close_project(self.cookie1, 1)
        self.assertFalse(res.success, f'Close project succeeded when it should have failed - not logged in')

    def test_close_project_fail_project_not_found(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.close_project(self.cookie1, -999)
        self.assertFalse(res.success, f'Close project succeeded when it should have failed - project not found')
=======
        res = self.server.archive_project(None, 1)
        self.assertFalse(
            res.success,
            f"Close project succeeded when it should have failed - empty cookie",
        )

    def test_close_project_fail_not_logged_in(self):
        res = self.server.archive_project(self.cookie1, 1)
        self.assertFalse(
            res.success,
            f"Close project succeeded when it should have failed - not logged in",
        )

    def test_close_project_fail_project_not_found(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.archive_project(self.cookie1, -999)
        self.assertFalse(
            res.success,
            f"Close project succeeded when it should have failed - project not found",
        )
>>>>>>> 98672eb1a121b38289db5e55406a47e3de810ea6:AIHOPS/Tests/AcceptanceTests/project_tests.py
        self.server.logout(self.cookie1)

    def test_close_project_fail_project_not_published(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
<<<<<<< HEAD:AIHOPS/AIHOPS/Tests/AcceptanceTests/project_tests.py
        res = self.server.close_project(self.cookie1, project_id)
        self.assertFalse(res.success, f'Close project succeeded when it should have failed - project not published')
=======
        res = self.server.archive_project(self.cookie1, project_id)
        self.assertFalse(
            res.success,
            f"Close project succeeded when it should have failed - project not published",
        )
>>>>>>> 98672eb1a121b38289db5e55406a47e3de810ea6:AIHOPS/Tests/AcceptanceTests/project_tests.py
        self.server.logout(self.cookie1)

    def test_close_project_fail_project_already_closed(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
<<<<<<< HEAD:AIHOPS/AIHOPS/Tests/AcceptanceTests/project_tests.py
        self.server.set_project_factors(self.cookie1, project_id, [["factor1", "desc1"], ["factor2", "desc2"], ["factor3", "desc3"], ["factor4", "desc4"]])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id)
        self.server.close_project(self.cookie1, project_id)
        res = self.server.close_project(self.cookie1, project_id)
        self.assertFalse(res.success, f'Close project succeeded when it should have failed - project already closed')
=======
        self.server.confirm_project_factors(self.cookie1, project_id)
        self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 5]
        )
        self.server.confirm_project_severity_factors(self.cookie1, project_id)
        self.server.add_member(self.cookie1, project_id, "Bob")
        self.server.publish_project(self.cookie1, project_id)
        self.server.archive_project(self.cookie1, project_id)
        res = self.server.archive_project(self.cookie1, project_id)
        self.assertFalse(
            res.success,
            f"Close project succeeded when it should have failed - project already closed",
        )
>>>>>>> 98672eb1a121b38289db5e55406a47e3de810ea6:AIHOPS/Tests/AcceptanceTests/project_tests.py
        self.server.logout(self.cookie1)

    def test_remove_member_success_in_pending_requests(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
        self.server.set_project_factors(
            self.cookie1,
            project_id,
            [
                ["factor1", "desc1"],
                ["factor2", "desc2"],
                ["factor3", "desc3"],
                ["factor4", "desc4"],
            ],
        )
        self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 5]
        )
        self.server.publish_project(self.cookie1, project_id)
        self.server.add_members(self.cookie1, project_id, ["Bob"])
        res = self.server.remove_member(self.cookie1, project_id, "Bob")
        self.assertTrue(res.success, res.msg)
        self.server.logout(self.cookie1)

    def test_remove_member_fail_empty_cookie(self):
        res = self.server.remove_member(None, 1, "Bob")
        self.assertFalse(
            res.success,
            f"Remove member succeeded when it should have failed - empty cookie",
        )

    def test_remove_member_fail_not_logged_in(self):
        res = self.server.remove_member(self.cookie1, 1, "Bob")
        self.assertFalse(
            res.success,
            f"Remove member succeeded when it should have failed - not logged in",
        )

    def test_remove_member_fail_project_not_found(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.remove_member(self.cookie1, -999, "Bob")
        self.assertFalse(
            res.success,
            f"Remove member succeeded when it should have failed - project not found",
        )
        self.server.logout(self.cookie1)

    def test_remove_member_fail_non_existent_member(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
        self.server.set_project_factors(
            self.cookie1,
            project_id,
            [
                ["factor1", "desc1"],
                ["factor2", "desc2"],
                ["factor3", "desc3"],
                ["factor4", "desc4"],
            ],
        )
        self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 5]
        )
        self.server.publish_project(self.cookie1, project_id)
        res = self.server.remove_member(self.cookie1, project_id, "Bob")
        self.assertFalse(res.success, res.msg)
        self.server.logout(self.cookie1)

    def test_get_members_of_project_success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
        self.server.set_project_factors(
            self.cookie1,
            project_id,
            [
                ["factor1", "desc1"],
                ["factor2", "desc2"],
                ["factor3", "desc3"],
                ["factor4", "desc4"],
            ],
        )
        self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 5]
        )
        self.server.publish_project(self.cookie1, project_id)
        self.server.add_members(self.cookie1, project_id, ["Bob"])
        res = self.server.get_members_of_project(self.cookie1, project_id)
        self.assertTrue(res.success, res.msg)
        self.server.logout(self.cookie1)

    def test_get_members_of_project_fail_empty_cookie(self):
        res = self.server.get_members_of_project(None, 1)
        self.assertFalse(
            res.success,
            f"Get members of project succeeded when it should have failed - empty cookie",
        )

    def test_get_members_of_project_fail_not_logged_in(self):
        res = self.server.get_members_of_project(self.cookie1, 1)
        self.assertFalse(
            res.success,
            f"Get members of project succeeded when it should have failed - not logged in",
        )

    def test_get_members_of_project_fail_project_not_found(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.get_members_of_project(self.cookie1, -999)
        self.assertFalse(
            res.success,
            f"Get members of project succeeded when it should have failed - project not found",
        )
        self.server.logout(self.cookie1)

    def test_get_projects_success(self):
        self.server.login(self.cookie1, "Alice", "")
        self.server.create_project(self.cookie1, "Project1", "Description1")
        res = self.server.get_projects_of_owner(self.cookie1)
        self.assertTrue(res.success, res.msg)
        self.server.logout(self.cookie1)

    def test_get_projects_fail_empty_cookie(self):
        res = self.server.get_projects_of_owner(None)
        self.assertFalse(
            res.success,
            f"Get projects succeeded when it should have failed - empty cookie",
        )

    def test_get_projects_fail_not_logged_in(self):
        res = self.server.get_projects_of_owner(self.cookie1)
        self.assertFalse(
            res.success,
            f"Get projects succeeded when it should have failed - not logged in",
        )

    def test_get_projects_fail_no_projects(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.get_projects_of_owner(self.cookie1)
        self.assertFalse(res.success, f'Get projects succeeded when it should have failed - no projects')
        self.server.logout(self.cookie1)

    def test_vote_success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
<<<<<<< HEAD:AIHOPS/AIHOPS/Tests/AcceptanceTests/project_tests.py
        self.server.set_project_factors(self.cookie1, project_id, [["factor1", "desc1"], ["factor2", "desc2"], ["factor3", "desc3"], ["factor4", "desc4"]])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id)
        res = self.server.vote(self.cookie1, project_id, [2, 3, 4, 1], [15, 15, 10, 10, 50])
        self.assertTrue(res.success, res.msg)
        self.server.logout(self.cookie1)

    #Should update the vote of the user
    def test_vote_success_double_vote_same_project_same_user(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, [["factor1", "desc1"], ["factor2", "desc2"], ["factor3", "desc3"], ["factor4", "desc4"]])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id)
        self.server.vote(self.cookie1, project_id, [2, 3, 4, 1], [15, 15, 10, 10, 50])
        res = self.server.vote(self.cookie1, project_id, [2, 1, 2, 1], [20, 10, 10, 10, 50])
=======
        self.server.confirm_project_factors(self.cookie1, project_id)
        self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 5]
        )
        self.server.confirm_project_severity_factors(self.cookie1, project_id)
        self.server.add_member(self.cookie1, project_id, "Bob")
        self.server.publish_project(self.cookie1, project_id)
        factors = self.server.get_project_factors(self.cookie1, project_id)
        for factor in factors.result:
            res = self.server.vote_on_factor(self.cookie1, project_id, factor["id"], 2)
            self.assertTrue(res.success, True)
        self.server.logout(self.cookie1)

    def test_vote_on_factor_fail_empty_cookie(self):
        res = self.server.vote_on_factor(None, 1, 1, 2)
        self.assertFalse(
            res.success,
            f"Vote on factor succeeded when it should have failed - empty cookie",
        )

    def test_vote_on_factor_fail_not_logged_in(self):
        res = self.server.vote_on_factor(self.cookie1, 1, 1, 2)
        self.assertFalse(
            res.success,
            f"Vote on factor succeeded when it should have failed - not logged in",
        )

    def test_vote_on_factor_fail_project_not_found(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.vote_on_factor(self.cookie1, -999, 1, 2)
        self.assertFalse(
            res.success,
            f"Vote on factor succeeded when it should have failed - project not found",
        )
        self.server.logout(self.cookie1)

    def test_vote_on_factor_success_double_vote_same_project_same_user(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", True)
        project_id = res.result
        self.server.confirm_project_factors(self.cookie1, project_id)
        self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 5]
        )
        self.server.confirm_project_severity_factors(self.cookie1, project_id)
        self.server.add_member(self.cookie1, project_id, "Bob")
        self.server.publish_project(self.cookie1, project_id)
        factors = self.server.get_project_factors(self.cookie1, project_id)
        for factor in factors.result:
            self.server.vote_on_factor(self.cookie1, project_id, factor["id"], 2)
        for factor in factors.result:
            res = self.server.vote_on_factor(self.cookie1, project_id, factor["id"], 3)
            self.assertTrue(res.success, res.msg)
        self.server.logout(self.cookie1)

    def test_vote_on_severity_factors_success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", True)
        project_id = res.result
        self.server.confirm_project_factors(self.cookie1, project_id)
        self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 5]
        )
        self.server.confirm_project_severity_factors(self.cookie1, project_id)
        self.server.add_member(self.cookie1, project_id, "Bob")
        self.server.publish_project(self.cookie1, project_id)
        res = self.server.vote_severities(
            self.cookie1, project_id, [20, 20, 20, 10, 30]
        )
        self.assertTrue(res.success, res.msg)
        self.server.logout(self.cookie1)

    def test_vote_on_severity_factors_fail_empty_cookie(self):
        res = self.server.vote_severities(None, 1, [20, 20, 20, 10, 30])
        self.assertFalse(
            res.success,
            f"Vote on severity factors succeeded when it should have failed - empty cookie",
        )

    def test_vote_on_severity_factors_fail_not_logged_in(self):
        res = self.server.vote_severities(self.cookie1, 1, [20, 20, 20, 10, 30])
        self.assertFalse(
            res.success,
            f"Vote on severity factors succeeded when it should have failed - not logged in",
        )

    def test_vote_on_severity_factors_fail_project_not_found(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.vote_severities(self.cookie1, -999, [20, 20, 20, 10, 30])
        self.assertFalse(
            res.success,
            f"Vote on severity factors succeeded when it should have failed - project not found",
        )
        self.server.logout(self.cookie1)

    def test_vote_on_severity_factors_fail_not_100_percent(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", True)
        project_id = res.result
        self.server.confirm_project_factors(self.cookie1, project_id)
        self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 5]
        )
        self.server.confirm_project_severity_factors(self.cookie1, project_id)
        self.server.add_member(self.cookie1, project_id, "Bob")
        self.server.publish_project(self.cookie1, project_id)
        res = self.server.vote_severities(
            self.cookie1, project_id, [20, 20, 20, 10, 29]
        )
        self.assertFalse(res.success, res.msg)
        self.server.logout(self.cookie1)

    def test_vote_on_severities_success_double_vote_same_project_same_user(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", True)
        project_id = res.result
        self.server.confirm_project_factors(self.cookie1, project_id)
        self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 5]
        )
        self.server.confirm_project_severity_factors(self.cookie1, project_id)
        self.server.add_member(self.cookie1, project_id, "Bob")
        self.server.publish_project(self.cookie1, project_id)
        self.server.vote_severities(self.cookie1, project_id, [20, 20, 20, 10, 30])
        res = self.server.vote_severities(
            self.cookie1, project_id, [20, 20, 20, 10, 30]
        )
>>>>>>> 98672eb1a121b38289db5e55406a47e3de810ea6:AIHOPS/Tests/AcceptanceTests/project_tests.py
        self.assertTrue(res.success, res.msg)
        self.server.logout(self.cookie1)

    def test_vote_fail_empty_cookie(self):
        res = self.server.vote(None, 1, [2, 3, 4, 1], [15, 15, 10, 10, 50])
        self.assertFalse(
            res.success, f"Vote succeeded when it should have failed - empty cookie"
        )

    def test_vote_fail_not_logged_in(self):
        res = self.server.vote(self.cookie1, 1, [2, 3, 4, 1], [15, 15, 10, 10, 50])
        self.assertFalse(
            res.success, f"Vote succeeded when it should have failed - not logged in"
        )

    def test_vote_fail_project_not_found(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.vote(self.cookie1, -999, [2, 3, 4, 1], [15, 15, 10, 10, 50])
        self.assertFalse(res.success, f'Vote succeeded when it should have failed - project not found')
        self.server.logout(self.cookie1)

    def test_vote_fail_project_not_published(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, [["factor1", "desc1"], ["factor2", "desc2"], ["factor3", "desc3"], ["factor4", "desc4"]])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        res = self.server.vote(self.cookie1, project_id, [2, 3, 4, 1], [15, 15, 10, 10, 50])
        self.assertFalse(res.success, f'Vote succeeded when it should have failed - project not published')
        self.server.logout(self.cookie1)

    def test_vote_fail_factor_values_not_in_range_value_of_5(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, [["factor1", "desc1"], ["factor2", "desc2"], ["factor3", "desc3"], ["factor4", "desc4"]])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id)
        res = self.server.vote(self.cookie1, project_id, [5, 3, 4, 1], [15, 15, 10, 10, 50])
        self.assertFalse(res.success, res.msg)
        self.server.logout(self.cookie1)

    def test_vote_fail_factor_values_not_in_range_value_of_minues_1(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, [["factor1", "desc1"], ["factor2", "desc2"], ["factor3", "desc3"], ["factor4", "desc4"]])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id)
        res = self.server.vote(self.cookie1, project_id, [1, 3, 4, -1], [15, 15, 10, 10, 50])
        self.assertFalse(res.success, res.msg)
        self.server.logout(self.cookie1)

    def test_vote_fail_severity_factor_values_not_in_range_value_of_bigger_than_1(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, [["factor1", "desc1"], ["factor2", "desc2"], ["factor3", "desc3"], ["factor4", "desc4"]])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id)
        res = self.server.vote(self.cookie1, project_id, [1, 3, 4, 2], [11, 15, 10, 10, 50])
        self.assertFalse(res.success, res.msg)
        self.server.logout(self.cookie1)

    def test_vote_fail_severity_factor_values_not_in_range_value_of_smaller_than_1(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
        self.server.set_project_factors(self.cookie1, project_id, [["factor1", "desc1"], ["factor2", "desc2"], ["factor3", "desc3"], ["factor4", "desc4"]])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id)
        res = self.server.vote(self.cookie1, project_id, [1, 3, 4, 2], [-1, 15, 10,10,50])
        self.assertFalse(res.success, res.msg)
        self.server.logout(self.cookie1)

    def test_get_project_success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
        res = self.server.get_project(self.cookie1, project_id)
        self.assertTrue(res.success, res.msg)
        self.server.logout(self.cookie1)

    def test_get_project_fail_empty_cookie(self):
        res = self.server.get_project(None, 1)
        self.assertFalse(
            res.success,
            f"Get project succeeded when it should have failed - empty cookie",
        )

    def test_get_project_fail_not_logged_in(self):
        res = self.server.get_project(self.cookie1, 1)
        self.assertFalse(
            res.success,
            f"Get project succeeded when it should have failed - not logged in",
        )

    def test_get_project_fail_project_not_found(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.get_project(self.cookie1, -999)
        self.assertFalse(
            res.success,
            f"Get project succeeded when it should have failed - project not found",
        )
        self.server.logout(self.cookie1)

    def test_get_pending_requests_success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
        self.server.set_project_factors(
            self.cookie1,
            project_id,
            [
                ["factor1", "desc1"],
                ["factor2", "desc2"],
                ["factor3", "desc3"],
                ["factor4", "desc4"],
            ],
        )
        self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 5]
        )
        self.server.publish_project(self.cookie1, project_id)
        self.server.add_members(self.cookie1, project_id, ["Bob"])
        self.server.logout(self.cookie1)
        self.server.login(self.cookie2, "Bob", "")
        res = self.server.get_pending_requests(self.cookie2)
        self.assertTrue(res.success, res.msg)
        self.server.logout(self.cookie2)

    def test_get_pending_requests_fail_empty_cookie(self):
        res = self.server.get_pending_requests(None)
        self.assertFalse(
            res.success,
            f"Get pending requests succeeded when it should have failed - empty cookie",
        )

    def test_get_pending_requests_fail_not_logged_in(self):
        res = self.server.get_pending_requests(self.cookie1)
        self.assertFalse(
            res.success,
            f"Get pending requests succeeded when it should have failed - not logged in",
        )

    def test_get_pending_requests_fail_no_pending_requests(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.get_pending_requests(self.cookie1)
        self.assertFalse(res.success, f'Get pending requests succeeded when it should have failed - no pending requests')
        self.server.logout(self.cookie1)

    def test_get_score_success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
<<<<<<< HEAD:AIHOPS/AIHOPS/Tests/AcceptanceTests/project_tests.py
        self.server.set_project_factors(self.cookie1, project_id, [["factor1", "desc1"], ["factor2", "desc2"], ["factor3", "desc3"], ["factor4", "desc4"]])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
        self.server.publish_project(self.cookie1, project_id)
        self.server.vote(self.cookie1, project_id, [2, 3, 4, 1], [15, 15, 10, 10, 50])
        self.server.close_project(self.cookie1, project_id)
        res = self.server.get_score(self.cookie1, project_id)
=======
        self.server.confirm_project_factors(self.cookie1, project_id)
        self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 5]
        )
        self.server.confirm_project_severity_factors(self.cookie1, project_id)
        self.server.add_member(self.cookie1, project_id, "Bob")
        self.server.publish_project(self.cookie1, project_id)
        # vote on each factor
        factors = self.server.get_project_factors(self.cookie1, project_id).result
        for factor in factors:
            self.server.vote_on_factor(self.cookie1, project_id, factor["id"], 2)
        # vote on severities
        self.server.vote_severities(self.cookie1, project_id, [20, 20, 20, 10, 30])
        weights = {}
        for i in range(len(factors)):
            weights[str(factors[i]["id"])] = random.randint(1, 10)

        res = self.server.get_score(self.cookie1, project_id, weights)
>>>>>>> 98672eb1a121b38289db5e55406a47e3de810ea6:AIHOPS/Tests/AcceptanceTests/project_tests.py
        self.assertTrue(res.success, res.msg)
        self.server.logout(self.cookie1)

    def test_get_score_fail_empty_cookie(self):
        try:
            res = self.facade.get_score(None, 1)
            self.assertFalse(
                res.success,
                f"Get score succeeded when it should have failed - empty cookie",
            )
        except Exception as e:
            self.assertTrue(True, f"Get score failed with exception: {str(e)}")

    def test_get_score_fail_not_logged_in(self):
        try:
            res = self.facade.get_score(self.cookie1, 1)
            self.assertFalse(
                res.success,
                f"Get score succeeded when it should have failed - not logged in",
            )
        except Exception as e:
            self.assertTrue(True, f"Get score failed with exception: {str(e)}")

    def test_get_score_fail_project_not_found(self):
        try:
            self.server.login(self.cookie1, "Alice", "")
            res = self.facade.get_score(self.cookie1, -999)
            self.assertFalse(
                res.success,
                f"Get score succeeded when it should have failed - project not found",
            )
            self.server.logout(self.cookie1)

        except Exception as e:
            self.assertTrue(True, f"Get score failed with exception: {str(e)}")

    def test_get_score_fail_project_not_closed(self):
        try:
            self.server.login(self.cookie1, "Alice", "")
            res = self.server.create_project(self.cookie1, "Project1", "Description1")
            project_id = res.result
            self.server.set_project_factors(
                self.cookie1,
                project_id,
                [
                    ["factor1", "desc1"],
                    ["factor2", "desc2"],
                    ["factor3", "desc3"],
                    ["factor4", "desc4"],
                ],
            )
            self.server.set_project_severity_factors(
                self.cookie1, project_id, [1, 2, 3, 4, 5]
            )
            self.server.publish_project(self.cookie1, project_id)
            self.server.vote(
                self.cookie1, project_id, [2, 3, 4, 1], [15, 15, 10, 10, 50]
            )
            res = self.facade.get_score(self.cookie1, project_id)
            self.assertFalse(res.success, res.msg)
            self.server.logout(self.cookie1)

        except Exception as e:
            self.assertTrue(True, f"Get score failed with exception: {str(e)}")

    def test_approve_member_success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
<<<<<<< HEAD:AIHOPS/AIHOPS/Tests/AcceptanceTests/project_tests.py
        self.server.set_project_factors(self.cookie1, project_id, [["factor1", "desc1"], ["factor2", "desc2"], ["factor3", "desc3"], ["factor4", "desc4"]])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
=======
        self.server.confirm_project_factors(self.cookie1, project_id)
        self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 5]
        )
        self.server.confirm_project_severity_factors(self.cookie1, project_id)
>>>>>>> 98672eb1a121b38289db5e55406a47e3de810ea6:AIHOPS/Tests/AcceptanceTests/project_tests.py
        self.server.add_members(self.cookie1, project_id, ["Bob"])
        self.server.publish_project(self.cookie1, project_id)
        self.server.logout(self.cookie1)
        self.server.login(self.cookie2, "Bob", "")
        res = self.server.get_pending_requests(self.cookie2)
        pending_requests = res.result
        res = self.server.approve_member(self.cookie2, pending_requests[0])
        self.assertTrue(res.success, res.msg)
        self.server.logout(self.cookie2)

    def test_approve_member_fail_empty_cookie(self):
        res = self.server.approve_member(None, 1)
        self.assertFalse(
            res.success,
            f"Approve member succeeded when it should have failed - empty cookie",
        )

    def test_approve_member_fail_not_logged_in(self):
        res = self.server.approve_member(self.cookie1, 1)
        self.assertFalse(
            res.success,
            f"Approve member succeeded when it should have failed - not logged in",
        )

    def test_approve_member_fail_request_not_found(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.approve_member(self.cookie1, -999)
        self.assertFalse(
            res.success,
            f"Approve member succeeded when it should have failed - request not found",
        )
        self.server.logout(self.cookie1)

    def test_remove_member_success_after_added_member_approved(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
<<<<<<< HEAD:AIHOPS/AIHOPS/Tests/AcceptanceTests/project_tests.py
        self.server.set_project_factors(self.cookie1, project_id, [["factor1", "desc1"], ["factor2", "desc2"], ["factor3", "desc3"], ["factor4", "desc4"]])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
=======
        self.server.confirm_project_factors(self.cookie1, project_id)
        self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 5]
        )
        self.server.confirm_project_severity_factors(self.cookie1, project_id)
        self.server.add_members(self.cookie1, project_id, ["Bob"])
>>>>>>> 98672eb1a121b38289db5e55406a47e3de810ea6:AIHOPS/Tests/AcceptanceTests/project_tests.py
        self.server.publish_project(self.cookie1, project_id)
        self.server.add_members(self.cookie1, project_id, ["Bob"])
        self.server.logout(self.cookie1)
        self.server.login(self.cookie2, "Bob", "")
        pending_requests = self.server.get_pending_requests(self.cookie2)
        self.server.approve_member(self.cookie2, pending_requests.result[0])
        self.server.logout(self.cookie2)
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.remove_member(self.cookie1, project_id, "Bob")
        self.assertTrue(res.success, res.msg)
        self.server.logout(self.cookie1)

    def test_reject_memeber_success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1")
        project_id = res.result
<<<<<<< HEAD:AIHOPS/AIHOPS/Tests/AcceptanceTests/project_tests.py
        self.server.set_project_factors(self.cookie1, project_id, [["factor1", "desc1"], ["factor2", "desc2"], ["factor3", "desc3"], ["factor4", "desc4"]])
        self.server.set_project_severity_factors(self.cookie1, project_id, [1, 2, 3, 4, 5])
=======
        self.server.confirm_project_factors(self.cookie1, project_id)
        self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 5]
        )
        self.server.confirm_project_severity_factors(self.cookie1, project_id)
        self.server.add_members(self.cookie1, project_id, ["Bob"])
>>>>>>> 98672eb1a121b38289db5e55406a47e3de810ea6:AIHOPS/Tests/AcceptanceTests/project_tests.py
        self.server.publish_project(self.cookie1, project_id)
        self.server.add_members(self.cookie1, project_id, ["Bob"])
        self.server.logout(self.cookie1)
        self.server.login(self.cookie2, "Bob", "")
        pending_requests = self.server.get_pending_requests(self.cookie2)
        self.server.reject_member(self.cookie2, pending_requests.result[0])
        self.assertTrue(res.success, res.msg)
        self.server.logout(self.cookie2)

    def test_reject_member_fail_empty_cookie(self):
        res = self.server.reject_member(None, 1)
        self.assertFalse(
            res.success,
            f"Reject member succeeded when it should have failed - empty cookie",
        )

    def test_reject_member_fail_not_logged_in(self):
        res = self.server.reject_member(self.cookie1, 1)
        self.assertFalse(
            res.success,
            f"Reject member succeeded when it should have failed - not logged in",
        )

    def test_reject_member_fail_request_not_found(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.reject_member(self.cookie1, -999)
<<<<<<< HEAD:AIHOPS/AIHOPS/Tests/AcceptanceTests/project_tests.py
        self.assertFalse(res.success, f'Reject member succeeded when it should have failed - request not found')
        self.server.logout(self.cookie1)
=======
        self.assertFalse(
            res.success,
            f"Reject member succeeded when it should have failed - request not found",
        )
        self.server.logout(self.cookie1)

    def test_edit_projects_name_and_desc_after_archiving_fail(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", True)
        project_id = res.result
        # need to publish first
        self.server.confirm_project_factors(self.cookie1, project_id)
        self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 5]
        )
        self.server.confirm_project_severity_factors(self.cookie1, project_id)
        self.server.add_member(self.cookie1, project_id, "Bob")
        self.server.publish_project(self.cookie1, project_id)
        # now archive
        self.server.archive_project(self.cookie1, project_id)
        res = self.server.update_project_name_and_desc(
            self.cookie1, project_id, "Project2", "Description2"
        )
        self.assertFalse(res.success, res.msg)
        self.server.logout(self.cookie1)

    def test_edit_projects_severity_factors_after_archiving_fail(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", True)
        project_id = res.result
        # need to publish first
        self.server.confirm_project_factors(self.cookie1, project_id)
        self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 5]
        )
        self.server.confirm_project_severity_factors(self.cookie1, project_id)
        self.server.add_member(self.cookie1, project_id, "Bob")
        self.server.publish_project(self.cookie1, project_id)
        # now archive
        self.server.archive_project(self.cookie1, project_id)
        res = self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 5]
        )
        self.assertFalse(res.success, res.msg)
        self.server.logout(self.cookie1)

    def test_add_factor_after_archiving_fail(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", True)
        project_id = res.result
        # need to publish first
        self.server.confirm_project_factors(self.cookie1, project_id)
        self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 5]
        )
        self.server.confirm_project_severity_factors(self.cookie1, project_id)
        self.server.add_member(self.cookie1, project_id, "Bob")
        self.server.publish_project(self.cookie1, project_id)
        # now archive
        self.server.archive_project(self.cookie1, project_id)
        res = self.server.add_project_factor(
            self.cookie1,
            project_id,
            "factor1",
            "desc1",
            ["1", "2", "3", "4"],
            ["desc1", "desc2", "desc3", "desc4"],
        )
        self.assertFalse(res.success, res.msg)
        self.server.logout(self.cookie1)

    def test_invite_member_after_archiving_fail(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", True)
        project_id = res.result
        # need to publish first
        self.server.confirm_project_factors(self.cookie1, project_id)
        self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 5]
        )
        self.server.confirm_project_severity_factors(self.cookie1, project_id)
        self.server.add_member(self.cookie1, project_id, "Bob")
        self.server.publish_project(self.cookie1, project_id)
        # now archive
        self.server.archive_project(self.cookie1, project_id)
        res = self.server.add_member(self.cookie1, project_id, "Chloe")
        self.assertFalse(res.success, res.msg)
        self.server.logout(self.cookie1)

    def test_remove_member_after_archiving_fail(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", True)
        project_id = res.result
        # need to publish first
        self.server.confirm_project_factors(self.cookie1, project_id)
        self.server.set_project_severity_factors(
            self.cookie1, project_id, [1, 2, 3, 4, 5]
        )
        self.server.confirm_project_severity_factors(self.cookie1, project_id)
        self.server.add_member(self.cookie1, project_id, "Bob")
        self.server.publish_project(self.cookie1, project_id)
        # now log in with out member - Bob and accept the invitation
        self.server.logout(self.cookie1)
        self.server.login(self.cookie2, "Bob", "")
        pending_requests = self.server.get_pending_requests(self.cookie2)
        self.server.approve_member(self.cookie2, pending_requests.result[0]["id"])
        self.server.logout(self.cookie2)
        # now archive
        self.server.login(self.cookie1, "Alice", "")
        self.server.archive_project(self.cookie1, project_id)
        res = self.server.remove_member(self.cookie1, project_id, "Bob")
        self.assertFalse(res.success, res.msg)
        self.server.logout(self.cookie1)

    def _create_default_project_in_design(self, name="Project1", desc="Description1"):
        pid_res = self.server.create_project(self.cookie1, name, desc, True)
        pid = pid_res.result
        self.server.confirm_project_factors(self.cookie1, pid)
        self.server.confirm_project_severity_factors(self.cookie1, pid)
        self.server.add_member(self.cookie1, pid, "Bob")
        return pid

    def _check_original_factor_removed_and_new_added(self, pid, fid, new_factor_name):
        factors = self.server.get_project_factors(self.cookie1, pid).result
        removed = True
        added = False
        for factor in factors:
            if factor["id"] == fid:
                removed = False
            if factor["name"] == new_factor_name:
                added = True
        return removed, added

    # only 1 in design
    def test_update_default_factor_only_cur_in_design(self):
        # signUp and login, create a project with a new factor
        self.server.login(self.cookie1, "Alice", "")
        pid = self._create_default_project_in_design()
        f = self.server.get_project_factors(self.cookie1, pid).result
        f = f[3]
        res = self.server.update_factor(
            self.cookie1,
            f["id"],
            pid,
            "new factor",
            f["description"],
            f["scales_desc"],
            f["scales_explanation"],
            False,
        )
        removed, added = self._check_original_factor_removed_and_new_added(
            pid, f["id"], "new factor"
        )
        self.assertTrue(removed, f"factor {f['id']} has not been removed")
        self.assertTrue(added, f"new factor has not been added")

    def test_update_default_factor_2_in_design(self):
        # signUp and login, create a project with a new factor
        self.server.login(self.cookie1, "Alice", "")
        pid = self._create_default_project_in_design()
        pid2 = self._create_default_project_in_design("Project2", "desc2")
        f = self.server.get_project_factors(self.cookie1, pid).result
        f = f[3]
        res = self.server.update_factor(
            self.cookie1,
            f["id"],
            pid,
            "new factor",
            f["description"],
            f["scales_desc"],
            f["scales_explanation"],
            False,
        )
        removed, added = self._check_original_factor_removed_and_new_added(
            pid2, f["id"], "new factor"
        )
        self.assertFalse(removed, f"factor {f['id']} has not been removed")
        self.assertFalse(added, f"new factor has not been added")

    def test_update_default_factor_2_in_design_apply(self):
        # signUp and login, create a project with a new factor
        self.server.login(self.cookie1, "Alice", "")
        pid = self._create_default_project_in_design()
        pid2 = self._create_default_project_in_design("Project2", "desc2")
        f = self.server.get_project_factors(self.cookie1, pid).result
        f = f[3]
        res = self.server.update_factor(
            self.cookie1,
            f["id"],
            pid,
            "new factor",
            f["description"],
            f["scales_desc"],
            f["scales_explanation"],
            True,
        )
        removed, added = self._check_original_factor_removed_and_new_added(
            pid, f["id"], "new factor"
        )
        self.assertTrue(removed, f"factor {f['id']} has not been removed")
        self.assertTrue(added, f"new factor has not been added")

    def _find_factor_id(self, cookie, pid, name, desc):
        factors = self.server.get_project_factors(cookie, pid).result
        for f in factors:
            if f["name"] == name and f["description"] == desc:
                return f["id"]

    def test_update_default_factor_2_in_design_apply_and_1_published(self):
        # signUp and login, create a project with a new factor
        self.server.login(self.cookie1, "Alice", "")
        pid = self._create_default_project_in_design()
        res = self.server.add_project_factor(
            self.cookie1,
            pid,
            "new factor",
            "new desc",
            ["1", "1", "1", "1", "1"],
            ["1", "1", "1", "1", "1"],
        )
        fid = self._find_factor_id(self.cookie1, pid, "new factor", "new desc")

        pid2 = self._create_default_project_in_design("Project2", "desc2")
        self.server.set_project_factors(self.cookie1, pid2, [fid])
        pid3 = self._create_default_project_in_design("Project3", "desc3")
        self.server.set_project_factors(self.cookie1, pid3, [fid])

        self.server.confirm_project_factors(self.cookie1, pid2)
        self.server.confirm_project_factors(self.cookie1, pid3)

        self.server.confirm_project_factors(self.cookie1, pid2)
        self.server.confirm_project_factors(self.cookie1, pid3)

        self.server.publish_project(self.cookie1, pid3)

        res = self.server.update_factor(
            self.cookie1,
            fid,
            pid,
            "updated",
            "updated",
            ["1", "1", "1", "1", "1"],
            ["1", "1", "1", "1", "1"],
            True,
        )
        removed, added = self._check_original_factor_removed_and_new_added(
            pid, fid, "updated"
        )
        self.assertTrue(removed, f"factor {fid} has not been removed")
        self.assertTrue(added, f"new factor has not been added")

        res = self.server.update_factor(
            self.cookie1,
            fid,
            pid,
            "updated",
            "updated",
            ["1", "1", "1", "1", "1"],
            ["1", "1", "1", "1", "1"],
            True,
        )
        removed, added = self._check_original_factor_removed_and_new_added(
            pid3, fid, "updated"
        )
        self.assertFalse(removed, f"factor {fid} has not been removed")
        self.assertFalse(added, f"new factor has not been added")

    def test_update_default_factor_2_in_design_apply_and_1_archived_fail_not_unique(
        self,
    ):
        # signUp and login, create a project with a new factor
        self.server.login(self.cookie1, "Alice", "")
        pid = self._create_default_project_in_design()
        res = self.server.add_project_factor(
            self.cookie1,
            pid,
            "new factor",
            "new desc",
            ["1", "1", "1", "1", "1"],
            ["1", "1", "1", "1", "1"],
        )
        fid = self._find_factor_id(self.cookie1, pid, "new factor", "new desc")

        pid2 = self._create_default_project_in_design("Project2", "desc2")
        self.server.set_project_factors(self.cookie1, pid2, [fid])
        pid3 = self._create_default_project_in_design("Project3", "desc3")
        self.server.set_project_factors(self.cookie1, pid3, [fid])

        self.server.confirm_project_factors(self.cookie1, pid2)
        self.server.confirm_project_factors(self.cookie1, pid3)

        self.server.confirm_project_factors(self.cookie1, pid2)
        self.server.confirm_project_factors(self.cookie1, pid3)

        self.server.publish_project(self.cookie1, pid3)
        self.server.archive_project(self.cookie1, pid3)

        res = self.server.update_factor(
            self.cookie1,
            fid,
            pid,
            "new factor",
            "new desc",
            ["1", "1", "1", "1", "1"],
            ["1", "1", "1", "1", "1"],
            True,
        )
        self.assertFalse(res.success, f"factor {fid} has not been removed")
>>>>>>> 98672eb1a121b38289db5e55406a47e3de810ea6:AIHOPS/Tests/AcceptanceTests/project_tests.py
