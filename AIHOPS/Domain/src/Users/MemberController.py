from threading import RLock

from DAL.DBAccess import DBAccess
from DAL.Objects import DBPendingRequests
from DAL.Objects.DBMember import DBMember
from Domain.src.DS.IdMaker import IdMaker
from Domain.src.Loggs.Response import Response, ResponseFailMsg, ResponseSuccessMsg, ResponseLogin
from Domain.src.Users.Gmailor import Gmailor
from Domain.src.Users.Member import Member
from Domain.src.DS.ThreadSafeDict import ThreadSafeDict


ADMIN = ["admin@admin.com", "admin"]


class MemberController:
    def __init__(self, server, db_access):
        self.members = ThreadSafeDict()     # name: user
        self.gmailor = Gmailor()
        self.register_lock = RLock()
        self.id_maker = IdMaker()
        self.db_access = db_access
        self.get_users_from_db()

    def get_users_from_db(self):
        registered_users = self.db_access.load_all(DBMember)
        if registered_users is None:
            return 1
        last_id = 0
        for member_data in registered_users:
            member = Member(member_data.email, member_data.encrypted_passwd, member_data.id, True, member_data.verified, accepted_tac_version=member_data.accepted_tac_version)
            last_id = max(last_id, member.id + 1)
            self.members.insert(member.email, member)
        self.id_maker.start_from(last_id)

    def register(self, email, passwd, accepted_tac_version=-1):
        # verify username is available
        # add to users
        with self.register_lock:
            member = self.members.get(email)
            if member is not None and member.verified:
                return Response(False, f'username {email} is taken', None, False)

            if member is not None:
                if self.gmailor.is_member_verifiable(email):
                    return Response(False, f'username {email} is taken', None, False)
                else:
                    # delete user
                    res = self.db_access.delete_obj_by_query(DBMember, {"email": email})
                    if not res.success:
                        return res

            uid = self.id_maker.next_id()
            member = Member(email, passwd, uid, accepted_tac_version=accepted_tac_version)
            # insert to db:
            res = self.db_access.insert(DBMember(uid, email, member.encrypted_passwd, accepted_tac_version=accepted_tac_version))
            if not res.success:
                return res
            self.members.insert(email, member)

        self.gmailor.register(email)
        return Response(True, f'new member {email} has been registered', member, False)

    def verify(self, email, passwd, code):
        # verify user exists
        member = self.members.get(email)
        if member is None:
            return Response(False, f'incorrect username or password', None, False)
        # verify correct passwd
        member.verify_passwd(passwd)
        res = self.gmailor.verify(email, code)
        if not res.success:
            return res
        res = self.db_access.update_by_query(DBMember, {"email": email}, {"verified": True})
        if not res.success:
            return res
        member.verify()
        return res

    def verify_automatic(self, token):
        res = self.gmailor.verify_automatic(token)
        email = res.result
        member = self.members.get(email)
        res = self.db_access.update_by_query(DBMember, {"email": email}, {"verified": True})
        if not res.success:
            return res
        member.verify()
        return res

    def _admin_login(self, user, passwd):
        if user == ADMIN[0] and passwd == ADMIN[1]:
            return True

    def login(self, email, encrypted_passwd):
        if self._admin_login(email, encrypted_passwd):
            return ResponseLogin(True, "admin logged in", True)

        # verify user exists
        member = self.members.get(email)
        if member is None:
            return ResponseLogin(False, 'incorrect username or password')
        # verify correct passwd
        res = member.login(email, encrypted_passwd)
        # return user / error
        return ResponseLogin(res.success, res.message, accepted_tac_version=member.accepted_tac_version)

    def isValidMember(self, email):
        member = self.members.get(email)
        if member is None:
            return ResponseFailMsg(f'invalid user: {email}')
        return ResponseSuccessMsg(f'member {email} is valid')
    
    def update_password(self, email, old_passwd, new_passwd):
        with self.register_lock:
            member = self.members.get(email)
            if member is None:
                return ResponseFailMsg(f'invalid user: {email}')
            temp_res = member.update_password(email, old_passwd, new_passwd)
            if(temp_res.success == False):
                return temp_res
            updated_member = Member(email, new_passwd, member.id)
            #update db
            res = self.db_access.update(DBMember(member.id, email, updated_member.encrypted_passwd))
            if not res.success:
                return res
            self.members.insert(email, updated_member)
        return ResponseSuccessMsg(f'password updated for {email}')

    def _verify_valid_member(self, email):
        member = self.members.get(email)
        if member is None:
            raise Exception(f'invalid user: {email}')

    def start_password_recovery(self, email):
        self._verify_valid_member(email)
        self.gmailor.start_password_recovery(email)
        return ResponseSuccessMsg(f'Started password recovery for {email}, you have 5 minutes to make a new password - please check your email')

    def recover_password(self, email, passwd, code):
        self._verify_valid_member(email)
        self.gmailor.recover_password(email, code)
        member = self.members.get(email)
        old_passwd = member.encrypted_passwd
        member.update_password(passwd)
        res = self.db_access.update_by_query(DBMember, {"email": email}, {"encrypted_passwd": member.encrypted_passwd})
        if not res.success:
            member.encrypted_passwd = old_passwd
            return ResponseFailMsg(f'password recovery failed for {email}')
        return ResponseSuccessMsg(f'password recovery for {email} has been successful')
    
    def register_google_user(self, email, passwd, accepted_tac_version=-1):
        """Register a user that authenticated through Google"""
        with self.register_lock:
            member = self.members.get(email)
            if member is not None and member.verified:
                # User already exists and is verified
                if not hasattr(member, 'is_google_user') or not member.is_google_user:
                    member.is_google_user = True
                    # Update database record to mark as Google user
                    res = self.db_access.update_by_query(DBMember, {"email": email}, {"is_google_user": True})
                    if not res.success:
                        return res
                return Response(True, f'User {email} already exists', member, False)

            if member is not None:
                # User exists but is not verified, delete and recreate
                res = self.db_access.delete_obj_by_query(DBMember, {"email": email})
                if not res.success:
                    return res

            uid = self.id_maker.next_id()
            # Create a new member and set is_google_user to True
            member = Member(email, passwd, uid, from_db=False, verified=True, is_google_user=True, accepted_tac_version=accepted_tac_version)
            
            # Insert to db with is_google_user flag set to True
            res = self.db_access.insert(DBMember(uid, email, member.encrypted_passwd, is_verified=True, is_google_user=True, accepted_tac_version=accepted_tac_version))
            if not res.success:
                return res
            
            self.members.insert(email, member)
            
            return Response(True, f'Google user {email} has been registered', member, False)

    def login_with_google(self, email):
        """Login a user that authenticated through Google without password check"""
        member = self.members.get(email)
        if member is None:
            return ResponseLogin(False, f'User {email} not found')
        
        if not member.verified:
            # Update verification status for the Google user
            member.verify()
            member.is_google_user = True
            res = self.db_access.update_by_query(DBMember, {"email": email}, {"verified": True, "is_google_user": True})
            if not res.success:
                return ResponseLogin(res.success, res.msg)
        elif not hasattr(member, 'is_google_user') or not member.is_google_user:
            # Update existing user to mark as Google user
            member.is_google_user = True
            res = self.db_access.update_by_query(DBMember, {"email": email}, {"is_google_user": True})
            if not res.success:
                return ResponseLogin(res.success, res.msg)
        
        # Use the new login_with_google method that bypasses password verification
        return member.login_with_google(email)


    def delete_account(self, email):
        """Delete this member and all their projects."""
        # 1) verify the member exists
        member = self.members.get(email)
        if member is None:
            return ResponseFailMsg(f"invalid user: {email}")

        # 2) perform atomic DB deletion
        res = self.db_access.delete_member_and_projects(email)
        if not res.success:
            return res

        # 3) clean up in-memory state
        self.members.pop(email)
        return ResponseSuccessMsg(f"Member {email} and all their projects have been deleted.")

    def accept_terms(self, actor, version):
        self._verify_valid_member(actor)
        member = self.members.get(actor)
        res = self.db_access.update_by_query(DBMember, {"email": actor}, {"accepted_tac_version": version})
        if not res.success:
            return res
        member.accepted_tac_version = version
        return ResponseSuccessMsg(f'Accepted terms for {actor} version {version}')