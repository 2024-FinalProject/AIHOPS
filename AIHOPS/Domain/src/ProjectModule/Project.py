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
        self.isActive = False
        self.severity_factors = []
        self.factors = []
        # maps a user_name to a pair of two lists: (factors_values, severity_factors_values)
        self.members = {founder: None}

    def vote(self, user_name, factors_values, severity_factors_values):
        with self.lock:
            if not self.is_initialized_project() or not self.isActive:
                raise Exception("cant vote on not finalized project")
            self.members[user_name] = (factors_values, severity_factors_values)

    # expecting a list of factor objects
    def set_factors(self, factors):
        if not self.factors_inited:
            self.factors = factors
            self.factors_inited = True
        #insert to factors db
        #get the factors id and update the project_factors db

    # expecting a list of 5 floats (non negatives)
    def set_severity_factors(self, severity_factors):
        for sf in severity_factors:
            if sf < 0:
                raise Exception("negative severity factor")
        self.severity_factors = severity_factors
        self.severity_factors_inited = True

    #user_names is a list of users
    def add_members(self, user_names):
        #TODO:: Need to check if a user exists in the site (registerd) - ?
        existent_members = []
        if not self.is_initialized_project() or not self.isActive:
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
    
    def get_members(self):
        with self.lock:
            return self.members.keys()
        
    def publish_project(self):
        with self.lock:
            self.isActive = True
    
    def hide_project(self):
        with self.lock:
            self.isActive = False

    def get_score(self, requesting_member):
        if self.founder != requesting_member:
            raise Exception("only the founder can get a score")
        # check if someone voted, if not return error
        if self.isActive:
            raise Exception("cant get score on active project")
        # calc
        d_assessors = self.get_d_assessors()
        s_assessors = self.get_s_assessors()
        m = len(self.members)
        N = sum(s_assessors)
        S_max = 4
        D = S_max * m
        d = sum(d_assessors) / m

        return (N/D)**d

    def get_s_assessors(self):
        s_assessors = []
        n = len(self.factors)
        for _, (factor_votes, _) in self.members.items():
            ass_total = 0
            for ass in factor_votes:
                ass_total += ass
            s_assessors.append(ass_total / n)
        return s_assessors

    def get_d_assessors(self):
        d_assessors = []
        for _, (_, severity_probs) in self.members.items():
            # calc d_assessor
            d_ass = 0
            for i in range(len(self.severity_factors)):
                d_ass += self.severity_factors[i] * severity_probs[i]
                d_assessors.append(d_ass)
        return d_assessors














