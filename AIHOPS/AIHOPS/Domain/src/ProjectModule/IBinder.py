from threading import RLock
from Domain.src.Loggs.Response import ResponseFailMsg, ResponseSuccessMsg, ResponseSuccessObj


class IBinder:
    def __init__(self, binder_name, name, founder, oid):
        self.binder_name = binder_name
        self.founder = founder
        self.name = name
        self.members = [founder]
        self.managers = [founder]
        self.lock = RLock()
        self.id = oid

    def addMember(self, requesting_user, to_add):
        if requesting_user not in self.managers:
            return ResponseFailMsg(f'user: {requesting_user} is not manager of {self.binder_name} {self.name}')
        with self.lock:
            if to_add in self.members:
                return ResponseFailMsg(f'user: {to_add} is already a member of {self.binder_name} {self.name}')
            self.members.append(to_add)
            return ResponseSuccessMsg(f'user {to_add} is now a member of {self.binder_name} {self.name}')

    def removeMember(self, requesting_user, to_remove):
        if requesting_user not in self.managers:
            return ResponseFailMsg(f'user: {requesting_user} is not manager of {self.binder_name} {self.name}')
        with self.lock:
            if to_remove not in self.members:
                return ResponseFailMsg(f'user: {to_remove} is not a member of {self.binder_name} {self.name}')
            self.members.remove(to_remove)
            return ResponseSuccessMsg(f'user {to_remove} has been removed from {self.binder_name} {self.name}')
        
    # TODO: maybe needs to be different for groups and orgs
    def get_members(self, requesting_user):
        if requesting_user not in self.managers:
            return ResponseFailMsg(f'user: {requesting_user} is not member of {self.binder_name} {self.name}')
        return ResponseSuccessObj(f"user: {requesting_user} recieving members list of {self.binder_name} {self.name}", self.members)

        
    def is_member(self, user_name):
        if user_name in self.managers:
            return ResponseSuccessMsg(f"member {user_name} is member of {self.binder_name}: {self.name}")
        return ResponseSuccessMsg(f"member {user_name} is not member of {self.binder_name}: {self.name}")

    def is_manager(self, user_name):
        if user_name in self.managers:
            return ResponseSuccessMsg(f"member {user_name} is manager of {self.binder_name}: {self.name}")
        return ResponseSuccessMsg(f"member {user_name} is not manager of {self.binder_name}: {self.name}")