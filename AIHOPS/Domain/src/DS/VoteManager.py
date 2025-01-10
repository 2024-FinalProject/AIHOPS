from threading import RLock
import copy

from DAL.Objects.DBFactorVotes import DBFactorVotes
from DAL.Objects.DBFactors import DBFactors
from DAL.Objects.DBProjectFactors import DBProjectFactors
from DAL.Objects.DBSeverityVotes import DBSeverityVotes
from Domain.src.DS.FactorsPool import Factor
from Domain.src.DS.ThreadSafeDict import ThreadSafeDict
from Domain.src.Loggs.Response import ResponseFailMsg, ResponseSuccessMsg


class VoteManager:
    def __init__(self, pid, db_access):
        self.pid = pid
        self.db_access = db_access
        self.factors = ThreadSafeDict()
        self.factors_votes = {}     # {actor: {fid: score}}
        self.severity_votes = ThreadSafeDict()
        self.lock = RLock() # for counting

    def add_factor(self, factor):
        self.factors.insert(factor.fid, factor)
        instance = DBProjectFactors(factor.fid, self.pid)
        res = self.db_access.insert(instance)
        if not res.success:
            self.factors.pop(factor.fid)
            return ResponseFailMsg(res.message)
        return ResponseSuccessMsg(f"factor {factor.fid} added to project {self.pid}")


    def remove_factor(self, fid):
        res = self.db_access.delete_obj_by_query(DBProjectFactors, {"project_id": self.pid, "factor_id": fid})
        if res.success:
            self.factors.pop(fid)
            return ResponseSuccessMsg(f"factor {fid} removed from project {self.pid}")
        return ResponseFailMsg(res.message)

    def set_factor_vote(self, actor, fid, score, persist=True):
        with self.lock:
            member_votes = self.factors_votes.get(actor)
            if member_votes is None:
                member_votes = {}
            member_votes_revert = copy.deepcopy(member_votes)

            cur_vote = member_votes.get(fid)
            member_votes[fid] = score

            if cur_vote is not None:
                to_remove = DBFactorVotes(fid, actor, self.pid, cur_vote)
                res = self.db_access.delete(to_remove)
                if not res.success:
                    self.factors_votes[actor] = member_votes_revert
                    return res
            if persist:
                instance = DBFactorVotes(fid, actor, self.pid, score)
                res = self.db_access.insert(instance)
                if not res.success:
                    self.factors_votes[actor] = member_votes_revert
                    return res
            self.factors_votes[actor] = member_votes
        return ResponseSuccessMsg(f"actor {actor}, voted {fid}: {score} on project {self.pid}")


    def set_severity_vote(self, actor, severity_probs):
        with self.lock:
            self.severity_votes.insert(actor, severity_probs)
            instance = DBSeverityVotes(actor, self.pid, *severity_probs)
            res = self.db_access.insert(instance)
            if not res.success:
                self.severity_votes.pop(actor)
                return res
        return ResponseSuccessMsg(f"actor {actor}, voted on severities {severity_probs}")


    def get_factors(self):
        return list(self.factors.dict.values())

    def get_fully_voted_amount(self):
        count = 0
        with self.lock:
            for actor in self.severity_votes.getKeys():
                if len(self.factors_votes.get(actor, {}).keys()) == self.factors.size():
                    count += 1
        return count

    def get_partially_voted_amount(self):
        voted = set()
        with self.lock:
            for actor in self.severity_votes.getKeys():
                voted.add(actor)
            for actor in self.factors_votes.keys():
                voted.add(actor)
        return len(voted)




    def load_factors(self):
        join_condition = DBProjectFactors.factor_id == DBFactors.id
        factors_data_res = self.db_access.load_by_join_query(DBProjectFactors, DBFactors,
                                                             [DBFactors.name, DBFactors.description, DBFactors.id, DBFactors.owner]
                                                             , join_condition,
                                                             {"project_id": self.pid})
        if not factors_data_res or factors_data_res is None or factors_data_res == []:
            return False
        else:
            for factor_data in factors_data_res:
                self.factors.insert(factor_data.id, Factor(factor_data.id, factor_data.owner, factor_data.name, factor_data.description, factor_data))
            return True

    def load_factor_votes(self):
        query_obj = {"project_id": self.pid}
        votes_data = self.db_access.load_by_query(DBFactorVotes, query_obj)

        if isinstance(votes_data, ResponseFailMsg):
            return votes_data

        for vote in votes_data:
            self.set_factor_vote(vote.member_email, vote.factor_id, vote.value, False)

    def load_severity_votes(self):
        query_obj = {"project_id": self.pid}
        votes_data = self.db_access.load_by_query(DBSeverityVotes, query_obj)
        if isinstance(votes_data, ResponseFailMsg):
            return votes_data

        for vote in votes_data:
            values = [vote.severity_level1, vote.severity_level2, vote.severity_level3, vote.severity_level4, vote.severity_level5]
            self.severity_votes.insert(vote.member_email, values)







