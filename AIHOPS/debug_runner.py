#!/usr/bin/env python3
"""
Debug Runner for DBProjectTests

This will help identify exactly what's failing in the user registration process.

Usage:
    python3 debug_runner.py
"""

import sys
import os
import unittest

# Add current directory to path
sys.path.insert(0, os.getcwd())


def main():
    print("🔍 DEBUG RUNNER FOR DBPROJECT TESTS")
    print("=" * 60)
    print(f"Working directory: {os.getcwd()}")

    # Check if we're in the right directory
    if not os.path.exists("Tests/AcceptanceTests"):
        print("❌ Error: Must be run from AIHOPS root directory")
        return 1

    # Check if mock files exist
    mock_files = [
        "Tests/AcceptanceTests/mocks/__init__.py",
        "Tests/AcceptanceTests/mocks/MockGmailor.py",
        "Tests/AcceptanceTests/mocks/MockTACController.py",
    ]

    missing_files = [f for f in mock_files if not os.path.exists(f)]
    if missing_files:
        print("❌ Error: Missing mock files:")
        for f in missing_files:
            print(f"  - {f}")
        return 1

    print("✅ All required files found")

    try:
        # Use the debug version directly
        print("\n🔍 Running mock verification test...")

        # Import and run just the mock verification test
        from Tests.AcceptanceTests.debug_DBProjectTests import DBProjectTests

        suite = unittest.TestSuite()
        suite.addTest(DBProjectTests("test_mock_verification"))

        runner = unittest.TextTestRunner(verbosity=2, stream=sys.stdout, buffer=False)
        result = runner.run(suite)

        if not result.wasSuccessful():
            print("❌ Mock verification failed - this is likely the root cause")
            return 1

        print("\n🔍 Running simple registration test...")

        suite = unittest.TestSuite()
        suite.addTest(DBProjectTests("test_simple_registration_debug"))

        runner = unittest.TextTestRunner(verbosity=2, stream=sys.stdout, buffer=False)
        result = runner.run(suite)

        if not result.wasSuccessful():
            print("❌ Registration test failed")
            for error in result.errors:
                print(f"ERROR: {error[1]}")
            for failure in result.failures:
                print(f"FAILURE: {failure[1]}")
            return 1

        print("\n🔍 Running simple project creation test...")

        suite = unittest.TestSuite()
        suite.addTest(DBProjectTests("test_simple_project_creation_debug"))

        runner = unittest.TextTestRunner(verbosity=2, stream=sys.stdout, buffer=False)
        result = runner.run(suite)

        if result.wasSuccessful():
            print("\n✅ All debug tests passed!")
            print("The issue was likely in the complex registration logic.")
            print("Now you can run the full tests.")
            return 0
        else:
            print("\n❌ Project creation test failed")
            for error in result.errors:
                print(f"ERROR: {error[1]}")
            for failure in result.failures:
                print(f"FAILURE: {failure[1]}")
            return 1

    except ImportError as e:
        print(f"❌ Import Error: {e}")
        print("Make sure debug_DBProjectTests.py is in the right location")
        return 1
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        import traceback

        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
