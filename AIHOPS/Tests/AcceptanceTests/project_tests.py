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

    def test_create_project_fail_existing_project(self):
        self.server.login(self.cookie1, "Alice", "")
        self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        res = self.server.create_project(self.cookie1, "Project1", "Description1", "Alice")
        self.assertFalse(res.success, f'Create project succeeded when it should have failed - existing project')

