import os
import unittest
from unittest.mock import patch, MagicMock
import time

from Domain.src.Server import Server
from Domain.src.DS import FactorsPool as FP
from Service.config import Base, engine
from Tests.AcceptanceTests.Facade import Facade
from Tests.AcceptanceTests.mocks.MockGmailor import MockGmailor
from Tests.AcceptanceTests.mocks.MockTACController import MockTACController


class DBProjectTests(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        print(f"Current working directory: {os.getcwd()}")
        print("Setting up test class...")

    def setUp(self) -> None:
        print("\n" + "=" * 50)
        print("SETTING UP TEST")
        print("=" * 50)

        # Clear and recreate database
        Base.metadata.drop_all(engine)
        Base.metadata.create_all(engine)
        FP.insert_defaults()

        # Test data
        self.AliceCred = ["TestAlice", "123"]
        self.BobCred = ["TestBob", "123"]
        self.EveCred = ["TestEve", "123"]

        self.p1_data = ["TestProject1", "Test Description 1"]
        self.p2_data = ["TestProject2", "Test Description 2"]

        self.factors = (
            (
                "TestFactor1",
                "Test Description",
                ["scale0", "scale1", "scale2", "scale3", "scale4"],
                ["exp0", "exp1", "exp2", "exp3", "exp4"],
            ),
        )
        self.severities = [1, 2, 3, 4, 5]

        print("✅ Setup completed")

    def tearDown(self) -> None:
        print("🧹 Cleaning up...")
        if hasattr(self, "server") and self.server:
            try:
                self.server.clear_db()
            except Exception as e:
                print(f"Error during cleanup: {e}")
        FP.insert_defaults()
        print("✅ Cleanup completed")

    @patch("Domain.src.Users.MemberController.Gmailor", MockGmailor)
    @patch("Domain.src.Server.TACController", MockTACController)
    def test_simple_registration_debug(self):
        """Debug test to see what's failing in user registration"""
        print("\n" + "=" * 50)
        print("DEBUG: Testing simple user registration")
        print("=" * 50)

        # Create server
        self.server = Server()
        print("✅ Server created")

        # Test MockGmailor directly
        print("🔍 Testing MockGmailor directly...")
        mock_gmailor = MockGmailor()
        register_result = mock_gmailor.register("test@example.com")
        print(
            f"MockGmailor register result: {register_result.success} - {register_result.msg}"
        )

        verify_result = mock_gmailor.verify("test@example.com", "1234")
        print(
            f"MockGmailor verify result: {verify_result.success} - {verify_result.msg}"
        )

        # Test server registration
        print("🔍 Testing server registration...")
        cookie = self.server.enter().result.cookie
        print(f"✅ Got cookie: {cookie}")

        # Try to register TestAlice
        print(f"🔍 Registering {self.AliceCred[0]}...")
        register_res = self.server.register(
            cookie, self.AliceCred[0], self.AliceCred[1]
        )
        print(f"Register result: {register_res.success} - {register_res.msg}")

        if register_res.success:
            print(f"🔍 Verifying {self.AliceCred[0]}...")
            verify_res = self.server.verify(
                cookie, self.AliceCred[0], self.AliceCred[1], "1234"
            )
            print(f"Verify result: {verify_res.success} - {verify_res.msg}")

            if verify_res.success:
                print(f"🔍 Testing login for {self.AliceCred[0]}...")
                login_res = self.server.login(
                    cookie, self.AliceCred[0], self.AliceCred[1]
                )
                print(f"Login result: {login_res.success} - {login_res.msg}")

                if login_res.success:
                    print("✅ Complete registration flow successful!")
                    self.server.logout(cookie)
                    self.assertTrue(True)
                else:
                    print("❌ Login failed")
                    self.fail(f"Login failed: {login_res.msg}")
            else:
                print("❌ Verification failed")
                self.fail(f"Verification failed: {verify_res.msg}")
        else:
            print("❌ Registration failed")
            self.fail(f"Registration failed: {register_res.msg}")

    @patch("Domain.src.Users.MemberController.Gmailor", MockGmailor)
    @patch("Domain.src.Server.TACController", MockTACController)
    def test_simple_project_creation_debug(self):
        """Debug test for project creation"""
        print("\n" + "=" * 50)
        print("DEBUG: Testing simple project creation")
        print("=" * 50)

        self.server = Server()

        # Register and verify Alice
        cookie = self.server.enter().result.cookie

        register_res = self.server.register(
            cookie, self.AliceCred[0], self.AliceCred[1]
        )
        print(f"Register result: {register_res.success} - {register_res.msg}")
        self.assertTrue(
            register_res.success, f"Registration failed: {register_res.msg}"
        )

        verify_res = self.server.verify(
            cookie, self.AliceCred[0], self.AliceCred[1], "1234"
        )
        print(f"Verify result: {verify_res.success} - {verify_res.msg}")
        self.assertTrue(verify_res.success, f"Verification failed: {verify_res.msg}")

        login_res = self.server.login(cookie, self.AliceCred[0], self.AliceCred[1])
        print(f"Login result: {login_res.success} - {login_res.msg}")
        self.assertTrue(login_res.success, f"Login failed: {login_res.msg}")

        # Create project
        project_res = self.server.create_project(
            cookie, self.p1_data[0], self.p1_data[1]
        )
        print(f"Project creation result: {project_res.success} - {project_res.msg}")
        self.assertTrue(
            project_res.success, f"Project creation failed: {project_res.msg}"
        )

        pid = project_res.result
        print(f"✅ Created project with ID: {pid}")

        # Test database persistence
        print("🔍 Testing database persistence...")
        new_server = Server()  # Create new server instance

        projects = new_server.project_manager.projects
        projects_loaded = projects.size()
        print(f"Projects loaded from database: {projects_loaded}")

        self.assertEqual(
            projects_loaded, 1, f"Expected 1 project, got {projects_loaded}"
        )

        loaded_project = projects.get(pid)
        self.assertIsNotNone(loaded_project, f"Project {pid} not found after reload")

        print(f"✅ Project persistence test passed!")
        print(f"   Project name: {loaded_project.name}")
        print(f"   Project desc: {loaded_project.desc}")

    @patch("Domain.src.Users.MemberController.Gmailor", MockGmailor)
    @patch("Domain.src.Server.TACController", MockTACController)
    def test_mock_verification(self):
        """Test that mocks are working correctly"""
        print("\n" + "=" * 50)
        print("DEBUG: Testing mock verification")
        print("=" * 50)

        # Test that patches are working
        self.server = Server()

        # Check if the mock is being used
        print("🔍 Checking if MockGmailor is being used...")

        # The gmailor should be MockGmailor
        gmailor = self.server.user_controller.gmailor
        print(f"Gmailor type: {type(gmailor)}")
        print(f"Is MockGmailor: {type(gmailor).__name__ == 'MockGmailor'}")

        # Check if the mock TACController is being used
        tac_controller = self.server.tac_controller
        print(f"TACController type: {type(tac_controller)}")
        print(
            f"Is MockTACController: {type(tac_controller).__name__ == 'MockTACController'}"
        )

        if type(gmailor).__name__ == "MockGmailor":
            print("✅ MockGmailor is being used correctly")
        else:
            print("❌ MockGmailor is NOT being used - this is the problem!")

        if type(tac_controller).__name__ == "MockTACController":
            print("✅ MockTACController is being used correctly")
        else:
            print("❌ MockTACController is NOT being used")

        # Test basic mock functionality
        print("🔍 Testing mock functionality...")
        cookie = self.server.enter().result.cookie

        # This should work with mocks
        register_res = self.server.register(cookie, "MockTest", "123")
        print(f"Mock register result: {register_res.success} - {register_res.msg}")

        if register_res.success:
            verify_res = self.server.verify(cookie, "MockTest", "123", "1234")
            print(f"Mock verify result: {verify_res.success} - {verify_res.msg}")

            if verify_res.success:
                print("✅ Mocks are working correctly")
                self.assertTrue(True)
            else:
                print("❌ Mock verification failed")
                self.fail("Mock verification failed")
        else:
            print("❌ Mock registration failed")
            self.fail("Mock registration failed")

    @patch("Domain.src.Users.MemberController.Gmailor", MockGmailor)
    @patch("Domain.src.Server.TACController", MockTACController)
    def test_multiple_user_registration(self):
        """Test registering multiple users"""
        print("\n" + "=" * 50)
        print("DEBUG: Testing multiple user registration")
        print("=" * 50)

        self.server = Server()
        users = [self.AliceCred, self.BobCred, self.EveCred]
        cookies = []

        for user_cred in users:
            cookie = self.server.enter().result.cookie
            cookies.append(cookie)

            # Register user
            register_res = self.server.register(cookie, user_cred[0], user_cred[1])
            self.assertTrue(
                register_res.success,
                f"Registration failed for {user_cred[0]}: {register_res.msg}",
            )

            # Verify user
            verify_res = self.server.verify(cookie, user_cred[0], user_cred[1], "1234")
            self.assertTrue(
                verify_res.success,
                f"Verification failed for {user_cred[0]}: {verify_res.msg}",
            )

            # Login user
            login_res = self.server.login(cookie, user_cred[0], user_cred[1])
            self.assertTrue(
                login_res.success, f"Login failed for {user_cred[0]}: {login_res.msg}"
            )

            print(f"✅ Successfully registered and logged in {user_cred[0]}")

        print("✅ All users registered successfully")

    @patch("Domain.src.Users.MemberController.Gmailor", MockGmailor)
    @patch("Domain.src.Server.TACController", MockTACController)
    def test_project_with_factors(self):
        """Test project creation with factors"""
        print("\n" + "=" * 50)
        print("DEBUG: Testing project with factors")
        print("=" * 50)

        self.server = Server()

        # Setup user
        cookie = self.server.enter().result.cookie
        register_res = self.server.register(
            cookie, self.AliceCred[0], self.AliceCred[1]
        )
        self.assertTrue(register_res.success)

        verify_res = self.server.verify(
            cookie, self.AliceCred[0], self.AliceCred[1], "1234"
        )
        self.assertTrue(verify_res.success)

        login_res = self.server.login(cookie, self.AliceCred[0], self.AliceCred[1])
        self.assertTrue(login_res.success)

        # Create project with default factors
        project_res = self.server.create_project(
            cookie, self.p1_data[0], self.p1_data[1], True
        )
        self.assertTrue(
            project_res.success, f"Project creation failed: {project_res.msg}"
        )

        pid = project_res.result
        print(f"✅ Created project with ID: {pid}")

        # Check project factors
        factors_res = self.server.get_project_factors(cookie, pid)
        if factors_res.success:
            print(f"✅ Project has {len(factors_res.result)} factors")
        else:
            print(f"⚠️ Could not get project factors: {factors_res.msg}")

        # Set severity factors
        severity_res = self.server.set_project_severity_factors(
            cookie, pid, self.severities
        )
        if severity_res.success:
            print(f"✅ Set severity factors: {self.severities}")
        else:
            print(f"⚠️ Could not set severity factors: {severity_res.msg}")

    @patch("Domain.src.Users.MemberController.Gmailor", MockGmailor)
    @patch("Domain.src.Server.TACController", MockTACController)
    def test_project_member_management(self):
        """Test adding and removing project members"""
        print("\n" + "=" * 50)
        print("DEBUG: Testing project member management")
        print("=" * 50)

        self.server = Server()

        # Setup Alice (project owner)
        alice_cookie = self.server.enter().result.cookie
        self.server.register(alice_cookie, self.AliceCred[0], self.AliceCred[1])
        self.server.verify(alice_cookie, self.AliceCred[0], self.AliceCred[1], "1234")
        self.server.login(alice_cookie, self.AliceCred[0], self.AliceCred[1])

        # Setup Bob (member to be added)
        bob_cookie = self.server.enter().result.cookie
        self.server.register(bob_cookie, self.BobCred[0], self.BobCred[1])
        self.server.verify(bob_cookie, self.BobCred[0], self.BobCred[1], "1234")
        self.server.login(bob_cookie, self.BobCred[0], self.BobCred[1])

        # Create project
        project_res = self.server.create_project(
            alice_cookie, self.p1_data[0], self.p1_data[1]
        )
        self.assertTrue(project_res.success)
        pid = project_res.result

        # Add Bob as member
        add_member_res = self.server.add_member(alice_cookie, pid, self.BobCred[0])
        if add_member_res.success:
            print(f"✅ Successfully added {self.BobCred[0]} to project")
        else:
            print(f"⚠️ Could not add member: {add_member_res.msg}")

        # Check pending requests for Bob
        pending_res = self.server.get_pending_requests(bob_cookie)
        if pending_res.success:
            print(f"✅ Bob has {len(pending_res.result)} pending requests")
        else:
            print(f"⚠️ Could not get pending requests: {pending_res.msg}")

    @patch("Domain.src.Users.MemberController.Gmailor", MockGmailor)
    @patch("Domain.src.Server.TACController", MockTACController)
    def test_project_lifecycle(self):
        """Test complete project lifecycle"""
        print("\n" + "=" * 50)
        print("DEBUG: Testing project lifecycle")
        print("=" * 50)

        self.server = Server()

        # Setup user
        cookie = self.server.enter().result.cookie
        self.server.register(cookie, self.AliceCred[0], self.AliceCred[1])
        self.server.verify(cookie, self.AliceCred[0], self.AliceCred[1], "1234")
        self.server.login(cookie, self.AliceCred[0], self.AliceCred[1])

        # Create project
        project_res = self.server.create_project(
            cookie, self.p1_data[0], self.p1_data[1], True
        )
        self.assertTrue(project_res.success)
        pid = project_res.result

        # Confirm factors
        confirm_factors_res = self.server.confirm_project_factors(cookie, pid)
        if confirm_factors_res.success:
            print("✅ Confirmed project factors")
        else:
            print(f"⚠️ Could not confirm factors: {confirm_factors_res.msg}")

        # Set and confirm severity factors
        severity_res = self.server.set_project_severity_factors(
            cookie, pid, self.severities
        )
        if severity_res.success:
            confirm_severity_res = self.server.confirm_project_severity_factors(
                cookie, pid
            )
            if confirm_severity_res.success:
                print("✅ Set and confirmed severity factors")
            else:
                print(
                    f"⚠️ Could not confirm severity factors: {confirm_severity_res.msg}"
                )

        # Try to publish project
        publish_res = self.server.publish_project(cookie, pid)
        if publish_res.success:
            print("✅ Successfully published project")
        else:
            print(f"⚠️ Could not publish project: {publish_res.msg}")

        # Archive project
        archive_res = self.server.archive_project(cookie, pid)
        if archive_res.success:
            print("✅ Successfully archived project")
        else:
            print(f"⚠️ Could not archive project: {archive_res.msg}")

    @patch("Domain.src.Users.MemberController.Gmailor", MockGmailor)
    @patch("Domain.src.Server.TACController", MockTACController)
    def test_session_management(self):
        """Test session creation and validation"""
        print("\n" + "=" * 50)
        print("DEBUG: Testing session management")
        print("=" * 50)

        self.server = Server()

        # Test session creation
        enter_res = self.server.enter()
        self.assertTrue(enter_res.success)
        cookie = enter_res.result.cookie
        print(f"✅ Created session with cookie: {cookie}")

        # Test session validation
        session_res = self.server.get_session(cookie)
        self.assertTrue(session_res.success)
        print(f"✅ Session validated successfully")

        # Test invalid session
        invalid_session_res = self.server.get_session(99999)
        self.assertFalse(invalid_session_res.success)
        print(f"✅ Invalid session properly rejected")

        # Test session validation with email
        valid_session_res = self.server.is_valid_session(cookie, None)
        self.assertTrue(valid_session_res.success)
        print(f"✅ Session validation without email works")

    @patch("Domain.src.Users.MemberController.Gmailor", MockGmailor)
    @patch("Domain.src.Server.TACController", MockTACController)
    def test_loading_member_votes(self):
        """Test loading member votes from database"""
        print("\n" + "=" * 50)
        print("DEBUG: Testing member votes loading")
        print("=" * 50)

        self.server = Server()

        # Setup user and project
        cookie = self.server.enter().result.cookie
        self.server.register(cookie, self.AliceCred[0], self.AliceCred[1])
        self.server.verify(cookie, self.AliceCred[0], self.AliceCred[1], "1234")
        self.server.login(cookie, self.AliceCred[0], self.AliceCred[1])

        # Create project with factors
        project_res = self.server.create_project(
            cookie, self.p1_data[0], self.p1_data[1], True
        )
        self.assertTrue(project_res.success)
        pid = project_res.result

        # Get member votes (should be empty initially)
        votes_res = self.server.get_member_vote_on_project(cookie, pid)
        if votes_res.success:
            print(f"✅ Retrieved member votes: {votes_res.result}")
        else:
            print(f"⚠️ Could not get member votes: {votes_res.msg}")

    @patch("Domain.src.Users.MemberController.Gmailor", MockGmailor)
    @patch("Domain.src.Server.TACController", MockTACController)
    def test_loading_pending(self):
        """Test loading pending requests"""
        print("\n" + "=" * 50)
        print("DEBUG: Testing pending requests loading")
        print("=" * 50)

        self.server = Server()

        # Setup users
        alice_cookie = self.server.enter().result.cookie
        self.server.register(alice_cookie, self.AliceCred[0], self.AliceCred[1])
        self.server.verify(alice_cookie, self.AliceCred[0], self.AliceCred[1], "1234")
        self.server.login(alice_cookie, self.AliceCred[0], self.AliceCred[1])

        bob_cookie = self.server.enter().result.cookie
        self.server.register(bob_cookie, self.BobCred[0], self.BobCred[1])
        self.server.verify(bob_cookie, self.BobCred[0], self.BobCred[1], "1234")
        self.server.login(bob_cookie, self.BobCred[0], self.BobCred[1])

        # Create project and add member
        project_res = self.server.create_project(
            alice_cookie, self.p1_data[0], self.p1_data[1]
        )
        self.assertTrue(project_res.success)
        pid = project_res.result

        # Add Bob as member
        add_member_res = self.server.add_member(alice_cookie, pid, self.BobCred[0])

        # Check pending requests
        pending_res = self.server.get_pending_requests(bob_cookie)
        if pending_res.success:
            print(f"✅ Bob has {len(pending_res.result)} pending requests")
        else:
            print(f"⚠️ Could not get pending requests: {pending_res.msg}")

        # Test with new server instance (database persistence)
        new_server = Server()
        new_bob_cookie = new_server.enter().result.cookie
        new_server.login(new_bob_cookie, self.BobCred[0], self.BobCred[1])

        new_pending_res = new_server.get_pending_requests(new_bob_cookie)
        if new_pending_res.success:
            print(
                f"✅ After reload, Bob has {len(new_pending_res.result)} pending requests"
            )
        else:
            print(
                f"⚠️ Could not get pending requests after reload: {new_pending_res.msg}"
            )

    @patch("Domain.src.Users.MemberController.Gmailor", MockGmailor)
    @patch("Domain.src.Server.TACController", MockTACController)
    def test_factor_management(self):
        """Test factor creation and management"""
        print("\n" + "=" * 50)
        print("DEBUG: Testing factor management")
        print("=" * 50)

        self.server = Server()

        # Setup user
        cookie = self.server.enter().result.cookie
        self.server.register(cookie, self.AliceCred[0], self.AliceCred[1])
        self.server.verify(cookie, self.AliceCred[0], self.AliceCred[1], "1234")
        self.server.login(cookie, self.AliceCred[0], self.AliceCred[1])

        # Create project
        project_res = self.server.create_project(
            cookie, self.p1_data[0], self.p1_data[1]
        )
        self.assertTrue(project_res.success)
        pid = project_res.result

        # Add custom factor
        factor_res = self.server.add_project_factor(
            cookie,
            pid,
            "Custom Factor",
            "Custom Description",
            ["Low", "Medium", "High"],
            ["Low impact", "Medium impact", "High impact"],
        )
        if factor_res.success:
            print(f"✅ Added custom factor: {factor_res.result}")
        else:
            print(f"⚠️ Could not add custom factor: {factor_res.msg}")

        # Get factor pool
        pool_res = self.server.get_factor_pool_of_member(cookie)
        if pool_res.success:
            print(f"✅ Retrieved factor pool with {len(pool_res.result)} factors")
        else:
            print(f"⚠️ Could not get factor pool: {pool_res.msg}")

    @patch("Domain.src.Users.MemberController.Gmailor", MockGmailor)
    @patch("Domain.src.Server.TACController", MockTACController)
    def test_error_handling(self):
        """Test various error conditions"""
        print("\n" + "=" * 50)
        print("DEBUG: Testing error handling")
        print("=" * 50)

        self.server = Server()

        # Test invalid session
        invalid_cookie = 99999
        login_res = self.server.login(invalid_cookie, "test", "test")
        self.assertFalse(login_res.success)
        print("✅ Invalid session properly rejected")

        # Test registration with existing user
        cookie = self.server.enter().result.cookie
        register_res1 = self.server.register(
            cookie, self.AliceCred[0], self.AliceCred[1]
        )
        self.assertTrue(register_res1.success)

        # Verify first registration
        self.server.verify(cookie, self.AliceCred[0], self.AliceCred[1], "1234")

        # Try to register same user again
        cookie2 = self.server.enter().result.cookie
        register_res2 = self.server.register(
            cookie2, self.AliceCred[0], self.AliceCred[1]
        )
        self.assertFalse(register_res2.success)
        print("✅ Duplicate registration properly rejected")

        # Test project creation without login
        cookie3 = self.server.enter().result.cookie
        project_res = self.server.create_project(cookie3, "Test", "Test")
        self.assertFalse(project_res.success)
        print("✅ Project creation without login properly rejected")


if __name__ == "__main__":
    # Run with higher verbosity for detailed output
    unittest.main(verbosity=2, failfast=True)
