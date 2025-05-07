import hashlib

from DAL.Objects.DBMember import DBMember
from Domain.src.Loggs.Response import Response, ResponseSuccessObj, ResponseSuccessMsg


class Member:
    def __init__(self, email, passwd, uid, from_db=False, verified=False, is_google_user=False, terms_and_conditions_version=-1):
        self.id = uid
        self.email = email
        if from_db:
            self.encrypted_passwd = passwd
        else:
            self.encrypted_passwd = hashlib.sha256(passwd.encode('utf8')).hexdigest()
        self.logged_in = False
        self.verified = verified
        self.is_google_user = is_google_user
        self.terms_and_conditions_version = terms_and_conditions_version

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
            return Response(False, f'{email} is not verified', None, False)
        if self.email != email:
            return Response(False, 'incorrect credentials', None, False)
        
        self.logged_in = True
        return Response(True, f'user: {email} is now logged in via Google', self, False)

    def logout(self):
        self.logged_in = False
        return Response(True, f'user: {self.email} is logged out', None, False)

    def getUserName(self):
        return ResponseSuccessObj('user name', self.email)

    def to_json(self):
        return {"name": self.email, "is_google_user": self.is_google_user}
    
    def update_password(self, passwd):
        self.encrypted_passwd = hashlib.sha256(passwd.encode('utf8')).hexdigest()

    def accept_terms_and_conditions(self, version, db_access):
        res = db_access.update_by_query(DBMember, {"id": self.id}, {"terms_and_conditions_version": version})
        if not res.success:
            return res
        self.terms_and_conditions_version = version
        return ResponseSuccessMsg(f'{self.email} is now accepted terms and conditions version {version}')
