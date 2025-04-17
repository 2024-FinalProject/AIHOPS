from threading import RLock
import copy

from DAL.Objects.DBFactorVotes import DBFactorVotes
from DAL.Objects.DBFactors import DBFactors
from DAL.Objects.DBProjectFactors import DBProjectFactors
from DAL.Objects.DBSeverityVotes import DBSeverityVotes
from Domain.src.DS.FactorsPool import Factor
from Domain.src.DS.ThreadSafeDict import ThreadSafeDict
from Domain.src.Loggs.Response import ResponseFailMsg, ResponseSuccessMsg, ResponseSuccessObj


class VoteManager:
    def __init__(self, pid, db_access):
        self.pid = pid
        self.db_access = db_access
        self.factors = ThreadSafeDict()
        self.factors_votes = {}  # {actor: {fid: score}}
        self.severity_votes = ThreadSafeDict()
        self.lock = RLock()  # for counting

    def add_factor(self, factor):
        self.factors.insert(factor.fid, factor)
        instance = DBProjectFactors(factor.fid, self.pid)
        res = self.db_access.insert(instance)
        if not res.success:
            self.factors.pop(factor.fid)
            return ResponseFailMsg(res.msg)
        return ResponseSuccessMsg(f"factor {factor.fid} added to project {self.pid}")

    def remove_factor(self, fid):
        res = self.db_access.delete_obj_by_query(DBProjectFactors, {"project_id": self.pid, "factor_id": fid})
        if res.success:
            self.factors.pop(fid)
            return ResponseSuccessMsg(f"factor {fid} removed from project {self.pid}")
        return ResponseFailMsg(res.msg)

    def set_factor_vote(self, actor, fid, score, persist=True):
        with self.lock:
            member_votes = self.factors_votes.get(actor)
            if member_votes is None:
                member_votes = {}
            member_votes_revert = copy.deepcopy(member_votes)

            cur_vote = member_votes.get(fid)
            member_votes[fid] = score

            if cur_vote is not None:
                res = self.db_access.delete_obj_by_query(DBFactorVotes, {"project_id": self.pid, "factor_id": fid,
                                                                         "member_email": actor})
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
            # Check if a severity vote already exists for this actor and project
            existing_vote = self.db_access.load_by_query(DBSeverityVotes, {
                "actor": actor,
                "pid": self.pid
            })

            if existing_vote:
                # If a vote exists, update the record
                instance = DBSeverityVotes(actor, self.pid, *severity_probs)
                try:
                    res = self.db_access.update(instance)
                    if not res.success:
                        return res
                except Exception as e:
                    return ResponseFailMsg(f"Failed to update severity vote: {str(e)}")
            else:
                # If no vote exists, insert a new record
                instance = DBSeverityVotes(actor, self.pid, *severity_probs)
                try:
                    res = self.db_access.insert(instance)
                    if not res.success:
                        return res
                except Exception as e:
                    return ResponseFailMsg(f"Failed to insert severity vote: {str(e)}")

            # Insert or update successful, now update in local cache
            self.severity_votes.insert(actor, severity_probs)

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

    def get_member_votes(self, actor):
        factor_votes = copy.deepcopy(self.factors_votes.get(actor, {}))
        severity_votes = list(self.severity_votes.get(actor, []))
        return ResponseSuccessObj(f"fetching votes for {actor}",
                                  {"factor_votes": factor_votes, "severity_votes": severity_votes})

    def _sum_score_by_factor(self):
        factors_res = {}
        for fid in self.factors.getKeys():
            factors_res[fid] = {"vote_count": 0, "score": 0, "avg": 0}

        for assessor, vote_dict in self.factors_votes.items():
            for fid, score in vote_dict.items():
                factors_res[fid]["vote_count"] += 1
                factors_res[fid]["score"] += score
        return factors_res

    def _factors_score_data(self, weights):
        if len(self.factors.getKeys()) != len(weights.keys()):
            raise Exception("invalid amount of weights")

        factors_res = self._sum_score_by_factor()

        # Calculate averages for each factor
        for fid, res in factors_res.items():
            if res["vote_count"] > 0:
                avg = res["score"] / res["vote_count"]
                factors_res[fid] = {"avg": avg, "vote_count": res["vote_count"]}

        N = 0
        Sa_max = 4  # Maximum possible score is always 4 according to documentation

        # Calculate N by summing all assessor scores
        for assessor, vote_dict in self.factors_votes.items():
            if 0 in vote_dict.values():
                Sa = 0  # If any factor is scored 0, the assessor's total score is 0
            else:
                weighted_votes = []
                for fid, vote in vote_dict.items():
                    weighted_votes.append(vote * int(weights[f'{fid}']))
                Sa = sum(weighted_votes) / sum(int(v) for v in weights.values())
            N += Sa

        m = len(self.factors_votes.keys())
        D = Sa_max * m  # D will never be 0 as long as m > 0

        return factors_res, N, D

    def _severity_score_data(self, severity_factors):
        damage_avg = [0, 0, 0, 0, 0]
        d_ass = 0
        for assessor in self.severity_votes.getKeys():
            vote_list = self.severity_votes.get(assessor, [])
            d_ass = 0
            for i in range(5):
                v = vote_list[i] / 100
                damage_avg[i] += v
                d_ass += v * severity_factors[i]
        d = d_ass / len(self.severity_votes.getKeys())
        return d, damage_avg

    def get_score(self, severity_factors, weights):
        for i in range(5):
            severity_factors[i] /= 100
        factors_res, N, D = self._factors_score_data(weights)
        d, damage_avg = self._severity_score_data(severity_factors)

        score = (N / D) ** d

        results = {"score": score,
                   "assessors": [],
                   "factors": factors_res,
                   "severity_damage": {"avg": damage_avg, "vote_count": self.severity_votes.size()},
                   "nominator": N,
                   "denominator": D,
                   "d_score": d
                   }
        return results

    def get_project_factors_votes(self):
        fids = list(self.factors.getKeys())  # Ensure it's a list
        return {
            fid: [scores[fid] for scores in self.factors_votes.values() if fid in scores]
            for fid in fids
        }

    def load_factors(self):
        join_condition = DBProjectFactors.factor_id == DBFactors.id
        factors_data_res = self.db_access.load_by_join_query(
            DBProjectFactors, DBFactors,
            [DBFactors.name, DBFactors.description, DBFactors.id, DBFactors.owner,
             DBFactors.scales_desc_0, DBFactors.scales_desc_1, DBFactors.scales_desc_2, DBFactors.scales_desc_3,
             DBFactors.scales_desc_4,
             DBFactors.scales_explanation_0, DBFactors.scales_explanation_1, DBFactors.scales_explanation_2,
             DBFactors.scales_explanation_3, DBFactors.scales_explanation_4],
            join_condition,
            {"project_id": self.pid}
        )

        if not factors_data_res or factors_data_res is None or factors_data_res == []:
            return False
        else:
            for factor_data in factors_data_res:
                # Create lists for scales_desc and scales_explanation by combining the individual columns
                scales_desc = [factor_data.scales_desc_0, factor_data.scales_desc_1, factor_data.scales_desc_2,
                               factor_data.scales_desc_3, factor_data.scales_desc_4]
                scales_explanation = [factor_data.scales_explanation_0, factor_data.scales_explanation_1,
                                      factor_data.scales_explanation_2, factor_data.scales_explanation_3,
                                      factor_data.scales_explanation_4]

                # Insert the factor with the lists
                self.factors.insert(factor_data.id,
                                    Factor(factor_data.id, factor_data.owner, factor_data.name, factor_data.description,
                                           scales_desc, scales_explanation, factor_data))
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
            values = [vote.severity_level1, vote.severity_level2, vote.severity_level3, vote.severity_level4,
                      vote.severity_level5]
            self.severity_votes.insert(vote.member_email, values)







