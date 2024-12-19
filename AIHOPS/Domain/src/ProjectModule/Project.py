from threading import RLock
from Domain.src.Loggs.Response import Response, ResponseFailMsg, ResponseSuccessObj

class Damage:
    def __init__(self, damage):
        self.damage = damage

class Factor:
    def __init__(self, name, description):
        self.name = name
        self.description = description
        # TODO: need to if we want id 

#TODO:: need to add the db logic and implementation

class Project:
    def __init__(self, id, name, description, founder):
        self.lock = RLock()
        self.id = id
        self.name = name
        self.description = description
        self.founder = founder
        self.factors_inited = False
        self.severity_factors_inited = False
        self.isActive = False  
        # list of project factors
        self.factors = [] 
        # list of severity factors 
        self.severity_factors = []
        # maps a user's vote: user_name to a pair of two lists: (factors_values, severity_factors_values)
        self.members = {}
        self.members[founder] = None


    # factors_values, severity_factors_values are both lists
    def vote(self, user_name, factors_values, severity_factors_values):
        with self.lock:
            if not self.is_initialized_project() or not self.isActive:
                raise Exception("cant vote on not finalized project")
            self.members[user_name] = (factors_values, severity_factors_values)

    # expecting a list of factor objects
    def set_factors(self, factors):
        proj_factors = []
        if not self.factors_inited:
            for factor in factors:
                proj_factors.append(Factor(factor[0], factor[1]))
            self.factors = factors
            self.factors_inited = True
        return proj_factors
        #insert to factors db
        #get the factors id and update the project_factors db

    # expecting a list of 5 floats
    def set_severity_factors(self, severity_factors):
        sever_factors = []
        if not self.severity_factors_inited:
            for level in severity_factors:
                sever_factors.append(Damage(level))
            self.severity_factors = severity_factors
            self.severity_factors_inited = True

    def approved_member(self, user_name):
        if user_name not in self.members.keys():
            self.members[user_name] = None
        else:
           raise Exception(f"user {user_name} is already member of this project")
        
    def remove_member(self, asking, user_name):
        # TODO:: what happens if the website crashes and a member is removed from the project but the project is not yet
        # TODO:: removed from the member -> need to find these inconsistencies in the upload of the site
        if self.founder != asking:
            raise Exception("only the founder can remove members from project")
        mem = self.members.get(user_name)
        if mem is None:
            return ResponseFailMsg(f"user {user_name} is not a member of this project")
        else:
            self.members.pop(user_name)
            return ResponseSuccessObj(f"user {user_name} has been removed from project {self.id}")

    def is_initialized_project(self):
        return self.factors_inited and self.severity_factors_inited
    
    def get_members(self):
        with self.lock:
            return self.members.keys()
        
    def publish_project(self):
        with self.lock:
            self.isActive = True
    
    def hide_project(self):
        with self.lock:
            self.isActive = False