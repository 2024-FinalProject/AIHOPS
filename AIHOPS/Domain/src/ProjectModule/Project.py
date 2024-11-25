from datetime import datetime
from threading import RLock
from DAL.Objects import DBProject
from DAL.Conns.ProjectMember import ProjectMember
from DAL.DBAccess import DBAccess
from Domain.src.DS.IdMaker import IdMaker
from Domain.src.Loggs.Response import ResponseFailMsg, ResponseSuccessMsg, ResponseSuccessObj
from Domain.src.ProjectModule.IBinder import IBinder

class Org(IBinder):

    def __init__(self, name, founder, oid, **kwargs):
        super().__init__("org", name, founder, oid)

        # Basic fields with defaults
        self.description = kwargs.get('description') or "No description provided"
        self.date_created = datetime.now().strftime("%Y-%m-%d")
        self.is_active = True
        self.db_access = DBAccess()
        self.db_access.insert(ProjectMember(name, founder))
        self.load_project_members_from_db() 


    def load_project_members_from_db(self):
        res = self.db_access.load_project_members(self.name)
        if res.result is not None:
            self.members = res.result

    def addMember(self, requesting, to_add):
        res = super().addMember(requesting, to_add)
        if res.success:
            conn = ProjectMember(self.name, to_add)
            db_res = self.db_access.insert(conn)
            if not db_res.success:
                super().removeMember(requesting, to_add)
                return db_res
        return res
    
    def removeMember(self, requesting, to_remove):
        res = super().removeMember(requesting, to_remove)
        if res.success:
            db_res = self.db_access.delete_obj_by_query(ProjectMember, {'project_name': self.name, 'user_name': to_remove})
            if not db_res.success:
                super().removeMember(requesting, to_remove)
                return db_res
        return res