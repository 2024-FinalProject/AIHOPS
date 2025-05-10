import hashlib

from Domain.src.Loggs.Response import Response, ResponseSuccessObj, ResponseLogin


class Member:
    def __init__(self, email, passwd, uid, from_db=False, verified=False, is_google_user=False, accepted_tac_version=-1):
        self.id = uid
        self.email = email
        if from_db:
            self.encrypted_passwd = passwd
        else:
            self.encrypted_passwd = hashlib.sha256(passwd.encode('utf8')).hexdigest()
        self.logged_in = False
        self.verified = verified
        self.is_google_user = is_google_user
        self.accepted_tac_version = accepted_tac_version

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
    
    def login_with_google(self, email):
        """Login without password verification for Google-authenticated users"""
        if not self.verified:
            return ResponseLogin(False, f'{email} is not verified')
        if self.email != email:
            return ResponseLogin(False, 'incorrect credentials')
        
        self.logged_in = True
        return ResponseLogin(True, f'user: {email} is now logged in via Google', accepted_tac_version=self.accepted_tac_version)

    def logout(self):
        self.logged_in = False
        return Response(True, f'user: {self.email} is logged out', None, False)

    def getUserName(self):
        return ResponseSuccessObj('user name', self.email)

    def to_json(self):
        return {"name": self.email, "is_google_user": self.is_google_user}
    
    def update_password(self, passwd):
        self.encrypted_passwd = hashlib.sha256(passwd.encode('utf8')).hexdigest()