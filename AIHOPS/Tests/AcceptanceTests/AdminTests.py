import unittest
from unittest.mock import patch

from Domain.src.Server import Server
from Domain.src.Users.MemberController import MemberController
from Service.config import Base, engine
from Tests.AcceptanceTests.Facade import Facade
from Tests.AcceptanceTests.mocks.MockGmailor import MockGmailor


# How to run the tests:
# In a terminal, run:
#   cd AIHOPS
#   python3 -m unittest test_project

scales = ['1', '1', '1', '1', '1']

users = [
    ["Alice", "123"],
    ["Bob", "123"]
]

projects = [
    ["Project1", "Desc1"],
    ["Project2", "Desc2"]
]


class AdminTests(unittest.TestCase):
    # ------------- Base ------------------
    @patch("Domain.src.Users.MemberController.Gmailor", new=MockGmailor)
    def setUp(self) -> None:
        Base.metadata.create_all(engine)  # must initialize the database
        self.server = Server()
        self.facade = Facade()
        self.cookie1 = self.server.enter().result.cookie
        self.cookie2 = self.server.enter().result.cookie
        self.facade.register_and_verify(self.server, self.cookie1, "Alice", "")
        self.facade.register_and_verify(self.server, self.cookie2, "Bob", "")

    def tearDown(self) -> None:
        self.server.clear_db()
        pass  # TODO: remove this line after adding the function above

    def test_admin_delete_default_factor_check_project_that_containing_this_factor_score(self):
        # create and publish project with a default factor
        self.facade.register_verify_login(*users[0])
        pid = self.facade.create_and_publish_project_def_factors(users[0], "p1", "dp1", ["sus@sus.com"])
        # vote on project
        self.facade.vote(pid, [2,2,2,2])
        # get score b4 deleting factor
        score = self.facade.get_score(users[0], pid)
        # login as admin and default factor that appears in the project
        admin_cookie = self.server.enter().result.cookie
        self.server.login(admin_cookie, "admin@admin.com", "admin")
        self.server.admin_remove_default_factor(admin_cookie, -7)
        # check that projects new score is correct
        score_after = self.facade.get_score(users[0], pid)
        print("suss")