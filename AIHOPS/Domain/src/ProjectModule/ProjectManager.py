from threading import RLock

from DAL.DBAccess import DBAccess
from DAL.Objects import DBFactorVotes, DBPendingRequests, DBProject, DBSeverityVotes, DBProjectMembers
from Domain.src.DS.IdMaker import IdMaker

from Domain.src.Loggs.Response import Response, ResponseSuccessMsg, ResponseFailMsg
from Domain.src.ProjectModule.Project import Project
from copy import deepcopy as deepCopy


class ProjectManager:
    def __init__(self):
        self.projects = {} #project_id -> Project
        self.founder_projects = {} #founder -> list of projects
        self.pending_requests = {} # email -> list[projects_id ]
        self.id_maker = IdMaker()
        self.user_project_dict = {}
        # self.db_access = DBAccess()
        # self.get_projects_from_db()
        # self.get_pending_requests_from_db()

    # def get_projects_from_db(self):
    #     existing_projects = self.db_access.load_all(DBProject)
    #     if existing_projects is None:
    #         return 1
    #     last_id = 0
    #     for project_data in existing_projects:
    #         project = Project(project_data.id, project_data.name, project_data.description, project_data.founder)
    #         last_id = max(last_id, project.id + 1)
    #         self.project[project.id] = deepCopy(project)
    #         self.founder_projects[project.founder].append(deepCopy(project))
    #     self.id_maker.start_from(last_id)
    
    # def get_pending_requests_from_db(self):
    #     pending_requests = self.db_access.load_all(DBPendingRequests)
    #     if pending_requests is None:
    #         return 1
    #     for request in pending_requests:
    #         self.pending_requests[request[1]].append(request[0])


    def create_project(self, name, description, founder):
        if(founder not in self.founder_projects.keys()):
            self.founder_projects[founder] = []
        
        for project in self.founder_projects[founder]:
            if(project.name == name and project.description == description and project.founder == founder and project.isActive):
                return ResponseFailMsg(f"a project wth {name} already exists and is active")
            
        project_id = self.id_maker.next_id()
        prj = Project(project_id, name, description, founder)
        self.projects[project_id].append(prj)
        self.founder_projects[founder].append(prj)
        # TODO: insert to DB
        ...
        return ResponseSuccessMsg(f"project {name} has been created")

    def set_project_factors(self, project_id, factors):
        with self.lock:
            proj_factors = self.get_project(project_id).set_factors(factors)

        # TODO: insert to DB
        ...
        return ResponseSuccessMsg(f"project {project_id} factors has been set")

    def set_project_severity_factors(self, project_id, severity_factors):
        with self.lock:
            proj_severity_factors = self.get_project(project_id).set_severity_factors(severity_factors)
    
        #TODO: insert to DB
        ...
        return ResponseSuccessMsg(f"project {project_id} severity factors has been set")
    



    def add_member(self, project_id, users_names):
        existing_members_in_proj = []
        if not self.projects[project_id].isActive or not self.projects[project_id].is_initialized_project():
            return ResponseFailMsg(f"cant add member to project {project_id} because it is not finalized")
        for user_name in users_names:
            # check if user is already pending for this project
            if self.pending_requests[user_name].contains(project_id):
                existing_members_in_proj.append(user_name)
            else:
                self.pending_requests[user_name].append(project_id)
                # with self.lock:
                #     self.db_access.insert(DBPendingRequests(project_id, user_name
                #     return ResponseSuccessMsg(f"user {user_name} has invation to {project_id}")

        return ResponseFailMsg(f"users waiting for approval to project {project_id} except {existing_members_in_proj}") if len(existing_members_in_proj) > 0 else ResponseSuccessMsg(f"users waiting for approval to project :{project_id}")

    def remove_member(self, asking, project_id, user_name):
        if self.pending_requests[user_name].contains(project_id):
            self.pending_requests[user_name].remove(project_id)
            # TODO: need to update in DB pending requests table
            return ResponseSuccessMsg(f"user {user_name} has been removed from project {project_id}")
        else:
            self.projects[project_id].remove_member(asking, user_name)
            # TODO: need to update in DB project members table
            return ResponseSuccessMsg(f"user {user_name} has been removed from project {project_id}")
        

        

    def get_member_projects(self, project_id):
        
        if self.projects[project_id].get_members() is not None:
            return ResponseSuccessMsg(f"list of members in project {project_id} : {self.projects[project_id].get_members()}")
        return ResponseFailMsg(f"no members in project {project_id}")


    def vote(self, project_id, user_name, factors_values, severity_factors_values):
        try:
            self.projects[project_id].vote(user_name, factors_values, severity_factors_values)
        except Exception as e:
            return ResponseFailMsg(e)
        # with self.lock:
        #     for factor in factors_values:
        #         self.db_access.insert(DBFactorVotes(factor.id, user_name, project_id, factor.value))
        #     self.db_access.insert(DBSeverityVotes(user_name, project_id, severity_factors_values))
        return ResponseSuccessMsg(f"user {user_name} has voted in project {project_id}")

    def get_project(self, project_id):
        with self.lock:
            if self.projects[project_id]:
                return ResponseSuccessMsg(f"project {self.projects[project_id]}")
            return ResponseFailMsg(f"project {project_id} not found")

    def close_project(self, project_id):
        with self.lock:
            self.project[project_id].isActive = False
        if self.projects[project_id]:
            self.projects[project_id].isActive = False
        else:
            return ResponseFailMsg(f"project {project_id} not found")
          
        # TODO: need to update in DB
        ...
        return ResponseSuccessMsg(f"project {project_id} has been closed") 
  
  
    def get_score(self, requesting_member, pid):
        with self.lock:
            project = self.project.get(pid)
        if project is None:
            return ResponseFailMsg("invalid project id")
        return project.get_score(requesting_member)

    
    def get_pending_requests(self, email):
        if self.pending_requests[email] is not None:
            return ResponseSuccessMsg(f"list of pending request {self.pending_requests[email]}")
        return ResponseSuccessMsg(f"no pending request {[]}")
    
    def approve_member(self, project_id, user_name):
        self.pending_requests[user_name].remove(project_id)
        if self.projects[project_id].isActive:
            self.projects[project_id].approved_member(user_name)
            # TODO: need to update in DB
            return ResponseSuccessMsg(f"member {user_name} has been approved in project {project_id}")
        else:
            # TODO: need to update in DB
            ...
            return ResponseFailMsg(f"cant approve member {user_name} in project {project_id} because it is not active")
        
    def reject_member(self, project_id, user_name):
        if self.pending_requests[user_name].remove(project_id):
            # TODO: need to update in DB
            ...
            return ResponseSuccessMsg(f"member {user_name} has been rejected from project {project_id}")
        return ResponseFailMsg(f"member {user_name} is not pending in project {project_id}")
            
        



