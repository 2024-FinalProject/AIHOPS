import unittest
from unittest.mock import patch
from parameterized import parameterized

from Domain.src.Server import Server
from Domain.src.Users.MemberController import MemberController
from Service.config import Base, engine
from Tests.AcceptanceTests.Facade import Facade
from Tests.AcceptanceTests.mocks.MockGmailor import MockGmailor
from Tests.AcceptanceTests.mocks.MockTACController import MockTACController

scales = ['1', '1', '1', '1', '1']

users = [
    ["Alice", "123"],
    ["Bob", "123"]
]

projects = [
    ["Project1", "Desc1"],
    ["Project2", "Desc2"]
]

factors1 = [
    ["factor1", "desc1", scales, scales],
    ["factor2", "desc2", scales, scales],
]

factors2 = [
    ["f1", "d1", scales, scales],
    ["f2", "d2", scales, scales],
]

@patch("Domain.src.Server.TACController", new=MockTACController)
class ProjectTests(unittest.TestCase):
    # ------------- Base ------------------
    @patch("Domain.src.Users.MemberController.Gmailor", new=MockGmailor)
    def setUp(self) -> None:
        Base.metadata.create_all(engine)  # must initialize the database
        self.facade = Facade()

    def tearDown(self) -> None:
        self.facade.clear_db()

    @parameterized.expand([
        ("false_false", False, False),
        ("false_true", False, True),
        ("true_false", True, False),
        ("true_true", True, True),
    ])
    def test_update_factor_1_project_1n_design_happy(self, name, use_defaults, apply):
        self.facade.register_verify_login(*users[0])
        # excpected result shouldnt change with false or tru - add parametrized test here
        pid = self.facade.create_project(users[0][0], use_defaults, *projects[0])
        fid = self.facade.add_factor(users[0][0], pid, *factors1[0])
        new_fid = self.facade.update_factor(users[0][0], fid, pid, apply ,*factors2[0])

        # checks:
        #   1) fid not in project
        projects_factors = self.facade.get_projects_factors(users[0][0], pid)
        project_factors_ids = [d["id"] for d in projects_factors]
        self.assertFalse(fid in project_factors_ids, f"factor should have been deleted from project {fid}")
        #   2) fid not in actors pool
        pool_factors = self.facade.get_actors_factor_pool(users[0][0])
        pool_ids = [d["id"] for d in pool_factors]
        self.assertFalse(fid in pool_ids, f"factor should have been deleted from project {fid}")
        #   3) new fid is in actors pool and in project
        self.assertTrue(new_fid in project_factors_ids, f"new factor should is not added to project {fid}")
        self.assertTrue(new_fid in pool_ids, f"new factor should is not added to pactors pool")
        #   4) new_fid's fields match factors2[0]
        new_factor = next((d for d in pool_factors if d["id"] == new_fid), None)
        self.assertEqual(new_factor['name'], factors2[0][0])
        self.assertEqual(new_factor['description'], factors2[0][1])

    @parameterized.expand([
        ("false_false", False, False),
        ("false_true", False, True),
        ("true_false", True, False),
        ("true_true", True, True),
    ])
    def test_update_factor_1_project_1n_design_same_name_and_desc_happy(self, name, use_defaults, apply):
        self.facade.register_verify_login(*users[0])
        # excpected result shouldnt change with false or tru - add parametrized test here
        pid = self.facade.create_project(users[0][0], use_defaults, *projects[0])
        fid = self.facade.add_factor(users[0][0], pid, *factors1[0])
        new_fid = self.facade.update_factor(users[0][0], fid, pid, apply, *factors1[0])

        # checks:
        #   1) fid not in project
        projects_factors = self.facade.get_projects_factors(users[0][0], pid)
        project_factors_ids = [d["id"] for d in projects_factors]
        self.assertFalse(fid in project_factors_ids, f"factor should have been deleted from project {fid}")
        #   2) fid not in actors pool
        pool_factors = self.facade.get_actors_factor_pool(users[0][0])
        pool_ids = [d["id"] for d in pool_factors]
        self.assertFalse(fid in pool_ids, f"factor should have been deleted from project {fid}")
        #   3) new fid is in actors pool and in project
        self.assertTrue(new_fid in project_factors_ids, f"new factor should is not added to project {fid}")
        self.assertTrue(new_fid in pool_ids, f"new factor should is not added to pactors pool")
        #   4) new_fid's fields match factors2[0]
        new_factor = next((d for d in pool_factors if d["id"] == new_fid), None)
        self.assertEqual(new_factor['name'], factors1[0][0])
        self.assertEqual(new_factor['description'], factors1[0][1])

    @parameterized.expand([
        ("false", False),
        ("true", True),
    ])
    def test_update_factor_2_project_1n_design_apply(self, name='true', use_defaults=True):
        self.facade.register_verify_login(*users[0])
        pid = self.facade.create_project(users[0][0], use_defaults, *projects[0])
        fid = self.facade.add_factor(users[0][0], pid, *factors1[0])

        pid2 = self.facade.create_project(users[0][0], use_defaults, *projects[1])
        self.facade.insert_factor_from_pool(users[0][0], fid, pid2)

        new_fid = self.facade.update_factor(users[0][0], fid, pid, True ,*factors2[0])
        # checks:
        #   1) fid not in project
        projects_factors = self.facade.get_projects_factors(users[0][0], pid)
        project_factors_ids = [d["id"] for d in projects_factors]
        self.assertFalse(fid in project_factors_ids, f"factor should have been deleted from project {fid}")
        #   2) fid not in actors pool
        pool_factors = self.facade.get_actors_factor_pool(users[0][0])
        pool_ids = [d["id"] for d in pool_factors]
        self.assertFalse(fid in pool_ids, f"factor should not have been deleted from project {fid}")
        #   3) new fid is in actors pool and in project
        self.assertTrue(new_fid in project_factors_ids, f"new factor should is not added to project {fid}")
        self.assertTrue(new_fid in pool_ids, f"new factor should is not added to pactors pool")
        #   4) new_fid's fields match factors2[0]
        new_factor = next((d for d in pool_factors if d["id"] == new_fid), None)
        self.assertEqual(new_factor['name'], factors2[0][0])
        self.assertEqual(new_factor['description'], factors2[0][1])

        # check second project:
        projects_factors = self.facade.get_projects_factors(users[0][0], pid2)
        project_factors_ids = [d["id"] for d in projects_factors]
        self.assertTrue(new_fid in project_factors_ids, f"factor should not been deleted from project {fid}")
        self.assertFalse(fid in project_factors_ids, f"new factor should not added to project {fid}")

    @parameterized.expand([
        ("false", False),
        ("true", True),
    ])
    def test_update_factor_2_project_1n_design_not_apply(self, name='true', use_defaults=True):
        self.facade.register_verify_login(*users[0])
        pid = self.facade.create_project(users[0][0], use_defaults, *projects[0])
        fid = self.facade.add_factor(users[0][0], pid, *factors1[0])

        pid2 = self.facade.create_project(users[0][0], use_defaults, *projects[1])
        self.facade.insert_factor_from_pool(users[0][0], fid, pid2)

        new_fid = self.facade.update_factor(users[0][0], fid, pid, False, *factors2[0])
        # checks:
        #   1) fid not in project
        projects_factors = self.facade.get_projects_factors(users[0][0], pid)
        project_factors_ids = [d["id"] for d in projects_factors]
        self.assertFalse(fid in project_factors_ids, f"factor should have been deleted from project {fid}")
        #   2) fid in actors pool
        pool_factors = self.facade.get_actors_factor_pool(users[0][0])
        pool_ids = [d["id"] for d in pool_factors]
        self.assertTrue(fid in pool_ids, f"factor should not have been deleted from project {fid}")
        #   3) new fid is in actors pool and in project
        self.assertTrue(new_fid in project_factors_ids)
        self.assertTrue(new_fid in pool_ids)
        #   4) new_fid's fields match factors2[0]
        new_factor = next((d for d in pool_factors if d["id"] == new_fid), None)
        self.assertEqual(new_factor['name'], factors2[0][0])
        self.assertEqual(new_factor['description'], factors2[0][1])

        # check second project:
        projects_factors = self.facade.get_projects_factors(users[0][0], pid2)
        project_factors_ids = [d["id"] for d in projects_factors]
        self.assertFalse(new_fid in project_factors_ids)
        self.assertTrue(fid in project_factors_ids)






