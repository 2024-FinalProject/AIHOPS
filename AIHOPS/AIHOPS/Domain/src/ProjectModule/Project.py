class Damage:
    def __init__(self, damage):
        ...

class Factor:
    def __init__(self, name, description):
        self.name = name
        self.description = description



class Project:
    def __init__(self, pid, name, description, founder):
        self.name = name
        self.description = description
        self.founder = founder
        self.pid = pid
        self.factors_inited = False
        self.severity_factors_inited = False
        self.members = {}
        self.add_member(founder)


    def vote(self):
        if not self.factors_inited or not self.severity_factors_inited:
            raise Exception("cant vote on not finalized project")
        # vote

    # expecting a list of factor objects
    def set_factors(self, factors):
        self.factors = factors
        self.factors_inited = True

    # expecting a list of 5 floats
    def set_severity_factors(self, severity_factors):
        self.severity_factors = severity_factors
        self.severity_factors_inited = True

    def add_member(self, user_name):
        if user_name not in self.members.keys():
            self.members[user_name] = False


    def remove_member(self, asking, user_name):
        # what happens if the website crashes and a member is removed from the project but the project is not yet
        # removed from the member -> need to find these inconsistencies in the upload of the site
        if self.founder != asking:
            raise Exception("only the founder can remove members from project")
        mem = self.members.get(user_name)
        if mem is None:
            raise Exception(f"member {user_name} is not a member of this project")
        self.members.pop(user_name)