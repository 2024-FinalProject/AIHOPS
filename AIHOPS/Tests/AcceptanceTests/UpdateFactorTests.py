import unittest
from unittest.mock import patch, MagicMock
import time
import random

from Domain.src.Server import Server
from Domain.src.DS import FactorsPool as FP
from Service.config import Base, engine
from sqlalchemy import text


# Mock classes defined directly in the test file
class MockGmailor:
    """Mock that never sends emails and always succeeds"""

    def __init__(self):
        pass

    def register(self, email, length=6):
        from Domain.src.Loggs.Response import ResponseSuccessMsg

        return ResponseSuccessMsg(f"Mock registration for {email}")

    def verify(self, email, code):
        from Domain.src.Loggs.Response import ResponseSuccessMsg

        return ResponseSuccessMsg(f"Mock verification for {email}")

    def verify_automatic(self, code):
        from Domain.src.Loggs.Response import ResponseSuccessObj

        return ResponseSuccessObj("Mock auto verification", "test@example.com")

    def is_member_verifiable(self, email):
        return True

    def send_email_invitation(self, email, inviting_member, project_name):
        from Domain.src.Loggs.Response import ResponseSuccessMsg

        return ResponseSuccessMsg("Mock invitation sent")

    def start_password_recovery(self, email, length=6):
        pass

    def recover_password(self, email, code):
        pass


class MockTACController:
    """Mock Terms and Conditions controller"""

    def __init__(self, socketio=None, folder_name=None):
        self.socketio = socketio
        self.current_version = 1
        self.current_text = "Mock Terms and Conditions"

    def load(self):
        from Domain.src.Loggs.Response import ResponseSuccessMsg

        return ResponseSuccessMsg("Mock terms loaded")

    def update(self, tac_text):
        from Domain.src.Loggs.Response import ResponseSuccessMsg

        self.current_version += 1
        self.current_text = tac_text
        return ResponseSuccessMsg("Mock terms updated")

    def get_current(self):
        return {"version": self.current_version, "tac_text": self.current_text}


# Test data
scales = ["1", "1", "1", "1", "1"]
different_scales = ["Low", "Medium", "High", "Very High", "Critical"]
different_explanations = [
    "Low impact",
    "Medium impact",
    "High impact",
    "Very High impact",
    "Critical impact",
]

projects = [["Project1", "Desc1"], ["Project2", "Desc2"], ["Project3", "Desc3"]]
factors1 = [["factor1", "desc1", scales, scales], ["factor2", "desc2", scales, scales]]
factors2 = [["f1", "d1", scales, scales], ["f2", "d2", scales, scales]]
factors3 = [
    ["Security", "Security assessment factor", different_scales, different_explanations]
]


class DebugServerFacade:
    """Facade with extensive debugging for factor operations"""

    def __init__(self, server):
        self.server = server
        self.user_cookies = {}

    def setup_user(self, email, password="123", max_retries=3):
        """Set up a user with retry logic"""
        for attempt in range(max_retries):
            try:
                print(f"Setting up user: {email} (attempt {attempt + 1})")

                cookie_res = self.server.enter()
                if not cookie_res.success:
                    raise Exception(f"Failed to get cookie: {cookie_res.msg}")
                cookie = cookie_res.result.cookie

                register_res = self.server.register(cookie, email, password)
                if not register_res.success:
                    if "is taken" in register_res.msg:
                        login_res = self.server.login(cookie, email, password)
                        if login_res.success:
                            self.user_cookies[email] = cookie
                            print(
                                f"User {email} already existed, logged in successfully"
                            )
                            return cookie
                    raise Exception(f"Failed to register {email}: {register_res.msg}")

                verify_res = self.server.verify(cookie, email, password, "1234")
                if not verify_res.success:
                    raise Exception(f"Failed to verify {email}: {verify_res.msg}")

                login_res = self.server.login(cookie, email, password)
                if not login_res.success:
                    raise Exception(f"Failed to login {email}: {login_res.msg}")

                self.user_cookies[email] = cookie
                print(f"Successfully set up user: {email}")
                return cookie

            except Exception as e:
                print(f"Attempt {attempt + 1} failed for {email}: {e}")
                if attempt == max_retries - 1:
                    raise
                time.sleep(0.1)

        raise Exception(f"Failed to setup user {email} after {max_retries} attempts")

    def get_cookie(self, email):
        if email not in self.user_cookies:
            raise Exception(f"User {email} not set up")
        return self.user_cookies[email]

    def create_project(self, email, use_defaults, name, desc):
        cookie = self.get_cookie(email)
        res = self.server.create_project(cookie, name, desc, use_defaults)
        if not res.success:
            raise Exception(f"Failed to create project: {res.msg}")
        print(f"Created project {res.result} for {email}: {name}")
        return res.result

    def add_factor(self, email, pid, name, desc, scales_desc, scales_explanation):
        cookie = self.get_cookie(email)
        print(f"Adding factor '{name}' to project {pid} for {email}")
        res = self.server.add_project_factor(
            cookie, pid, name, desc, scales_desc, scales_explanation
        )
        if not res.success:
            raise Exception(f"Failed to add factor: {res.msg}")
        fid = res.result.fid
        print(f"Added factor {fid} '{name}' to project {pid}")
        return fid

    def update_factor(
        self, email, fid, pid, apply_to_all, name, desc, scales_desc, scales_explanation
    ):
        cookie = self.get_cookie(email)
        print(
            f"Updating factor {fid} in project {pid} for {email}, apply_to_all={apply_to_all}"
        )
        print(f"  Old factor ID: {fid}")
        print(f"  New name: {name}")

        # Debug: Check what factors exist before update
        before_factors = self.get_project_factors(email, pid)
        print(f"  Factors before update: {[f['id'] for f in before_factors]}")

        res = self.server.update_factor(
            cookie, fid, pid, name, desc, scales_desc, scales_explanation, apply_to_all
        )
        if not res.success:
            raise Exception(f"Failed to update factor: {res.msg}")

        new_fid = res.result.fid
        print(f"  Updated to new factor ID: {new_fid}")

        # Debug: Check what factors exist after update
        after_factors = self.get_project_factors(email, pid)
        print(f"  Factors after update: {[f['id'] for f in after_factors]}")

        return new_fid

    def get_project_factors(self, email, pid):
        cookie = self.get_cookie(email)
        res = self.server.get_project_factors(cookie, pid)
        if not res.success:
            raise Exception(f"Failed to get project factors: {res.msg}")
        return res.result

    def get_factor_pool(self, email):
        cookie = self.get_cookie(email)
        res = self.server.get_factor_pool_of_member(cookie)
        if not res.success:
            raise Exception(f"Failed to get factor pool: {res.msg}")
        return res.result

    def insert_factor_from_pool(self, email, fid, pid):
        cookie = self.get_cookie(email)
        print(f"Inserting factor {fid} from pool into project {pid} for {email}")
        res = self.server.set_project_factors(cookie, pid, [fid])
        if not res.success:
            raise Exception(f"Failed to add factor to project: {res.msg}")
        print(f"Successfully inserted factor {fid} into project {pid}")
        return True

    def debug_print_all_factors(self, email, label=""):
        """Print all factors for debugging"""
        try:
            pool_factors = self.get_factor_pool(email)
            print(f"DEBUG {label} - Factor pool for {email}:")
            for factor in pool_factors:
                print(
                    f"  Factor ID {factor['id']}: {factor['name']} - {factor['description']}"
                )
        except Exception as e:
            print(f"DEBUG {label} - Failed to get factor pool for {email}: {e}")


class UpdateFactorTests(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        """Class-level setup with safe database recreation"""
        print("Setting up test class...")
        try:
            # Force close all connections
            engine.dispose()

            # Safely recreate the database schema
            try:
                Base.metadata.drop_all(engine)
            except Exception as e:
                print(f"Warning during drop_all (this is usually okay): {e}")

            # Create all tables
            Base.metadata.create_all(engine)

            # Insert default factors
            FP.insert_defaults()
            print("Database setup complete")
        except Exception as e:
            print(f"Error in class setup: {e}")
            raise

    def setUp(self) -> None:
        print(f"\n{'='*60}")
        print(f"Setting up test: {self._testMethodName}")
        print(f"{'='*60}")

        # Apply patches
        self.gmailor_patcher = patch(
            "Domain.src.Users.MemberController.Gmailor", MockGmailor
        )
        self.tac_patcher = patch("Domain.src.Server.TACController", MockTACController)
        self.gmailor_patcher2 = patch("Domain.src.Users.Gmailor.Gmailor", MockGmailor)

        self.gmailor_patcher.start()
        self.tac_patcher.start()
        self.gmailor_patcher2.start()

        # Safely clean database state
        try:
            print("Cleaning database for test...")
            engine.dispose()

            # Safe table recreation
            try:
                Base.metadata.drop_all(engine)
            except Exception as e:
                print(f"Warning during drop (expected): {e}")

            Base.metadata.create_all(engine)
            FP.insert_defaults()
            print("Database cleaned and recreated successfully")
        except Exception as e:
            print(f"Error during database setup: {e}")
            # Try to continue anyway
            try:
                Base.metadata.create_all(engine)
                FP.insert_defaults()
                print("Fallback database creation succeeded")
            except Exception as e2:
                print(f"Fallback also failed: {e2}")
                raise

        # Create server and facade AFTER database is clean
        print("Creating server...")
        try:
            self.server = Server()
            self.facade = DebugServerFacade(self.server)
            print("Server created successfully")
        except Exception as e:
            print(f"Error creating server: {e}")
            raise

        # Verify server initialization
        print(f"Gmailor type: {type(self.server.user_controller.gmailor).__name__}")

        # Counter for unique emails
        self.email_counter = int(time.time() * 1000) % 100000
        print(f"Setup complete for: {self._testMethodName}")

    def tearDown(self) -> None:
        print(f"Tearing down test: {self._testMethodName}")

        # Clear server state
        try:
            if hasattr(self, "server") and self.server:
                try:
                    self.server.clear_db()
                    print("Server database cleared")
                except Exception as e:
                    print(f"Warning during server cleanup: {e}")
        except Exception as e:
            print(f"Warning during server cleanup: {e}")

        # Stop patches
        try:
            self.gmailor_patcher.stop()
            self.tac_patcher.stop()
            self.gmailor_patcher2.stop()
            print("Patches stopped")
        except Exception as e:
            print(f"Warning during patch cleanup: {e}")

        print(f"Teardown complete for: {self._testMethodName}")

    def get_unique_email(self, base="alice"):
        """Get a truly unique email"""
        self.email_counter += 1
        timestamp = int(time.time() * 1000) % 10000
        random_part = random.randint(100, 999)
        return f"{base}_{timestamp}_{random_part}_{self.email_counter}@test.com"

    # ============= ALL REQUIRED TESTS =============

    def test_basic_update_factor_happy_path(self):
        """Most basic test - single project, single factor update"""
        alice_email = self.get_unique_email("alice")
        self.facade.setup_user(alice_email)

        pid = self.facade.create_project(alice_email, False, "TestProject", "TestDesc")
        fid = self.facade.add_factor(
            alice_email, pid, "TestFactor", "TestDesc", scales, scales
        )

        # Debug before update
        self.facade.debug_print_all_factors(alice_email, "BEFORE UPDATE")

        new_fid = self.facade.update_factor(
            alice_email, fid, pid, False, "UpdatedFactor", "UpdatedDesc", scales, scales
        )

        # Debug after update
        self.facade.debug_print_all_factors(alice_email, "AFTER UPDATE")

        # Verify results
        project_factors = self.facade.get_project_factors(alice_email, pid)
        project_factor_ids = [f["id"] for f in project_factors]

        print(f"Project factor IDs: {project_factor_ids}")
        print(f"Old factor ID: {fid}, New factor ID: {new_fid}")

        self.assertFalse(
            fid in project_factor_ids, f"Old factor {fid} should be removed"
        )
        self.assertTrue(
            new_fid in project_factor_ids, f"New factor {new_fid} should be in project"
        )

    def test_update_factor_with_defaults_false_apply_false(self):
        """Test with use_defaults=False, apply=False"""
        alice_email = self.get_unique_email("alice")
        self.facade.setup_user(alice_email)

        pid = self.facade.create_project(alice_email, False, *projects[0])
        fid = self.facade.add_factor(alice_email, pid, *factors1[0])
        new_fid = self.facade.update_factor(alice_email, fid, pid, False, *factors2[0])

        # Verify results
        project_factors = self.facade.get_project_factors(alice_email, pid)
        project_factor_ids = [f["id"] for f in project_factors]

        self.assertFalse(fid in project_factor_ids)
        self.assertTrue(new_fid in project_factor_ids)

    def test_update_factor_with_defaults_true_apply_true(self):
        """Test with use_defaults=True, apply=True"""
        alice_email = self.get_unique_email("alice")
        self.facade.setup_user(alice_email)

        pid = self.facade.create_project(alice_email, True, *projects[0])
        fid = self.facade.add_factor(alice_email, pid, *factors1[0])
        new_fid = self.facade.update_factor(alice_email, fid, pid, True, *factors2[0])

        # Verify results
        project_factors = self.facade.get_project_factors(alice_email, pid)
        project_factor_ids = [f["id"] for f in project_factors]

        self.assertFalse(fid in project_factor_ids)
        self.assertTrue(new_fid in project_factor_ids)

    def test_update_factor_same_name_and_desc(self):
        """Test updating factor with same name and description"""
        alice_email = self.get_unique_email("alice")
        self.facade.setup_user(alice_email)

        pid = self.facade.create_project(alice_email, False, *projects[0])
        fid = self.facade.add_factor(alice_email, pid, *factors1[0])
        new_fid = self.facade.update_factor(alice_email, fid, pid, False, *factors1[0])

        # Verify results
        project_factors = self.facade.get_project_factors(alice_email, pid)
        project_factor_ids = [f["id"] for f in project_factors]

        self.assertTrue(new_fid in project_factor_ids)

        pool_factors = self.facade.get_factor_pool(alice_email)
        new_factor = next((f for f in pool_factors if f["id"] == new_fid), None)
        self.assertIsNotNone(new_factor)
        self.assertEqual(new_factor["name"], factors1[0][0])

    def test_update_factor_2_projects_apply_true(self):
        """Test updating factor across 2 projects with apply=True"""
        alice_email = self.get_unique_email("alice")
        self.facade.setup_user(alice_email)

        # Create first project
        pid1 = self.facade.create_project(alice_email, False, *projects[0])
        fid = self.facade.add_factor(alice_email, pid1, *factors1[0])

        # Create second project and add same factor
        pid2 = self.facade.create_project(alice_email, False, *projects[1])
        self.facade.insert_factor_from_pool(alice_email, fid, pid2)

        # Update factor with apply=True
        new_fid = self.facade.update_factor(alice_email, fid, pid1, True, *factors2[0])

        # Verify both projects updated
        project1_factors = self.facade.get_project_factors(alice_email, pid1)
        project1_factor_ids = [f["id"] for f in project1_factors]

        project2_factors = self.facade.get_project_factors(alice_email, pid2)
        project2_factor_ids = [f["id"] for f in project2_factors]

        self.assertTrue(new_fid in project1_factor_ids)
        self.assertTrue(new_fid in project2_factor_ids)
        self.assertFalse(fid in project1_factor_ids)
        self.assertFalse(fid in project2_factor_ids)

    def test_update_factor_2_projects_apply_false(self):
        """Test updating factor across 2 projects with apply=False"""
        alice_email = self.get_unique_email("alice")
        self.facade.setup_user(alice_email)

        # Create first project
        pid1 = self.facade.create_project(alice_email, False, *projects[0])
        fid = self.facade.add_factor(alice_email, pid1, *factors1[0])

        # Create second project and add same factor
        pid2 = self.facade.create_project(alice_email, False, *projects[1])
        self.facade.insert_factor_from_pool(alice_email, fid, pid2)

        # Update factor with apply=False
        new_fid = self.facade.update_factor(alice_email, fid, pid1, False, *factors2[0])

        # Verify only first project updated
        project1_factors = self.facade.get_project_factors(alice_email, pid1)
        project1_factor_ids = [f["id"] for f in project1_factors]

        project2_factors = self.facade.get_project_factors(alice_email, pid2)
        project2_factor_ids = [f["id"] for f in project2_factors]

        self.assertTrue(
            new_fid in project1_factor_ids,
            f"New factor {new_fid} should be in project 1. Found: {project1_factor_ids}",
        )
        self.assertFalse(
            new_fid in project2_factor_ids,
            f"New factor {new_fid} should NOT be in project 2. Found: {project2_factor_ids}",
        )
        self.assertFalse(
            fid in project1_factor_ids,
            f"Old factor {fid} should be removed from project 1. Found: {project1_factor_ids}",
        )
        self.assertTrue(
            fid in project2_factor_ids,
            f"Old factor {fid} should remain in project 2. Found: {project2_factor_ids}",
        )

    def test_update_factor_edge_case_empty_strings(self):
        """Test updating a factor with empty strings"""
        alice_email = self.get_unique_email("alice")
        self.facade.setup_user(alice_email)

        pid = self.facade.create_project(alice_email, False, *projects[0])
        fid = self.facade.add_factor(alice_email, pid, *factors1[0])

        # Try to update with empty name (should fail)
        with self.assertRaises(Exception) as context:
            self.facade.update_factor(
                alice_email, fid, pid, False, "", "desc", scales, scales
            )

        error_msg = str(context.exception).lower()
        self.assertTrue(
            "factor" in error_msg or "name" in error_msg or "empty" in error_msg
        )

    def test_update_factor_nonexistent_factor_id(self):
        """Test updating a factor that doesn't exist"""
        alice_email = self.get_unique_email("alice")
        self.facade.setup_user(alice_email)

        pid = self.facade.create_project(alice_email, False, *projects[0])

        # Try to update non-existent factor
        with self.assertRaises(Exception):
            self.facade.update_factor(alice_email, 99999, pid, False, *factors2[0])

    def test_update_factor_cross_user_isolation(self):
        """Test that updating factors for one user doesn't affect another"""
        # Generate completely unique emails
        base_time = int(time.time() * 1000)
        alice_email = (
            f"alice_unique_{base_time}_{random.randint(10000, 99999)}@test.com"
        )
        bob_email = (
            f"bob_unique_{base_time + 100}_{random.randint(10000, 99999)}@test.com"
        )

        self.facade.setup_user(alice_email)
        self.facade.setup_user(bob_email)

        # Alice creates project and adds factor
        alice_pid = self.facade.create_project(alice_email, False, *projects[0])
        alice_fid = self.facade.add_factor(alice_email, alice_pid, *factors1[0])

        # Bob creates project and adds similar factor
        bob_pid = self.facade.create_project(bob_email, False, *projects[1])
        bob_fid = self.facade.add_factor(bob_email, bob_pid, *factors1[0])

        # Alice updates her factor
        alice_new_fid = self.facade.update_factor(
            alice_email, alice_fid, alice_pid, False, *factors2[0]
        )

        # Verify Bob's factor is unchanged
        bob_factors = self.facade.get_project_factors(bob_email, bob_pid)
        bob_ids = [f["id"] for f in bob_factors]

        self.assertTrue(
            bob_fid in bob_ids,
            f"Bob's original factor {bob_fid} should still exist. Bob's factors: {bob_ids}",
        )
        self.assertFalse(
            alice_new_fid in bob_ids,
            f"Alice's new factor {alice_new_fid} should not appear in Bob's project. Bob's factors: {bob_ids}",
        )

    # ============= DEBUG TESTS =============

    def test_basic_update_factor_happy_path(self):
        """Most basic test - single project, single factor update"""
        alice_email = self.get_unique_email("alice")
        self.facade.setup_user(alice_email)

        pid = self.facade.create_project(alice_email, False, "TestProject", "TestDesc")
        fid = self.facade.add_factor(
            alice_email, pid, "TestFactor", "TestDesc", scales, scales
        )

        # Debug before update
        self.facade.debug_print_all_factors(alice_email, "BEFORE UPDATE")

        new_fid = self.facade.update_factor(
            alice_email, fid, pid, False, "UpdatedFactor", "UpdatedDesc", scales, scales
        )

        # Debug after update
        self.facade.debug_print_all_factors(alice_email, "AFTER UPDATE")

        # Verify results
        project_factors = self.facade.get_project_factors(alice_email, pid)
        project_factor_ids = [f["id"] for f in project_factors]

        print(f"Project factor IDs: {project_factor_ids}")
        print(f"Old factor ID: {fid}, New factor ID: {new_fid}")

        self.assertFalse(
            fid in project_factor_ids, f"Old factor {fid} should be removed"
        )
        self.assertTrue(
            new_fid in project_factor_ids, f"New factor {new_fid} should be in project"
        )

    def test_update_factor_2_projects_apply_false_debug(self):
        """Debug version of the failing 2 projects test"""
        alice_email = self.get_unique_email("alice")
        self.facade.setup_user(alice_email)

        # Create first project
        print("\n--- Creating first project ---")
        pid1 = self.facade.create_project(alice_email, False, *projects[0])
        fid = self.facade.add_factor(alice_email, pid1, *factors1[0])

        print(f"\n--- Project 1 after adding factor ---")
        factors1_initial = self.facade.get_project_factors(alice_email, pid1)
        print(f"Project 1 factors: {[(f['id'], f['name']) for f in factors1_initial]}")

        # Create second project and add same factor
        print("\n--- Creating second project ---")
        pid2 = self.facade.create_project(alice_email, False, *projects[1])
        self.facade.insert_factor_from_pool(alice_email, fid, pid2)

        print(f"\n--- Project 2 after adding factor ---")
        factors2_initial = self.facade.get_project_factors(alice_email, pid2)
        print(f"Project 2 factors: {[(f['id'], f['name']) for f in factors2_initial]}")

        # Update factor with apply=False
        print(f"\n--- Updating factor {fid} with apply=False ---")
        self.facade.debug_print_all_factors(alice_email, "BEFORE UPDATE")

        new_fid = self.facade.update_factor(alice_email, fid, pid1, False, *factors2[0])

        self.facade.debug_print_all_factors(alice_email, "AFTER UPDATE")

        # Check results
        print(f"\n--- Checking results ---")
        project1_factors = self.facade.get_project_factors(alice_email, pid1)
        project1_factor_ids = [f["id"] for f in project1_factors]
        print(
            f"Project 1 final factors: {[(f['id'], f['name']) for f in project1_factors]}"
        )

        project2_factors = self.facade.get_project_factors(alice_email, pid2)
        project2_factor_ids = [f["id"] for f in project2_factors]
        print(
            f"Project 2 final factors: {[(f['id'], f['name']) for f in project2_factors]}"
        )

        print(
            f"Expected new factor {new_fid} in project 1: {new_fid in project1_factor_ids}"
        )
        print(
            f"Expected old factor {fid} NOT in project 1: {fid not in project1_factor_ids}"
        )
        print(f"Expected old factor {fid} in project 2: {fid in project2_factor_ids}")
        print(
            f"Expected new factor {new_fid} NOT in project 2: {new_fid not in project2_factor_ids}"
        )

        # Assertions with better error messages
        self.assertTrue(
            new_fid in project1_factor_ids,
            f"New factor {new_fid} should be in project 1. Found: {project1_factor_ids}",
        )
        self.assertFalse(
            fid in project1_factor_ids,
            f"Old factor {fid} should be removed from project 1. Found: {project1_factor_ids}",
        )
        self.assertTrue(
            fid in project2_factor_ids,
            f"Old factor {fid} should remain in project 2. Found: {project2_factor_ids}",
        )
        self.assertFalse(
            new_fid in project2_factor_ids,
            f"New factor {new_fid} should NOT be in project 2. Found: {project2_factor_ids}",
        )

    def test_update_factor_cross_user_isolation_debug(self):
        """Debug version of cross-user isolation test"""
        # Generate completely unique emails
        base_time = int(time.time() * 1000)
        alice_email = (
            f"alice_unique_{base_time}_{random.randint(10000, 99999)}@test.com"
        )
        bob_email = (
            f"bob_unique_{base_time + 100}_{random.randint(10000, 99999)}@test.com"
        )

        print(f"Alice email: {alice_email}")
        print(f"Bob email: {bob_email}")

        # Setup users
        print("\n--- Setting up Alice ---")
        self.facade.setup_user(alice_email)
        print("\n--- Setting up Bob ---")
        self.facade.setup_user(bob_email)

        # Alice creates project and adds factor
        print("\n--- Alice creates project and adds factor ---")
        alice_pid = self.facade.create_project(alice_email, False, *projects[0])
        alice_fid = self.facade.add_factor(alice_email, alice_pid, *factors1[0])

        self.facade.debug_print_all_factors(alice_email, "ALICE AFTER ADDING FACTOR")

        # Bob creates project and adds similar factor
        print("\n--- Bob creates project and adds factor ---")
        bob_pid = self.facade.create_project(bob_email, False, *projects[1])
        bob_fid = self.facade.add_factor(bob_email, bob_pid, *factors1[0])

        self.facade.debug_print_all_factors(bob_email, "BOB AFTER ADDING FACTOR")

        # Alice updates her factor
        print(f"\n--- Alice updates her factor {alice_fid} ---")
        alice_new_fid = self.facade.update_factor(
            alice_email, alice_fid, alice_pid, False, *factors2[0]
        )

        print(f"Alice's new factor ID: {alice_new_fid}")
        self.facade.debug_print_all_factors(alice_email, "ALICE AFTER UPDATE")
        self.facade.debug_print_all_factors(bob_email, "BOB AFTER ALICE UPDATE")

        # Verify Bob's project factors
        print(f"\n--- Checking Bob's factors ---")
        bob_factors = self.facade.get_project_factors(bob_email, bob_pid)
        bob_ids = [f["id"] for f in bob_factors]
        print(f"Bob's project factors: {[(f['id'], f['name']) for f in bob_factors]}")
        print(f"Bob's original factor {bob_fid} in project: {bob_fid in bob_ids}")
        print(
            f"Alice's new factor {alice_new_fid} in Bob's project: {alice_new_fid in bob_ids}"
        )

        # Assertions with debug info
        self.assertTrue(
            bob_fid in bob_ids,
            f"Bob's original factor {bob_fid} should still exist. Bob's factors: {bob_ids}",
        )
        self.assertFalse(
            alice_new_fid in bob_ids,
            f"Alice's new factor {alice_new_fid} should not appear in Bob's project. Bob's factors: {bob_ids}",
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
