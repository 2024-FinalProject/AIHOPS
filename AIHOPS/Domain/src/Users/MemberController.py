from threading import RLock

from DAL.DBAccess import DBAccess
from DAL.Objects import DBPendingRequests
from DAL.Objects.DBMember import DBMember
from Domain.src.DS.IdMaker import IdMaker
from Domain.src.Loggs.Response import Response, ResponseFailMsg, ResponseSuccessMsg
from Domain.src.Users.Gmailor import Gmailor
from Domain.src.Users.Member import Member
from Domain.src.DS.ThreadSafeDict import ThreadSafeDict


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
            member = Member(member_data.email, member_data.encrypted_passwd, member_data.id, True)
            last_id = max(last_id, member.id + 1)
            self.members.insert(member.email, member)
        self.id_maker.start_from(last_id)

    def register(self, email, passwd):
        # verify username is available
        # add to users
        with self.register_lock:
            if self.members.get(email) is not None:
                return Response(False, f'username {email} is taken', None, False)
            uid = self.id_maker.next_id()
            member = Member(email, passwd, uid)
            # insert to db:
            res = self.db_access.insert(DBMember(uid, email, member.encrypted_passwd))
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
        member.verify()
        return res

    def login(self, email, encrypted_passwd):
        # verify user exists
        member = self.members.get(email)
        if member is None:
            return Response(False, f'incorrect username or password', None, False)
        # verify correct passwd
        res = member.login(email, encrypted_passwd)
        # return user / error
        return res

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
        

    

