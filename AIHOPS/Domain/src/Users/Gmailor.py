import secrets
import string
from threading import RLock
from datetime import datetime, timedelta
import yagmail

from Domain.src.DS.ThreadSafeDict import ThreadSafeDict
from Domain.src.Loggs.Response import ResponseSuccessMsg, ResponseFailMsg, ResponseSuccessObj


class Gmailor:
    TIME_DELTA = timedelta(minutes=5)

    def __init__(self):
        self.codes_users = ThreadSafeDict()
        self.password_recovery = ThreadSafeDict()
        self.lock = RLock()
        self.local = 'http://localhost:5173/'
        self.public = 'https://aihops.cs.bgu.ac.il/'

    def register(self, email, length=6):
        with self.lock:
            while True:
                characters = string.ascii_letters + string.digits  # A-Z, a-z, 0-9
                code = ''.join(secrets.choice(characters) for _ in range(length))
                if self.codes_users.get(code) is None:
                    time = datetime.now()
                    self.codes_users.insert(code, [email, time])

                    yag = yagmail.SMTP("testsemailaihops@gmail.com", "vljh sdgy syee jizw")
                    yag.send(email, "AIHOPS verification email",
                             f"Hello from AIHOPS!\nPlease click here to verify your account: {self.local}verifyautomatic?token={code}\nOnce you've verified it, you can login to your account.\n\nBest regards,\nAIHOPS Team")

                    return ResponseSuccessMsg(
                        f"an email with verification code has been sent to {email}, you have 5 minutes to validate your account")

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

    def verify_automatic(self, code):
        with self.lock:
            info = self.codes_users.get(code)
            if info is None:
                raise Exception("invalid code -> try again")
            email = info[0]
            time = info[1]
            if datetime.now() - time > self.TIME_DELTA:
                raise Exception("code has expired, register again")

            self.codes_users.pop(code)
            return ResponseSuccessObj(f"code verified for {email}", email)

    def is_member_verifiable(self, email):
        for code in self.codes_users.getKeys():
            info = self.codes_users.get(code)
            if info[0] == email and abs(info[1]-datetime.now()) < self.TIME_DELTA:
                return True
            if info[0] == email:
                return False
        return False

    def send_email_invitation(self, email, inviting_member, project_name):
        yag = yagmail.SMTP("testsemailaihops@gmail.com", "vljh sdgy syee jizw")
        yag.send(email, "AIHOPS Project Invitation",
                 f"Hello from AIHOPS!\n"
                 f"{inviting_member[0:inviting_member.find('@')]} have invited you to participate in a new Project: {project_name}\n"
                 f"To join the project create an account at: {self.local}register\n"
                 f"If you already have an account at AIHOPS: {self.local}login\n"
                 f".\n\nBest regards,\nAIHOPS Team")


    def start_password_recovery(self, email, length=6):
        if self.password_recovery.get(email) is not None:
            time = self.password_recovery.get(email)[1]
            if datetime.now() - time <= self.TIME_DELTA:
                raise Exception("your recovery time has not expired, check your email")

        characters = string.ascii_letters + string.digits  # A-Z, a-z, 0-9
        code = ''.join(secrets.choice(characters) for _ in range(length))

        self.password_recovery.insert(email, (code, datetime.now()))

        yag = yagmail.SMTP("testsemailaihops@gmail.com", "vljh sdgy syee jizw")
        yag.send(email, "AIHOPS Password Recovery",
                 f"Hello from AIHOPS!\n"
                 f"To recover you password, please click here:\n{self.local}passwordrecovery?token={code}\n"
                 f".\n\nBest regards,\nAIHOPS Team")

    def recover_password(self, email, code):
        info = self.password_recovery.get(email)
        if info is None:
            raise Exception("Please use password recovery, located in the log-in page.")
        saved_code = info[0]
        time = info[1]
        if code != saved_code:
            raise Exception("invalid code")
        if datetime.now() - time > self.TIME_DELTA:
            raise Exception("code has expired")
        self.password_recovery.pop(email)

