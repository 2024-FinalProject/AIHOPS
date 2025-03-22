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
        self.verified = False

    def verify(self):
        self.verified = True

    def verify_passwd(self, passwd):
        if self.encrypted_passwd != hashlib.sha256(passwd.encode('utf8')).hexdigest():
            raise Exception('incorrect credentials')


    def login(self, email, passwd):
        if not self.verified:
            return Response(False, f'{email} is not verified', None, False)
        if self.email != email:
            return Response(False, 'incorrect credentials', None, False)
        self.verify_passwd(passwd)
        self.logged_in = True
        return Response(True, f'user: {email} is now logged in', self, False)

    def logout(self):
        self.logged_in = False
        return Response(True, f'user: {self.email} is logged out', None, False)

    def getUserName(self):
        return ResponseSuccessObj('user name', self.email)

    def to_json(self):
        return {"name": self.email}
    
    def update_password(self, email, old_passwd, new_passwd):
        if self.email != email:
            return Response(False, 'incorrect credentials', None, False)
        if self.encrypted_passwd != hashlib.sha256(old_passwd.encode('utf8')).hexdigest():
            return Response(False, 'incorrect credentials', None, False)
        return Response(True, f'password for {email} has been updated', None, False)
