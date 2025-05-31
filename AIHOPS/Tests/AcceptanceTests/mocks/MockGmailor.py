"""
Mock implementation of Gmailor for testing - Simple version that always works
"""

from Domain.src.Loggs.Response import (
    ResponseSuccessMsg,
    ResponseFailMsg,
    ResponseSuccessObj,
)


class MockGmailor:
    """Simplified mock that always succeeds for testing"""

    def __init__(self):
        pass

    def register(self, email, length=6):
        """Mock registration - always succeeds"""
        return ResponseSuccessMsg(f"Mock registration for {email}")

    def verify(self, email, code):
        """Mock verification - always succeeds with any code"""
        return ResponseSuccessMsg(f"Mock verification for {email}")

    def verify_automatic(self, code):
        """Mock automatic verification - always succeeds"""
        return ResponseSuccessObj("Mock auto verification", "test@example.com")

    def is_member_verifiable(self, email):
        """Always return True for testing"""
        return True

    def send_email_invitation(self, email, inviting_member, project_name):
        """Mock email invitation"""
        return ResponseSuccessMsg("Mock invitation sent")

    def start_password_recovery(self, email, length=6):
        """Mock password recovery start"""
        pass

    def recover_password(self, email, code):
        """Mock password recovery"""
        pass
