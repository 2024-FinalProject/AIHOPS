from Domain.src.IService import IService
from Domain.src.Loggs.Response import ResponseFailMsg, ResponseSuccessMsg, ResponseSuccessObj


class Session:

    def __init__(self, cookie):
        self.cookie = cookie
        self.user_name = "None"
        self.is_member = False
        self.is_admin = False

    def to_json(self):
        str = "Guest"
        if self.user_name != "":
            str = self.user_name
        return {
            "cookie": self.cookie,
            "userName": str
        }

    def is_logged_in(self):
        return self.is_member != ""

    def login(self, user_name):
        self.user_name = user_name
        self.is_member = True
        return ResponseSuccessMsg(f'session updated with {user_name}')

    def logout(self):
        self.is_member = False
        res = ResponseSuccessMsg(f'session updated with {self.user_name}')
        self.user_name = ""
        return res

    def getUserName(self):
        return self.user_name

    def admin_login(self):
        self.user_name = "admin"
        self.is_member = True
        self.is_admin = True
