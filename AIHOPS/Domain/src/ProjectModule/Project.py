import copy

from Domain.src.DS.ThreadSafeDictWithListPairValue import ThreadSafeDictWithListPairValue
from Domain.src.DS.ThreadSafeDictWithListValue import ThreadSafeDictWithListValue
from Domain.src.DS.ThreadSafeList import ThreadSafeList
from Domain.src.DS.VoteManager import VoteManager
from Domain.src.Loggs.Response import ResponseFailMsg, ResponseSuccessMsg, ResponseSuccessObj


class Project:
    def __init__(self, pid, name, desc, owner, is_default_factors=True):
        self.pid = pid
        self.name = name
        self.desc = desc
        self.owner = owner
        self.members = ThreadSafeList()
        self.members.append(owner)
        self.to_invite_when_published = ThreadSafeList()
        self.vote_manager = VoteManager()
        self.factors_inited = False
        self.severity_factors_inited = False
        self.published = False
        self.severity_factors = [1,4,10,25,50]

    def confirm_factors(self):
        self.factors_inited = True

    def confirm_severity_factors(self):
        self.severity_factors_inited = True

    def add_factor(self, factor):
        self.vote_manager.add_factor(factor)

    def remove_factor(self, fid):
        self.vote_manager.remove_factor(fid)
        return ResponseSuccessMsg(f"factor {fid} removed from project {self.pid}")

    def set_severity_factors(self, severity_factors):
        if len(severity_factors) != 5:
            return ResponseFailMsg(f"only 5 severity factors")
        for factor in severity_factors:
            if factor < 0:
                return ResponseFailMsg(f"only positive factor")
        self.severity_factors = severity_factors
        return ResponseSuccessMsg(f"severity factors have bee nset for project: {self.pid}")

    def has_factor(self, fid):
        factors = self.vote_manager.get_factors()
        for factor in factors:
            if factor.id == fid:
                return True
        return False

    def update_name(self, name):
        self.name = name
        return ResponseSuccessMsg(f"name {self.name} has been updated for project: {self.pid}")

    def update_desc(self, description):
        self.desc = description
        return ResponseSuccessMsg(f"description {self.desc} has been updated for project: {self.pid}")

    def get_progress_for_owner(self):
        invited_members = self.to_invite_when_published.size() > 0
        return {"name": self.name, "desc": self.desc, "factors_amount": len(self.vote_manager.get_factors()),
                "factors_inited": self.factors_inited, "severity_factors_inited": self.severity_factors_inited,
                "invited_members": invited_members}

    def add_member_to_invite(self, member):
        self.to_invite_when_published.append_unique(member)

    def remove_member(self, member):
        if self.published:
            self.members.remove(member)
        else:
            self.to_invite_when_published.remove(member)
        return ResponseSuccessMsg(f"member {member} has been removed from project: {self.pid}")

    def is_published(self):
        return self.published

    def get_factors(self):
        return ResponseSuccessObj(f"project factors for {self.pid}", self.vote_manager.get_factors())

    def get_members(self):
        if self.is_published():
            return ResponseSuccessObj(f"project members for {self.pid}", self.members.to_list())
        else:
            return ResponseSuccessObj(f"project members for {self.pid}", self.to_invite_when_published.to_list())

    def get_severity_factors(self):
        return ResponseSuccessObj(f"project severity factors for {self.pid}", copy.deepcopy(self.severity_factors))


    def add_member(self, member):
        self.members.append_unique(member)

    def _verify_member(self, actor):
        if not self.members.contains(actor):
            raise ValueError(f"actor {actor} not in project {self.pid}")

    def vote_on_factor(self, actor, fid, score):
        self._verify_member(actor)
        self.vote_manager.set_factor_vote(actor, fid, score)
        return ResponseSuccessMsg(f"actor {actor}, voted {fid}: {score} on project {self.pid}")

    def vote_severities(self, actor, severity_votes):
        self._verify_member(actor)
        self.vote_manager.set_severity_vote(actor, severity_votes)
        return ResponseSuccessMsg(f"actor {actor}, voted on severities {severity_votes}")

    def publish(self):
        if self.published:
            return ResponseFailMsg(f"project {self.pid} has already been published")
        if not self.factors_inited:
            return ResponseFailMsg(f"projects {self.pid} factors has not been initialized")
        if not self.severity_factors_inited:
            return ResponseFailMsg(f"projects {self.pid} severity factors has not been initialized")
        if self.to_invite_when_published.size() == 0:
            return ResponseFailMsg(f"projects {self.pid} members has not been added")
        return ResponseSuccessObj(f"project {self.pid} published", self.to_invite_when_published.to_list())

    def archive_project(self):
        if not self.published:
            return ResponseFailMsg(f"project {self.pid} has not been published")
        self.published = False
        return ResponseSuccessMsg(f"project {self.pid} has been archived")

    def get_score(self):
        pass

    def get_voting_progress(self):
        pass

    def __eq__(self, other):
        return (
            isinstance(other, Project)
            and self.name == other.name
            and self.desc == other.desc
            and self.owner == other.owner
        )

    def to_dict(self):
        return {
            "id": self.pid,
            "name": self.name,
            "description": self.desc,
            "founder": self.owner,
            "isActive": self.published,
            "factors": [f.to_dict() if hasattr(f, 'to_dict') else str(f) for f in self.vote_manager.get_factors()],
            "factors_inited": self.factors_inited,
            "severity_factors_inited": self.severity_factors_inited,
            "severity_factors": self.severity_factors if self.severity_factors else [],
            "members": self.members.to_list() if self.members else [],
        }
