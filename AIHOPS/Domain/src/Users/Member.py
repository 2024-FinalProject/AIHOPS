import hashlib

from Domain.src.Loggs.Response import Response, ResponseSuccessObj


class Member:
    def __init__(self, email, passwd, uid, from_db=False):
        self.id = uid
        self.email = email
        if from_db:
            self.encrypted_passwd = passwd
        else:
            self.encrypted_passwd = hashlib.sha256(passwd.encode('utf8')).hexdigest()
        self.logged_in = False

    def login(self, email, passwd):
        if self.email != email:
            return Response(False, 'incorrect credentials', None, False)
        if self.encrypted_passwd != hashlib.sha256(passwd.encode('utf8')).hexdigest():
            return Response(False, 'incorrect credentials', None, False)
        self.logged_in = True
        return Response(True, f'user: {email} is now logged in', self, False)

    def logout(self):
        self.logged_in = False
        return Response(True, f'user: {self.email} is logged out', None, False)

    def getUserName(self):
        return ResponseSuccessObj('user name', self.email)

    def to_json(self):
        return {"name": self.email}
