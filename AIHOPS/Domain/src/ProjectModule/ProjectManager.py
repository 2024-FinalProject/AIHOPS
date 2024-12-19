from threading import RLock

from DAL.DBAccess import DBAccess
from DAL.Objects import DBFactorVotes, DBSeverityVotes, DBProjectMembers
from Domain.src.DS.IdMaker import IdMaker
from Domain.src.Loggs.Response import Response, ResponseFailMsg


class ProjectManager:
    def __init__(self):
        self.project = {}
        self.id_maker = IdMaker()
        self.user_project_dict = {}
        self.db_access = DBAccess()
        self.lock = RLock()

    def create_project(self):
        ...

    def set_project_factors(self):
        ...

    def set_project_severity_factors(self):
        ...

    def add_member(self, project_id, user_name):
        #TODO:: Need to check if a user exists in the site (registerd) - ?
        self.project[project_id].add_members(user_name)
        with self.lock:
            self.user_project_dict[user_name] = project_id
            self.db_access.insert(DBProjectMembers(user_name, project_id))
        ...

    def remove_member(self):
        ...

    def get_member_projects(self, project_id):
        self.project[project_id].get_members()

    def vote(self, project_id, user_name, factors_values, severity_factors_values):
        # not safe access to project
        self.project[project_id].vote(user_name, factors_values, severity_factors_values)
        with self.lock:
            for factor in factors_values:
                self.db_access.insert(DBFactorVotes(factor.id, user_name, project_id, factor.value))
            self.db_access.insert(DBSeverityVotes(user_name, project_id, severity_factors_values))

    def get_project(self, project_id):
        with self.lock:
            return self.project[project_id]
        ...

    def close_project(self, project_id):
        with self.lock:
            self.project[project_id].isActive = False

    def get_score(self, requesting_member, pid):
        with self.lock:
            project = self.project.get(pid)
        if project is None:
            return ResponseFailMsg("invalid project id")
        return project.get_score(requesting_member)
        



