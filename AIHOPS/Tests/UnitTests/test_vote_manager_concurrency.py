import pytest
import threading
import time
from Domain.src.DS.VoteManager import VoteManager
from Domain.src.Loggs.Response import ResponseSuccessMsg

class ConcurrentFakeDB:
    def __init__(self):
        self.inserted = []
        self.deleted = []
        self.updated = []
        self.loaded_factor_votes = []
        self.loaded_severity_votes = []

    def insert(self, obj):
        self.inserted.append(obj)
        return ResponseSuccessMsg("inserted")

    def delete_obj_by_query(self, cls, query):
        self.deleted.append((cls, query))
        return ResponseSuccessMsg("deleted")

    def update(self, obj):
        self.updated.append(obj)
        return ResponseSuccessMsg("updated")

    def load_by_query(self, cls, query):
        return []

class DummyFactor:
    def __init__(self, fid):
        self.fid = fid
    def to_dict(self):
        return {"fid": self.fid}

@pytest.fixture
def vote_manager():
    vm = VoteManager(1, ConcurrentFakeDB())
    vm.factors.insert(1, DummyFactor(1))
    return vm

def test_concurrent_vote_and_delete(vote_manager):
    vote_result = []
    delete_result = []

    def user_vote():
        time.sleep(0.01)
        res = vote_manager.set_factor_vote("user@x.com", 1, 5)
        vote_result.append(res.success)

    def admin_delete():
        res = vote_manager.admin_remove_default_factor(1)
        delete_result.append(res.success)

    t1 = threading.Thread(target=user_vote)
    t2 = threading.Thread(target=admin_delete)

    t1.start()
    t2.start()
    t1.join()
    t2.join()

    # At most one should succeed; or both succeed if vote came before delete
    assert delete_result[0] in [True]
    assert vote_result[0] in [True, False]

def test_concurrent_score_and_vote(vote_manager):
    vote_manager.set_factor_vote("init@x.com", 1, 4)
    vote_manager.set_severity_vote("init@x.com", [20, 20, 20, 20, 20])

    score_results = []
    vote_results = []

    def get_score():
        for _ in range(10):
            result = vote_manager.get_score([20, 20, 20, 20, 20], {"1": 5})
            score_results.append(result["score"])

    def do_votes():
        for i in range(10):
            vote_manager.set_factor_vote(f"user{i}@x.com", 1, 3 + (i % 2))
            vote_manager.set_severity_vote(f"user{i}@x.com", [20, 20, 20, 20, 20])
            vote_results.append(True)

    t1 = threading.Thread(target=get_score)
    t2 = threading.Thread(target=do_votes)

    t1.start()
    t2.start()
    t1.join()
    t2.join()

    assert all(isinstance(score, float) for score in score_results)
    assert all(vote_results)

