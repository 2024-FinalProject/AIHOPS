import secrets
import string
from threading import RLock
from datetime import datetime, timedelta
import yagmail

from Domain.src.DS.ThreadSafeDict import ThreadSafeDict
from Domain.src.Loggs.Response import ResponseSuccessMsg, ResponseFailMsg


class Gmailor:
    TIME_DELTA = timedelta(minutes=5)

    def __init__(self):
        self.codes_users = ThreadSafeDict()
        self.lock = RLock()

    def register(self, email, length=6):
        with self.lock:
            while True:
                characters = string.ascii_letters + string.digits  # A-Z, a-z, 0-9
                code = ''.join(secrets.choice(characters) for _ in range(length))
                if self.codes_users.get(code) is None:
                    time = datetime.now()
                    self.codes_users.insert(code, [email, time])

                    yag = yagmail.SMTP("testsemailaihops@gmail.com", "vljh sdgy syee jizw")
                    yag.send(email, "AIHOPS verification email", f"Hello from AIHOPS!\nverification code: < {code} >")

                    return ResponseSuccessMsg(f"an email with verification code has been sent to {email}, you have 5 minutes to validate your account")

    def verify(self, email, code):
        # need to use lock for the scenario that i will read the correct email but then when i read the time it has been changed by someone else => and thus is valid
        with self.lock:
            info = self.codes_users.get(code)
            if info is None:
                return ResponseFailMsg("invalid code -> try again")
            email = info[0]
            time = info[1]
            if datetime.now() - time > self.TIME_DELTA:
                return ResponseFailMsg("code has expired, register again")

            self.codes_users.pop(code)
            return ResponseSuccessMsg(f"code verified for {email}")

    def is_member_verifiable(self, email):
        for code in self.codes_users.getKeys():
            info = self.codes_users.get(code)
            if info[0] == email and info[1]-datetime.now() < self.TIME_DELTA:
                return True
            if info[0] == email:
                return False
        return False





