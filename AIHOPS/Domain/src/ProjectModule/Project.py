from threading import RLock
from Domain.src.Loggs.Response import Response, ResponseFailMsg, ResponseSuccessObj

class Damage:
    def __init__(self, damage):
        self.damage = damage

class Factor:
    def __init__(self, name, description):
        self.name = name
        self.description = description

#TODO:: need to add the db logic and implementation

class Project:
    def __init__(self, name, description, founder):
        self.lock = RLock()
        self.name = name
        self.description = description
        self.founder = founder
        self.factors_inited = False
        self.severity_factors_inited = False
        # map user_name to a pair of two lists: (factors_values, severity_factors_values)
        self.members = {}
        self.members[founder] = None


    def vote(self, user_name, factors_values, severity_factors_values):
        with self.lock:
            if not self.is_initialized_project():
                raise Exception("cant vote on not finalized project")
            self.members[user_name] = (factors_values, severity_factors_values)

    # expecting a list of factor objects
    def set_factors(self, factors):
        if not self.factors_inited:
            self.factors = factors
            self.factors_inited = True
        #insert to factors db
        #get the factors id and update the project_factors db

    # expecting a list of 5 floats
    def set_severity_factors(self, severity_factors):
        self.severity_factors = severity_factors
        self.severity_factors_inited = True

    #user_names is a list of users
    def add_members(self, user_names):
        #TODO:: Need to check if a user exists in the site (registerd) - ?
        existent_members = []
        if not self.is_initialized_project():
            raise Exception("cant add member on not finalized project")
        for user_name in user_names:
            if user_name not in self.members.keys():
                self.members[user_name] = None
            else:
                existent_members.append(user_name)
        if(len(existent_members) > 0):
            raise Exception(f"users {existent_members} are already members of this project")

    #user_names is a list of users
    def remove_members(self, asking, user_names):
        # TODO:: what happens if the website crashes and a member is removed from the project but the project is not yet
        # TODO:: removed from the member -> need to find these inconsistencies in the upload of the site
        non_existent_members = []
        if self.founder != asking:
            raise Exception("only the founder can remove members from project")
        for user_name in user_names:
            mem = self.members.get(user_name)
            if mem is None:
                non_existent_members.append(user_name)
            else:
                self.members.pop(user_name)
        if(len(non_existent_members) > 0):
            raise Exception(f"users {non_existent_members} are not members of this project")

    def is_initialized_project(self):
        return self.factors_inited and self.severity_factors_inited