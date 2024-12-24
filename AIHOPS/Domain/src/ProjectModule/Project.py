from threading import RLock
from Domain.src.Loggs.Response import Response, ResponseFailMsg, ResponseSuccessMsg, ResponseSuccessObj
from Domain.src.DS.ThreadSafeList import ThreadSafeList
from Domain.src.DS.ThreadSafeDictWithListPairValue import ThreadSafeDictWithListPairValue

class Damage:
    def __init__(self, damage):
        self.damage = damage

class Factor:
    def __init__(self, name, description):
        self.name = name
        self.description = description

# TODO: need to add the DB logic and implementation

class Project:
    def __init__(self, id, name, description, founder, commit=False):
        self.lock = RLock()
        self.id = id
        self.name = name
        self.description = description
        self.founder = founder
        self.factors_inited = False
        self.severity_factors_inited = False

        self.isActive = False  
        self.factors = ThreadSafeList()  # Thread-safe list of project factors
        self.severity_factors = ThreadSafeList()  # Thread-safe list of severity factors
        self.members = ThreadSafeDictWithListPairValue()  # Maps user_name to (factors_values, severity_factors_values)
        self.members.insert(founder, None)

    # factors_values and severity_factors_values are both lists
    def vote(self, user_name, factors_values, severity_factors_values):
        with self.lock:
            if not self.is_initialized_project() or not self.isActive:
                raise Exception("Can't vote on an unfinalized project")
            if len(factors_values) != self.factors.size() or len(severity_factors_values) != self.severity_factors.size():
                raise Exception("Invalid vote - count mismatch with factors or severity factors")
            self.members.insert(user_name, (factors_values, severity_factors_values))

    # Expecting a list of factor objects
    def set_factors(self, factors):
        with self.lock:
            if not self.factors_inited:
                for factor in factors:
                    self.factors.append(Factor(factor[0], factor[1]))
                self.factors_inited = True

    # Expecting a list of 5 non-negative floats
    def set_severity_factors(self, severity_factors):
        with self.lock:
            for sf in severity_factors:
                if sf < 0:
                    raise Exception("Negative severity factor not allowed")
            if not self.severity_factors_inited:
                for level in severity_factors:
                    self.severity_factors.append(Damage(level))
                self.severity_factors_inited = True

    def approved_member(self, user_name):
        with self.lock:
            if not self.members.get(user_name):
                self.members.insert(user_name, None)
            else:
                raise Exception(f"User {user_name} is already a member of this project")
        
    def remove_member(self, asking, user_name):
        if self.founder != asking:
            raise Exception("Only the founder can remove members from the project")
        with self.lock:
            if user_name not in self.get_members():
                raise Exception(f"User {user_name} is not a member of this project")
            self.members.pop(user_name)
        return ResponseSuccessMsg(f"User {user_name} has been removed from project {self.id}")

    def is_initialized_project(self):
        return self.factors_inited and self.severity_factors_inited
    
    def get_members(self):
        with self.lock:
            return self.members.getKeys()
        
    def publish_project(self):
        if not self.is_initialized_project():
            raise Exception("Can't publish project without initializing factors and severity factors")
        if self.isActive:
            raise Exception("Project has already been published")
        with self.lock:
            self.isActive = True
    
    def hide_project(self):
        if not self.isActive:
            raise Exception("Project is not published; can't hide it")
        with self.lock:
            self.isActive = False

    def get_score(self, requesting_member):
        if self.founder != requesting_member:
            raise Exception("Only the founder can get a score")
        if self.isActive:
            raise Exception("Can't get score on an active project")

        d_assessors = self.get_d_assessors()
        s_assessors = self.get_s_assessors()
        m = self.members.size()
        N = sum(s_assessors)
        S_max = 4
        D = S_max * m
        d = sum(d_assessors) / m

        return (N / D) ** d

    def get_s_assessors(self):
        s_assessors = []
        n = self.factors.size()
        for _, (factor_votes, _) in self.members.getItems():
            ass_total = sum(factor_votes)
            s_assessors.append(ass_total / n)
        return s_assessors

    def get_d_assessors(self):
        d_assessors = []
        for _, (_, severity_probs) in self.members.getItems():
            d_ass = sum(self.severity_factors.get(i).damage * severity_probs[i] for i in range(self.severity_factors.size()))
            d_assessors.append(d_ass)
        return d_assessors

    def __eq__(self, other):
        return (
            isinstance(other, Project)
            and self.name == other.name
            and self.description == other.description
            and self.founder == other.founder
        )
