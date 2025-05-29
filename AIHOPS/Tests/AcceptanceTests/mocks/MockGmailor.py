"""
Mock implementation of Gmailor for testing
"""

from Domain.src.Loggs.Response import (
    ResponseSuccessMsg,
    ResponseFailMsg,
    ResponseSuccessObj,
)
from threading import RLock
from datetime import datetime, timedelta


class MockGmailor:
    """Mock email service that always succeeds for testing purposes"""

    def __init__(self):
        self.codes_users = {}
        self.password_recovery = {}
        self.lock = RLock()
        self.TIME_DELTA = timedelta(minutes=5)
        print("🔧 MockGmailor initialized")

    def register(self, email, length=6):
        """Mock registration - always succeeds and uses '1234' as verification code"""
        with self.lock:
            # Always use '1234' as the mock verification code
            code = "1234"
            time = datetime.now()
            self.codes_users[code] = [email, time]
            print(f"🔧 MockGmailor: Registered {email} with code {code}")
            return ResponseSuccessMsg(
                f"Mock email sent to {email} with verification code"
            )

    def verify(self, email, code):
        """Mock verification - succeeds if code is '1234'"""
        with self.lock:
            if code == "1234" or code in self.codes_users:
                if code in self.codes_users:
                    info = self.codes_users[code]
                    stored_email = info[0]
                    time = info[1]

                    # Check if code has expired
                    if datetime.now() - time > self.TIME_DELTA:
                        return ResponseFailMsg("Code has expired, register again")

                    # Remove the used code
                    del self.codes_users[code]
                    print(f"🔧 MockGmailor: Verified {stored_email} with code {code}")
                    return ResponseSuccessMsg(f"Code verified for {stored_email}")
                else:
                    # For the default '1234' code
                    print(f"🔧 MockGmailor: Verified {email} with default code")
                    return ResponseSuccessMsg(f"Code verified for {email}")
            else:
                print(f"🔧 MockGmailor: Invalid code {code} for {email}")
                return ResponseFailMsg("Invalid code -> try again")

    def verify_automatic(self, code):
        """Mock automatic verification"""
        with self.lock:
            if code in self.codes_users:
                info = self.codes_users[code]
                email = info[0]
                time = info[1]

                if datetime.now() - time > self.TIME_DELTA:
                    raise Exception("Code has expired, register again")

                del self.codes_users[code]
                print(f"🔧 MockGmailor: Automatically verified {email}")
                return ResponseSuccessObj(f"Code verified for {email}", email)
            else:
                print(f"🔧 MockGmailor: Invalid code {code} for automatic verification")
                raise Exception("Invalid code -> try again")
