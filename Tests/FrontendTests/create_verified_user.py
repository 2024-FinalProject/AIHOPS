from pathlib import Path
import sys
import os
from unittest.mock import patch

# Set working directory to project root
os.chdir(Path(__file__).resolve().parents[3] / "AIHOPS" / "AIHOPS")

# Add the directory containing Facade.py to sys.path
facade_dir = Path(__file__).resolve().parents[3] / "AIHOPS" / "AIHOPS" / "Tests" / "AcceptanceTests"
sys.path.insert(0, str(facade_dir))

# Add the project root for Domain import
project_root = Path(__file__).resolve().parents[3] / "AIHOPS" / "AIHOPS"
sys.path.insert(0, str(project_root))

from Domain.src.Server import Server  # Ensure all models are imported
from Service.config import Base, engine
Base.metadata.create_all(engine)      # Create all tables

from Facade import Facade
from Tests.AcceptanceTests.mocks.MockGmailor import MockGmailor

def main():
    email = "testuser_selenium@example.com"
    password = "TestPassword123!"
    print(f"Registering and verifying user: {email}")

    with patch("Domain.src.Users.MemberController.Gmailor", new=MockGmailor):
        facade = Facade()
        try:
            facade.register_and_verify_self(email, password)
            facade.accept_terms(email)
            # facade.login(email, password)
            print(f"User {email} registered and verified successfully.")
        except Exception as e:
            error_message = str(e)
            if "is taken" in error_message or "already exists" in error_message:
                print(f"User {email} already exists. Skipping registration.")
            else:
                print(f"Failed to register/verify user: {e}")


if __name__ == "__main__":
    main() 