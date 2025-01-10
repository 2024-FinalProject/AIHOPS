import unittest

from Domain.src.Server import Server
from Service.config import Base, engine

# How to run the tests:
#       In a terminal, run the following commands:
#               cd AIHOPS
#               python -m unittest AcceptanceTests.AcceptanceTests

class UserAcceptanceTests(unittest.TestCase):

    # ------------- Base ------------------

    def setUp(self) -> None:
        Base.metadata.create_all(engine)        # must init db
        self.server = Server()
        self.cookie1 = self.server.enter().result.cookie
        self.cookie2 = self.server.enter().result.cookie
        self.server.register(self.cookie1, "Alice", "")
        self.server.register(self.cookie2, "Bob", "")
    
    def tearDown(self) -> None:
        #TODO:: 
        #           1) Remove the registered users (All of them, including the ones in the SetUp) from the database
        #           2) Remove the organizations created in the tests
        self.server.clear_db()
        pass #TODO:: remove this line after adding the function above

    def text_enter(self):
        res = self.server.enter()
        self.assertTrue(res.success, f'enter failed')

    # ------------- User ------------------

    def test_Register_Success(self):
        res = self.server.register(self.server.enter().result.cookie, "Charlie", "")
        self.assertTrue(res.success, f'register failed when it should have succeeded for Charlie')
        #TODO:: add a private function to remove the user from the database, or this test will fail on the next run
    
    def test_Register_Fail(self):
        res = self.server.register(self.cookie1, "Alice", "")
        self.assertFalse(res.success, f'register succeeded when it should have failed for Alice')

    def test_Login_Success(self):
        res = self.server.login(self.cookie1, "Alice", "")
        self.assertTrue(res.success, f'login failed when it should have succeeded for Alice')
        self.server.logout(self.cookie1)
    
    def test_Login_Fail(self):
        res = self.server.login(self.server.enter().result.cookie, "Chloe", "")
        self.assertFalse(res.success, f'login succeeded when it should have failed for Chloe - not registered')

    def test_Logout_Success(self):
        self.server.login(self.cookie1, "Alice", "")
        res = self.server.logout(self.cookie1)
        self.assertTrue(res.success, f'logout failed when it should have succeeded for Alice')
    
    def test_Logout_Fail_Empty_Cookie(self):
        res = self.server.logout(None)
        self.assertFalse(res.success, f'logout succeeded when it should have failed - empty cookie')    
    
    def test_Logout_Fail_Not_LoggedIn(self):
        # TODO:: make sure that all of the users are logged out
        cookie = self.server.enter().result.cookie
        res = self.server.logout(cookie)
        self.assertFalse(res.success, f'logout succeeded when it should have failed - not logged in')
