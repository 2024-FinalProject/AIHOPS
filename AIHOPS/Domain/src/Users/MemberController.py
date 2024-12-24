from threading import RLock

from DAL.DBAccess import DBAccess
from DAL.Objects import DBPendingRequests
from DAL.Objects.DBMember import DBMember
from Domain.src.DS.IdMaker import IdMaker
from Domain.src.Loggs.Response import Response, ResponseFailMsg, ResponseSuccessMsg
from Domain.src.Users.Member import Member
from Domain.src.DS.ThreadSafeDict import ThreadSafeDict


class MemberController:
    def __init__(self, server):
        self.members = ThreadSafeDict()     # name: user
        self.register_lock = RLock()
        self.id_maker = IdMaker()
        self.db_access = DBAccess()
        self.get_users_from_db()

    def get_users_from_db(self):
        registered_users = self.db_access.load_all(DBMember)
        if registered_users is None:
            return 1
        last_id = 0
        for member_data in registered_users:
            member = Member(member_data.name, member_data.encrypted_passwd, member_data.id, True)
            last_id = max(last_id, member.id + 1)
            self.members.insert(member.name, member)
        self.id_maker.start_from(last_id)

    def register(self, name, passwd):
        # verify username is available
        # add to users
        with self.register_lock:
            if self.members.get(name) is not None:
                return Response(False, f'username {name} is taken', None, False)
            uid = self.id_maker.next_id()
            member = Member(name, passwd, uid)
            # insert to db:
            res = self.db_access.insert(DBMember(member.name, member.encrypted_passwd, member.id))
            if not res.success:
                return res
            self.members.insert(name, member)
        return Response(True, f'new member {name} has been registered', member, False)

    def login(self, name, encrypted_passwd):
        # verify user exists
        member = self.members.get(name)
        if member is None:
            return Response(False, f'incorrect username or password', None, False)
        # verify correct passwd
        res = member.login(name, encrypted_passwd)
        # return user / error
        return res

    def isValidMember(self, name):
        member = self.members.get(name)
        if member is None:
            return ResponseFailMsg(f'invalid user: {name}')
        return ResponseSuccessMsg(f'member {name} is valid')

    

