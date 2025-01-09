import copy

from DAL.Objects.DBPendingRequests import DBPendingRequests
from DAL.Objects.DBProject import DBProject
from DAL.Objects.DBProjectMembers import DBProjectMembers
from DAL.Objects.DBProjectSeverityFactor import DBProjectSeverityFactor
from Domain.src.DS.ThreadSafeList import ThreadSafeList
from Domain.src.DS.VoteManager import VoteManager
from Domain.src.Loggs.Response import ResponseFailMsg, ResponseSuccessMsg, ResponseSuccessObj


class Project:
    def __init__(self, pid, name, desc, owner, db_access=None, is_default_factors=True, db_instance=None):
        self.db_access = db_access
        self.pid = pid
        self.name = name
        self.desc = desc
        self.owner = owner
        self.members = ThreadSafeList()
        self.members.append(owner)
        self.to_invite_when_published = ThreadSafeList()
        self.vote_manager = VoteManager(pid, self.db_access)
        self.factors_inited = False
        self.severity_factors_inited = False
        self.published = False
        self.severity_factors = [1,4,10,25,50]

        if db_instance is None:
            self.db_instance = DBProject(pid, owner, name, desc)
            self.db_access.insert(self.db_instance)
        else:
            self.db_instance = db_instance
            self.load_from_db()


    def confirm_factors(self):
        self.db_instance.factors_confirmed = True
        self.db_access.update(self.db_instance)
        self.factors_inited = True

    def confirm_severity_factors(self):
        self.db_instance.severity_factors_confirmed = True
        self.db_access.update(self.db_instance)
        self.severity_factors_inited = True

    def _set_factors_inited_false(self):
        if self.factors_inited:
            self.db_instance.factors_confirmed = False
            self.db_access.update(self.db_instance)
            self.factors_inited = False

    def _set_severity_factors_inited_false(self):
        if self.severity_factors_inited:
            self.db_instance.severity_factors_confirmed = False
            self.db_access.update(self.db_instance)
            self.severity_factors_inited = False

    def add_factor(self, factor):
        self._set_factors_inited_false()
        self.vote_manager.add_factor(factor)

    def remove_factor(self, fid):
        self._set_factors_inited_false()
        self.vote_manager.remove_factor(fid)
        return ResponseSuccessMsg(f"factor {fid} removed from project {self.pid}")

    def set_severity_factors(self, severity_factors):
        self._set_severity_factors_inited_false()
        if len(severity_factors) != 5:
            return ResponseFailMsg(f"only 5 severity factors")
        for factor in severity_factors:
            if factor < 0:
                return ResponseFailMsg(f"only positive factor")
        instance = DBProjectSeverityFactor(self.pid, *severity_factors)
        res = self.db_access.update(instance)
        if not res.success:
            return res
        self.severity_factors = severity_factors
        return ResponseSuccessMsg(f"severity factors have bee nset for project: {self.pid}")

    def has_factor(self, fid):
        factors = self.vote_manager.get_factors()
        for factor in factors:
            if factor.id == fid:
                return True
        return False

    def update_name(self, name):
        self.db_instance.name = name
        self.db_access.update(self.db_instance)
        self.name = name
        return ResponseSuccessMsg(f"name {self.name} has been updated for project: {self.pid}")

    def update_desc(self, description):
        self.db_instance.description = description
        self.db_access.update(self.db_instance)
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
        try:
            self.members.remove(member)
            return ResponseSuccessMsg(f"member {member} has been removed from project {self.pid}")
        except ValueError:
            res1 = ResponseFailMsg(f"member {member} not in project {self.pid}")
        try:
            self.to_invite_when_published.remove(member)
            return ResponseSuccessMsg(f"member {member} has been from to invite list project {self.pid}")
        except ValueError:
            res2 = ResponseFailMsg(f"member {member} not in to invite for project {self.pid}")
        return ResponseFailMsg(f"member {member} not in to invite nor member of project {self.pid}")

    def is_published(self):
        return self.published

    def get_factors(self, actor):
        self._verify_member(actor)
        return ResponseSuccessObj(f"project factors for {self.pid}", self.vote_manager.get_factors())

    def get_members(self):
        return ResponseSuccessObj(f"project members for {self.pid}", self.members.to_list())

    def get_to_invite(self):
        return ResponseSuccessObj(f"project members for {self.pid}", self.to_invite_when_published.to_list())

    def get_severity_factors(self):
        return ResponseSuccessObj(f"project severity factors for {self.pid}", list(copy.deepcopy(self.severity_factors)))


    def add_member(self, member):
        self.members.append_unique(member)

    def _verify_member(self, actor):
        if not self.members.contains(actor):
            raise ValueError(f"actor {actor} not in project {self.pid}")

    def vote_on_factor(self, actor, fid, score):
        self._verify_member(actor)
        return self.vote_manager.set_factor_vote(actor, fid, score)


    def vote_severities(self, actor, severity_votes):
        self._verify_member(actor)
        sum = 0
        for x in severity_votes:
            sum += x
        if sum != 100:
            return ResponseFailMsg(f"severity votes {sum} not equal to 100")
        return self.vote_manager.set_severity_vote(actor, severity_votes)

    def publish(self):
        if self.published:
            return ResponseFailMsg(f"project {self.pid} has already been published")
        if not self.factors_inited:
            return ResponseFailMsg(f"projects {self.pid} factors has not been initialized")
        if not self.severity_factors_inited:
            return ResponseFailMsg(f"projects {self.pid} severity factors has not been initialized")
        if self.to_invite_when_published.size() == 0:
            return ResponseFailMsg(f"projects {self.pid} members has not been added")
        self.db_instance.published = True
        self.db_access.update(self.db_instance)
        self.published = True
        lst = copy.deepcopy(self.to_invite_when_published.to_list())
        self.to_invite_when_published.clear()
        return ResponseSuccessObj(f"project {self.pid} published", lst)

    def archive_project(self, to_invite):
        if not self.published:
            return ResponseFailMsg(f"project {self.pid} has not been published")
        self.db_instance.published = False
        self.db_access.update(self.db_instance)
        self.published = False
        self.to_invite_when_published.clear()
        for invite in to_invite:
            self.to_invite_when_published.append(invite)
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
            "to_invite": self.to_invite_when_published.to_list() if self.to_invite_when_published else []
        }


    def load_from_db(self):
        self.factors_inited = self.db_instance.factors_confirmed
        self.severity_factors_inited = self.db_instance.severity_factors_confirmed
        self.published = self.db_instance.published
        # load severity factors
        self.load_severity_factors_from_db()
        if self.published:
            # load members if published
            self.load_members()
        else:
            # if not published load to_invite list
            self.load_to_invite()
        # load vote manager data
        res = self.vote_manager.load_factors()
        if not res and self.factors_inited:
            return ResponseFailMsg(f"project {self.pid} factors inited but no factors in db")
        self.vote_manager.load_factor_votes()
        self.vote_manager.load_severity_votes()


    def load_members(self):
        members = self.db_access.load_by_query(DBProjectMembers, {"project_id": self.pid})
        for member in members:
            self.members.append(member.member_email)


    def load_to_invite(self):
        pendings = self.db_access.load_by_query(DBPendingRequests, {"project_id": self.pid})
        for pending in pendings:
            self.to_invite_when_published.append(pending.email)


    def load_severity_factors_from_db(self):
        query_obj = {"project_id": self.pid}
        s_f_data = self.db_access.load_by_query(DBProjectSeverityFactor, query_obj)
        if isinstance(s_f_data, ResponseFailMsg) or not s_f_data:
            self.severity_factors_inited = False
            self.published = False
            return
        s_f_data = s_f_data[0]
        severity_factors = [s_f_data.severity_level1, s_f_data.severity_level2, s_f_data.severity_level3,
                            s_f_data.severity_level4, s_f_data.severity_level5]
        self.severity_factors = severity_factors
