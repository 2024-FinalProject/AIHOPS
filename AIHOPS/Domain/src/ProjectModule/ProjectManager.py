from threading import RLock

from Domain.src.DS.ThreadSafeDictWithListValue import ThreadSafeDictWithListValue
from DAL.DBAccess import DBAccess
from DAL.Objects import DBFactorVotes, DBPendingRequests, DBProject, DBSeverityVotes, DBProjectMembers
from Domain.src.DS.IdMaker import IdMaker
from Domain.src.DS.ThreadSafeDict import ThreadSafeDict

from Domain.src.Loggs.Response import Response, ResponseSuccessMsg, ResponseFailMsg, ResponseSuccessObj
from Domain.src.ProjectModule.Project import Project
from copy import deepcopy as deepCopy


class ProjectManager:
    def __init__(self):
        self.projects = ThreadSafeDict() #project_id -> Project
        self.founder_projects = ThreadSafeDictWithListValue() #founder -> list of projects
        self.pending_requests = ThreadSafeDictWithListValue() # email -> list of projects_id's
        self.id_maker = IdMaker()
        self.db_access = DBAccess()
        #self.get_projects_from_db()
        #self.get_pending_requests_from_db()

    def get_projects_from_db(self):
        existing_projects = self.db_access.load_all(DBProject)
        if existing_projects is None:
            return 1
        last_id = 0
        for project_data in existing_projects:
            project = Project(project_data.id, project_data.name, project_data.description, project_data.founder)
            last_id = max(last_id, project.id + 1)
            self.project[project.id] = deepCopy(project)
            self.founder_projects[project.founder].append(deepCopy(project))
        self.id_maker.start_from(last_id)
    
    def get_pending_requests_from_db(self):
        pending_requests = self.db_access.load_all(DBPendingRequests)
        if pending_requests is None:
            return 1
        for request in pending_requests:
            self.pending_requests[request[1]].append(request[0])


    def create_project(self, name, description, founder):
        if(name == "" or description == ""):
            return ResponseFailMsg("name and description can't be empty")
        
        if(founder == ""):
            return ResponseFailMsg("founder can't be empty")
        
        # self.verify_founder_exists(founder)
        if not self.founder_projects.get(founder):
            self.founder_projects.insert(founder, [])
    
        temp_projects = self.founder_projects.get(founder)
        prj = Project(-999, name, description, founder)
        for project in temp_projects:
            if project == prj and project.isActive:
                return ResponseFailMsg(f"project with {name} already exists and is active for this founder.")
             
        project_id = self.id_maker.next_id()
        prj = Project(project_id, name, description, founder)
        self.projects.insert(project_id, prj)
        self.founder_projects.insert(founder, prj)
        # TODO: insert to DB
        ...
        return Response(True, f"project {name} has been created", project_id, False)

    def set_project_factors(self, project_id, factors):
        if(len(factors) == 0):
            return ResponseFailMsg("factors can't be empty")

        project = self.find_Project(project_id)
        project.set_factors(factors)

        # TODO: insert to DB
        ...
        return ResponseSuccessMsg(f"project {project_id} factors has been set")

    def set_project_severity_factors(self, project_id, severity_factors):
        if(len(severity_factors) == 0):
            return ResponseFailMsg("severity factors can't be empty")
        
        if(len(severity_factors) != 5):
            return ResponseFailMsg("there should be 5 severity factors")
        
        for sf in severity_factors:
            if sf < 0:
                return ResponseFailMsg("severity factor can't be negative")

        project = self.find_Project(project_id)
        project.set_severity_factors(severity_factors)
    
        #TODO: insert to DB
        ...
        return ResponseSuccessMsg(f"project {project_id} severity factors has been set")


    def add_members(self, asking, project_id, users_names):
        existing_members_in_proj = []
        temp_project = self.find_Project(project_id)

        if asking != temp_project.founder:
            return ResponseFailMsg(f"only founder {temp_project.founder} can add members")

        if users_names == []:
            return ResponseFailMsg("users names can't be empty")

        if not temp_project.isActive or not temp_project.is_initialized_project():
            return ResponseFailMsg(f"cant add member to project {project_id} because it is not finalized")
        
        for user_name in users_names:
            # check if user is already pending for this project
            try:
                temp_pending_requests = self.find_pending_requests(user_name)
                if project_id in temp_pending_requests:
                    existing_members_in_proj.append(user_name) 
            except Exception as e:
                    self.pending_requests.insert(user_name, project_id)
                # with self.lock:
                #     self.db_access.insert(DBPendingRequests(project_id, user_name
                #     return ResponseSuccessMsg(f"user {user_name} has invation to {project_id}")

        if(len(existing_members_in_proj) > 0):
            return ResponseFailMsg(f"users waiting for approval to project: {project_id}, except {existing_members_in_proj}")
        return ResponseSuccessMsg(f"users waiting for approval to project :{project_id}")

    def remove_member(self, asking, project_id, user_name):
        temp_project = self.find_Project(project_id)
        if(asking != temp_project.founder):
            return ResponseFailMsg(f"only founder {temp_project.founder} can remove members")
        try: 
            temp_pending_requests = self.find_pending_requests(user_name)
            if project_id in temp_pending_requests:
                self.pending_requests.pop(user_name, project_id)
                # TODO: need to update in DB pending requests table
                return ResponseSuccessMsg(f"user {user_name} has been removed from project {project_id}")
        except Exception as e:
            temp_project.remove_member(asking, user_name)
            # TODO: need to update in DB project members table
            return ResponseSuccessMsg(f"user {user_name} has been removed from project {project_id}")
        

    def get_members_of_project(self, asking, project_id):
        temp_project = self.find_Project(project_id)
        if(asking != temp_project.founder):
            return ResponseFailMsg(f"only founder {temp_project.founder} can get members")
        return ResponseSuccessMsg(f"list of members in project {project_id} : {temp_project.get_members()}")
    
    def get_projects(self, founder):
        try:
            temp_projects = self.find_Projects(founder)
            return ResponseSuccessMsg(f"list of projects for founder {founder} : {temp_projects}")
        except Exception as e:
            return ResponseFailMsg(e)

    def vote(self, project_id, user_name, factors_values, severity_factors_values):
        if(factors_values == [] or severity_factors_values == []):
            return ResponseFailMsg("factors and severity factors can't be empty")
        try:
            temp_project = self.find_Project(project_id)
            severity_amount = 0
            for factor in factors_values:
                if factor < 0 or factor > 4:
                    return ResponseFailMsg("factor needs to be between 0 and 4")
            for severity in severity_factors_values:
                if severity < 0 or severity > 1:
                    return ResponseFailMsg("severity factor needs to be between 0 and 1")
                severity_amount += severity
            if severity_amount != 1:
                return ResponseFailMsg("severity factors sum needs to be excaly 1") 
            temp_project.vote(user_name, factors_values, severity_factors_values)
        except Exception as e:
            return ResponseFailMsg(e)
        # with self.lock:
        #     for factor in factors_values:
        #         self.db_access.insert(DBFactorVotes(factor.id, user_name, project_id, factor.value))
        #     self.db_access.insert(DBSeverityVotes(user_name, project_id, severity_factors_values))
        return ResponseSuccessMsg(f"user {user_name} has voted in project {project_id}")

    def get_project(self, project_id):
        temp_project = self.find_Project(project_id)
        return ResponseSuccessMsg(f"project {temp_project}")

    def publish_project(self, project_id, founder):
        temp_project = self.find_Project(project_id)
        temp_projects = self.find_Projects(founder)
        for project in temp_projects:
            if project == temp_project and project.isActive:
                return ResponseFailMsg(f"project with {temp_project.name} already exists and is active for this founder.")
        temp_project.publish_project()
        # TODO: need to update in DB
        ...
        return ResponseSuccessMsg(f"project {project_id} has been published") 

    def close_project(self, project_id):
        temp_project = self.find_Project(project_id)
        temp_project.hide_project()
          
        # TODO: need to update in DB
        ...
        return ResponseSuccessMsg(f"project {project_id} has been closed") 
  
  
    def get_score(self, requesting_member, pid):
        project = self.find_Project(pid)
        score = project.get_score(requesting_member)
        return ResponseSuccessMsg(f"score of project {pid} is {score}")

    
    def get_pending_requests(self, email):
        try:
            temp_pending_requests = self.find_pending_requests(email) 
            return ResponseSuccessObj(f"pending requests for email {email} : {temp_pending_requests}", temp_pending_requests)
            
        except Exception as e:
            return ResponseSuccessMsg(True, f"no pending requests", {[]})
    
    def approve_member(self, project_id, user_name):
        pending_requests = self.pending_requests.get(user_name)
        self.pending_requests.pop(user_name, project_id)
        project = self.find_Project(project_id)
        if project.isActive:
            project.approved_member(user_name)
            # TODO: need to update in DB
            return ResponseSuccessMsg(f"member {user_name} has been approved in project {project_id}")
        else:
            # TODO: need to update in DB
            ...
            return ResponseFailMsg(f"cant approve member {user_name} in project {project_id} because it is not active")
        
    def reject_member(self, project_id, user_name):
        pending_requests = self.pending_requests.get(user_name)
        if pending_requests.remove(project_id):
            # TODO: need to update in DB
            ...
            return ResponseSuccessMsg(f"member {user_name} has been rejected from project {project_id}")
        return ResponseFailMsg(f"member {user_name} is not pending in project {project_id}")
            
        
    def find_Project (self, project_id):
        prj = self.projects.get(project_id)
        if prj is None or prj == []:
            raise Exception(f"project {project_id} not found")
        return prj

    def find_Projects (self, founder):
        prjs =  self.founder_projects.get(founder)
        if prjs is None or prjs == []:
            raise Exception(f"no projects found for founder {founder}")
        return prjs

    def find_pending_requests(self, email):
        prjs = self.pending_requests.get(email)
        if prjs is None or prjs == []:
            raise Exception(f"no pending requests found for email {email}")
        return prjs

    def verify_founder_exists(self, founder):
        if not self.founder_projects.get(founder):
            raise Exception(f"founder {founder} not found")
        return True