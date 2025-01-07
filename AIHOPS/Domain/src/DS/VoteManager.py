from threading import RLock

from Domain.src.DS.ThreadSafeDict import ThreadSafeDict


class VoteManager:
    def __init__(self):
        self.factors = ThreadSafeDict()
        self.factors_votes = {}     # {actor: {fid: score}}
        self.severity_votes = ThreadSafeDict()
        self.lock = RLock() # for counting

    def add_factor(self, factor):
        self.factors.insert(factor.fid, factor)

    def remove_factor(self, fid):
        self.factors.pop(fid)

    def set_factor_vote(self, actor, fid, score):
        with self.lock:
            member_votes = self.factors_votes.get(actor)
            if member_votes is None:
                member_votes = {fid: score}
            else:
                member_votes[fid] = score
            self.factors_votes[actor] = member_votes


    def set_severity_vote(self, actor, fid, severity_probs):
        with self.lock:
            self.severity_votes.insert(actor, fid)

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








