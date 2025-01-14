from threading import RLock

from DAL.Objects.DBFactors import DBFactors
from Domain.src.DS.IdMaker import IdMaker
from Domain.src.DS.ThreadSafeDictWithListValue import ThreadSafeDictWithListValue
from Domain.src.Loggs.Response import ResponseSuccessMsg, ResponseFailMsg, ResponseSuccessObj


class Factor:
    def __init__(self, fid, owner,  name, description, db_instance=None, persist=True):
        self.fid = fid
        self.owner = owner
        self.name = name
        self.description = description

        self.db_instance = db_instance
        if db_instance is None and persist:
            self.db_instance = DBFactors(name, description, fid, owner)

    def update(self, name, desc, db_access):
        self.db_instance.name = name
        self.db_instance.description = desc
        res = db_access.insert(self.db_instance)
        if not res.success:
            return ResponseFailMsg(f"failed to update factor: {self.name}, {self.description}, {self.fid}: {res.msg}")
        self.name = name
        self.description = desc
        return ResponseSuccessMsg(f"factor {self.fid} updated successfully with: {self.name}, {self.description}")

    def to_dict(self):
        return {
            "owner": self.owner,
            "id": self.fid,
            "name": self.name,
            "description": self.description
        }

    def __str__(self):
        return f"owner: {self.owner}, Factor id: {self.fid}, Factor Name: {self.name}, Factor Description: {self.description}"



DEFAULT_FACTORS = {
    Factor(-1, "DEFAULT", "Tech Availability", "The readiness of technology for integration into healthcare settings."),
    Factor(-2, "DEFAULT", "Organizational Attention", "The level of organizational focus and monitoring of the technology."),
    Factor(-3, "DEFAULT", "Urgency of Need", "The immediate and future necessity for the technology in healthcare operations."),
    Factor(-4, "DEFAULT", "Cultural Alignment", "The compatibility of the technology with the cultural values and practices of the organization and its stakeholders."),
    Factor(-5, "DEFAULT", "Cost Assessment", "Evaluation of the financial implications and justifiability of the technology investment."),
    Factor(-6, "DEFAULT", "Workflow Disruption", "The impact of the technology on existing workflows and processes."),
    Factor(-7, "DEFAULT", "Ethical Feasibility", "The ethical considerations and approval requirements associated with the technology’s implementation."),
}

class FactorsPool:
    def __init__(self, db_access):
        # TODO: change to dict values in members -> for efficiency in _find_factor
        self.members = ThreadSafeDictWithListValue() # {email: factors}
        self.id_maker = IdMaker()
        self.db_access = db_access
        self.load_all_factors()
        self.lock = RLock()

    def _check_id_dup_factor(self, actor, factor_name, factor_description):
        factors_of_member = self.members.get(actor)
        for factor in factors_of_member:
            if factor.name == factor_name and factor.description == factor_description:
                raise NameError(f"factor name {factor_name} already exists")

    def _find_factor(self, actor, fid):
        with self.lock:
            factors_of_member = self.members.get(actor)
            for factor in factors_of_member:
                if factor.fid == fid:
                    return factor
        raise KeyError(f"factor {fid} not found")

    def update_factor(self, actor, fid, factor_name, factor_desc):
        factor = self._find_factor(actor, fid)
        res = factor.update(factor_name, factor_desc, self.db_access)
        if res.success:
            return ResponseSuccessObj(res.msg, factor)
        return res


    def add_factor(self, actor, factor_name, factor_desc):
        self._check_id_dup_factor(actor, factor_name, factor_desc)
        new_id = self.id_maker.next_id()
        new_factor = Factor(new_id, actor, factor_name, factor_desc)
        self.db_access.insert(new_factor.db_instance)
        self.members.insert(actor, new_factor)
        return new_factor

    def remove_factor(self, actor, fid):
        factor = self._find_factor(actor, fid)
        self.db_access.delete(factor.db_instance)
        self.members.pop(actor, factor)
        return ResponseSuccessMsg(f"factor {fid} removed from {actor}")

    def get_factors(self, actor):
        return self.members.get(actor)

    def load_all_factors(self):
        top_id = 0
        factors_data = self.db_access.load_all(DBFactors)
        for factor in factors_data:
            owner = factor.owner
            name = factor.name
            description = factor.description
            fid = factor.id
            self.members.insert(owner, Factor(fid, owner, name, description, factor))
            top_id = max(top_id, fid)
        self.id_maker.start_from(top_id + 1)