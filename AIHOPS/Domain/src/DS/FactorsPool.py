from threading import RLock
import json


from DAL.DBAccess import DBAccess
from DAL.Objects.DBFactors import DBFactors
from Domain.src.DS.IdMaker import IdMaker
from Domain.src.DS.ThreadSafeDictWithListValue import ThreadSafeDictWithListValue
from Domain.src.Loggs.Response import ResponseSuccessMsg, ResponseFailMsg, ResponseSuccessObj


class Factor:
    def __init__(self, fid, owner,  name, description, scales_desc, scales_explanation, db_instance=None, persist=True):
        self.fid = fid
        self.owner = owner
        self.name = name
        self.description = description
        self.scales_desc = scales_desc
        self.scales_explanation = scales_explanation

        self.db_instance = db_instance
        if db_instance is None and persist:
            self.db_instance = DBFactors(name, description, fid, owner, scales_desc, scales_explanation)

    #TODO: Will need to change this to update the scales as well
    def update(self, name, desc, db_access):
        self.db_instance.name = name
        self.db_instance.description = desc
        res = db_access.insert(self.db_instance)
        if not res.success:
            return ResponseFailMsg(f"failed to update factor: {self.name}, {self.description}, {self.fid}: {res.msg}")
        self.name = name
        self.description = desc
        return ResponseSuccessMsg(f"factor {self.fid} updated successfully with: {self.name}, {self.description}")

    def update_new(self, name, desc, scales_desc, scales_explanation, db_access):
        self.name = name
        self.description = desc
        self.scales_desc = scales_desc
        self.scales_explanation = scales_explanation
        update_fields = {
            "name": self.name,
            "description": self.description,
        }

        for i in range(5):
            update_fields[f"scales_desc_{i}"] = self.scales_desc[i]
            update_fields[f"scales_explanation_{i}"] = self.scales_explanation[i]

        res = db_access.update_by_query(DBFactors, {"id": self.fid}, update_fields)
        if not res.success:
            raise Exception(f"failed to update factor: {self.name}, {self.description}, {self.fid}: {res.msg}")
        return res

    def to_dict(self):
        return {
            "owner": self.owner,
            "id": self.fid,
            "name": self.name,
            "description": self.description,
            "scales_desc": self.scales_desc,
            "scales_explanation": self.scales_explanation
        }

    def __str__(self):
        return f"owner: {self.owner}, Factor id: {self.fid}, Factor Name: {self.name}, Factor Description: {self.description}"



# DEFAULT_FACTORS = [
#     Factor(-1, "DEFAULT", "Innovation Availability", "The readiness of the innovation for integration into healthcare settings.",
#            ["Theoretically Impossible", "Unproven Concept", "Proven Concept", "Available with Modifications", "Immediately Implementable"],
#            ["The innovation is not feasible based on current understanding.",
#             "The innovation is possible, but the concept is unproven.",
#             "The concept is proven, but the innovation is not fullydeveloped or tested.",
#             "The innovation exists but requires some modifications before use.",
#             "The innovation is available, tested, and ready for integration."]),
#
#     Factor(-2, "DEFAULT", "Organizational Attention", "The level of organizational focus on the matter the innovation is meant to improve.",
#            ["Ignored", "Marginal Interest", "Noted", "High Priority", "Critical Metric"],
#            ["Not recognized or tracked within the organization", "Seldom considered; minimally tracked.",
#             "Recognized but not a priority; infrequently tracked.", "Important to operations; monitored regularly.",
#             "Core to the organization’s operations; closely monitored."]),
#
#     Factor(-3, "DEFAULT", "Implementation Timeline Likelihood", "The proximity of the anticipated implementation date, reflecting the organization’s readiness and planning for adopting the innovation.",
#            ["Indeterminate Implementation", "Long-Term Implementation", "Medium-Term Implementation", "Short-Term Implementation", " Immediate Implementation"],
#            ["No specific implementation date planned; uncertain if or when it will be adopted.",
#             "Planned for more than 3 years from now.", "Planned within 1 to 3 years", "Planned within the next 12 months.",
#             "Ready to implement now."]),
#
#     Factor(-4, "DEFAULT", "Stakeholder Support", "The level of support or resistance among key stakeholders toward the innovation,including cultural alignment.",
#            ["Active Opposition", "Minimal Support with Major Resistance", "Mixed Support", "General Support with Minor Reservations",
#             "Strong Support and Cultural Alignment"],
#             ["Critical stakeholders oppose the innovation; conflicts with core cultural values make adoption unacceptable.",
#              "Few stakeholders support; substantial resistance or cultural misalignment present.",
#              "Stakeholder opinions are divided; significant effort needed to build consensus or address cultural resistance.",
#              "Most stakeholders are supportive; minor concernsor cultural adjustments needed.",
#              "Widespread enthusiasm; stakeholders are eager for adoption, and the innovation fully aligns with cultural values and practices."]),
#
#     Factor(-5, "DEFAULT", "Financial Feasibility", "Evaluation of the net financial impact of adopting the innovation, considering both costs and expected returns.",
#            ["Significant Net Financial Loss", "Net Financial Loss", "Break-Even or Marginal Net Benefit", "Moderate Net Financial Benefit",
#             "High Net Financial Benefit"],
#             ["Costs greatly exceed financial returns; net loss makes adoption financially infeasible.",
#              "Costs exceed financial returns; a net loss is expected but may be acceptable due to other benefits.",
#              "Financial returns roughly equal costs; minimal net profit or loss.",
#              "Financial returns exceed costs; positive net profit expected.",
#              "The innovation offers significant financial returns greatly exceeding costs; strong positive net profit expected."]),
#
#     Factor(-6, "DEFAULT", "Training Requirements", "The amount of training required for staff to effectively use the innovation.",
#            ["Unrealistic Training Demands", "Extensive Training Needed", "Moderate Training Required", "Minimal Training Needed", "No Training Required"],
#            ["Training required is so extensive it’s unattainable or impractical for the organization.",
#             "Significant training efforts required; may strain resources.",
#             "A moderate amount of training is needed; achievable with current resources.",
#             "Brief orientation or simple training sessions are sufficient; easily manageable.",
#             "Staff can use the innovation immediately without additional training."]
#            ),
#
#     Factor(-7, "DEFAULT", "Workflow Impact", "The extent to which the innovation will affect existing workflows, focusing on both positive and negative impacts on efficiency and processes.",
#            ["Unfeasible Workflow Overhaul Required", "Significant Workflow Changes", "No Change to Workflow", "Minor Workflow Adjustments", "Workflow Significantly Improved"],
#            ["Adoption requires a complete redesign of workflows that is impractical for the organization.",
#             "Major changes needed; extensive adjustments may strain resources",
#             "Existing workflows remain unaffected; no disruption.",
#             "Some adjustments required; manageable changes to existing workflows that are beneficial.",
#             "The innovation greatly enhances workflow efficiency; processes become faster, simpler, or more effective."]),
#
#     Factor(-8, "DEFAULT", "Regulatory and Ethical Compliance", "The extent to which the innovation meets regulatory requirements and ethical standards necessary for adoption.",
#            ["Non-Compliant or Ethically Unacceptable", "Major Compliance or Ethical Barriers",
#             "Moderate Compliance or Ethical Challenges", "Minor Compliance or Ethical Issues", "Fully Compliant and Ethically Sound"],
#            ["Cannot meet regulatory requirements or ethical standards; adoption is prohibited.",
#             "Serious concerns make approval unlikely without substantial changes.",
#             "Significant effort required to address issues; achievable with dedicated resources.",
#             "Small adjustments needed; approvals are likely to be granted.",
#             "Meets all regulatory requirements and ethical standards; no additional approvals needed."]),
# ]
#
# DEFAULT_FACTORS_IDS = [-1,-2,-3,-4,-5,-6,-7, -8]

def save_default_factors_to_file(default_factors, filename= 'Domain/src/DS/factors.txt'):
    data_to_save = []
    for factor in default_factors:
        data_to_save.append({
            "fid": factor.fid,
            "owner": factor.owner,
            "name": factor.name,
            "description": factor.description,
            "scales_desc": factor.scales_desc,
            "scales_explanation": factor.scales_explanation,
        })

    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data_to_save, f, ensure_ascii=False, indent=2)


def load_default_factors_from_file(filename= 'Domain/src/DS/factors.txt'):
    with open(filename, 'r', encoding='utf-8') as f:
        data_loaded = json.load(f)

    factors = []
    for item in data_loaded:
        factor = Factor(
            fid=item['fid'],
            owner=item['owner'],
            name=item['name'],
            description=item['description'],
            scales_desc=item['scales_desc'],
            scales_explanation=item['scales_explanation']
        )
        factors.append(factor)

    return factors

DEFAULT_FACTORS = load_default_factors_from_file()
DEFAULT_FACTORS_IDS = [factor.fid for factor in DEFAULT_FACTORS]

# DEFAULT_FACTORS = []
# DEFAULT_FACTORS_IDS = [factor.fid for factor in DEFAULT_FACTORS]
def insert_defaults():
    for factor in DEFAULT_FACTORS:
        DBAccess().insert(DBFactors(factor.name, factor.description, factor.fid, factor.owner, factor.scales_desc, factor.scales_explanation))

class FactorsPool:
    def __init__(self, db_access):
        # TODO: change to dict values in members -> for efficiency in _find_factor
        self.members = ThreadSafeDictWithListValue() # {email: factors}
        self.id_maker = IdMaker()
        self.db_access = db_access
        self.load_all_factors()
        self.lock = RLock()

    def get_default_factor_ids(self):
        return DEFAULT_FACTORS_IDS

    def _check_id_dup_factor(self, actor, factor_name, factor_description):
        factors_of_member = self.members.get(actor) + DEFAULT_FACTORS
        for factor in factors_of_member:
            if factor.name == factor_name and factor.description == factor_description:
                raise NameError(f"factor name {factor_name} already exists")

    def find_factors(self, actor, fids):
        with self.lock:
            if isinstance(fids, int):
                fids = {fids}
                return_single = True
            else:
                return_single = False

            # Build lookup dicts
            default_map = {f.fid: f for f in DEFAULT_FACTORS}
            member_factors = self.members.get(actor)
            member_map = {f.fid: f for f in member_factors}

            results = []

            for fid in fids:
                if fid in default_map:
                    results.append(default_map[fid])
                elif fid in member_map:
                    results.append(member_map[fid])
                else:
                    raise KeyError(f"factor {fid} not found")

            return results[0] if return_single else results

    def add_factor(self, actor, factor_name, factor_desc, scales_desc, scales_explanation):
        self._check_id_dup_factor(actor, factor_name, factor_desc)
        new_id = self.id_maker.next_id()
        new_factor = Factor(new_id, actor, factor_name, factor_desc, scales_desc, scales_explanation)
        self.db_access.insert(new_factor.db_instance)
        self.members.insert(actor, new_factor)
        return new_factor

    def remove_factor(self, actor, fid):
        factor = self.find_factors(actor, fid)
        self.db_access.delete(factor.db_instance)
        self.members.pop(actor, factor)
        return ResponseSuccessMsg(f"factor {fid} removed from {actor}")

    def get_factors(self, actor):
        return self.members.get(actor) + DEFAULT_FACTORS

    def load_all_factors(self):
        top_id = 0
        factors_data = self.db_access.load_all(DBFactors)
        for factor in factors_data:
            if factor.id >= 0:
                owner = factor.owner
                name = factor.name
                description = factor.description
                fid = factor.id
                scales_desc = [factor.scales_desc_0, factor.scales_desc_1, factor.scales_desc_2, factor.scales_desc_3, factor.scales_desc_4]
                scales_explanation = [factor.scales_explanation_0, factor.scales_explanation_1, factor.scales_explanation_2, factor.scales_explanation_3, factor.scales_explanation_4]
                self.members.insert(owner, Factor(fid, owner, name, description, scales_desc, scales_explanation, factor))
                top_id = max(top_id, fid)
        self.id_maker.start_from(top_id + 1)

    def admin_change_default_factor(self, fid, name, desc, scales_desc, scales_explanation):
        """change will persist in all projects in design and also published projects"""
        with self.lock:
            # update it in file and local list
            for idx, factor in enumerate(DEFAULT_FACTORS):
                if factor.fid == fid:
                    # update in db
                    res = DEFAULT_FACTORS[idx].update_new(name, desc, scales_desc, scales_explanation, self.db_access)
                    if not res.success:
                        raise Exception(f"failed to update factor in db: {res.msg}")
                    # update in txt
                    save_default_factors_to_file(DEFAULT_FACTORS)
                    return ResponseSuccessMsg(f"Default factor {fid} updated successfully.")
            # update it in
            raise KeyError(f"Default factor with id {fid} not found")

    def admin_add_default_factor(self, name, desc, scales_desc, scales_explanation):
        """factor wont be added automatically to any project"""
        with self.lock:
            fid = min(DEFAULT_FACTORS_IDS) - 1
            factor = Factor(fid, "DEFAULT",name, desc, scales_desc, scales_explanation)
            DEFAULT_FACTORS.append(factor)
            DEFAULT_FACTORS_IDS.append(fid)
            res = self.db_access.insert(factor.db_instance)
            if not res.success:
                raise Exception(f"failed to insert new factor to db: {res.msg}")
            save_default_factors_to_file(DEFAULT_FACTORS)
            return ResponseSuccessMsg(f"Default factor {fid} added successfully.")

    def admin_remove_default_factor(self, fid):
        """change will persist in all projects in design and also published projects"""
        with self.lock:
            for idx, factor in enumerate(DEFAULT_FACTORS):
                if factor.fid == fid:
                    res = self.db_access.delete_obj_by_query(DBFactors, {"id": factor.fid})
                    if not res.success:
                        raise Exception(f"failed to delete factor {fid} from db: {res.msg}")
                    del DEFAULT_FACTORS[idx]
                    DEFAULT_FACTORS_IDS.remove(fid)
                    save_default_factors_to_file(DEFAULT_FACTORS)
                    return ResponseSuccessMsg(f"Default factor {fid} removed successfully.")
            raise KeyError(f"Default factor with id {fid} not found")

    def get_default_factors(self):
        return [factor.to_dict() for factor in DEFAULT_FACTORS]

# if __name__ == '__main__':
#     save_default_factors_to_file(DEFAULT_FACTORS, "factors.txt")