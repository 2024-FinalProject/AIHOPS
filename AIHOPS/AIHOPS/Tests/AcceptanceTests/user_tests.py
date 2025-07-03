import unittest
from Service.config import Base, engine
from Domain.src.Server import Server
<<<<<<< HEAD:AIHOPS/AIHOPS/Tests/AcceptanceTests/user_tests.py
=======
from Domain.src.Users.MemberController import MemberController
from Domain.src.DS import FactorsPool as FP
from Tests.AcceptanceTests.Facade import Facade
from Tests.AcceptanceTests.mocks.MockGmailor import MockGmailor
from Tests.AcceptanceTests.mocks.MockTACController import MockTACController
>>>>>>> 98672eb1a121b38289db5e55406a47e3de810ea6:AIHOPS/Tests/AcceptanceTests/user_tests.py


# How to run the tests:
#       In a terminal, run the following commands:
#               cd AIHOPS
#               python3 -m unittest Tests.AcceptanceTests.user_tests


class UserTests(unittest.TestCase):

    # ------------- Base ------------------
<<<<<<< HEAD:AIHOPS/AIHOPS/Tests/AcceptanceTests/user_tests.py

=======
    @patch("Domain.src.Users.MemberController.Gmailor", new=MockGmailor)
    @patch("Domain.src.Server.TACController", new=MockTACController)
>>>>>>> 98672eb1a121b38289db5e55406a47e3de810ea6:AIHOPS/Tests/AcceptanceTests/user_tests.py
    def setUp(self) -> None:
        Base.metadata.create_all(engine)  # must init db
        FP.insert_defaults()  # Insert default factors
        self.server = Server()
        self.cookie1 = self.server.enter().result.cookie
        self.cookie2 = self.server.enter().result.cookie
<<<<<<< HEAD:AIHOPS/AIHOPS/Tests/AcceptanceTests/user_tests.py
        self.server.register(self.cookie1, "Alice", "")
        self.server.register(self.cookie2, "Bob", "")
    
=======

        # Register users in setUp to avoid conflicts
        self.facade.register_and_verify(self.server, self.cookie1, "Alice", "")
        self.facade.register_and_verify(self.server, self.cookie2, "Bob", "")

>>>>>>> 98672eb1a121b38289db5e55406a47e3de810ea6:AIHOPS/Tests/AcceptanceTests/user_tests.py
    def tearDown(self) -> None:
        self.server.clear_db()
        FP.insert_defaults()  # Restore default factors after clearing

    def text_enter(self):
        res = self.server.enter()
        self.assertTrue(res.success, f"enter failed")

    # ------------- User ------------------

    def test_Register_Success(self):
        res = self.server.register(self.server.enter().result.cookie, "Charlie", "")
        self.assertTrue(
            res.success, f"register failed when it should have succeeded for Charlie"
        )

    def test_Register_Fail(self):
        # Try to register Alice again (already registered in setUp)
        res = self.server.register(self.server.enter().result.cookie, "Alice", "")
        self.assertFalse(
            res.success, f"register succeeded when it should have failed for Alice"
        )

    def test_Login_Success(self):
        res = self.server.login(self.cookie1, "Alice", "")
        self.assertTrue(
            res.success, f"login failed when it should have succeeded for Alice"
        )
        self.server.logout(self.cookie1)

    def test_Login_Fail(self):
        res = self.server.login(self.server.enter().result.cookie, "Chloe", "")
        self.assertFalse(
            res.success,
            f"login succeeded when it should have failed for Chloe - not registered",
        )

    def test_Logout_Success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.logout(self.cookie1)
        self.assertTrue(
            res.success, f"logout failed when it should have succeeded for Alice"
        )

    def test_Logout_Fail_Empty_Cookie(self):
        res = self.server.logout(None)
        self.assertFalse(
            res.success, f"logout succeeded when it should have failed - empty cookie"
        )

    def test_Logout_Fail_Not_LoggedIn(self):
        cookie = self.server.enter().result.cookie
        res = self.server.logout(cookie)
        self.assertFalse(
            res.success, f"logout succeeded when it should have failed - not logged in"
        )

    def test_Verify_Success(self):
        res = self.server.verify(self.cookie1, "Alice", "", "1234")
        self.assertTrue(
            res.success, f"verify failed when it should have succeeded for Alice"
        )
