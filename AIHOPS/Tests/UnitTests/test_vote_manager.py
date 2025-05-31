import pytest
from types import SimpleNamespace
from Domain.src.DS.VoteManager import VoteManager
from Domain.src.Loggs.Response import ResponseSuccessMsg, ResponseFailMsg


class FakeDB:
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
        if cls.__name__ == "DBSeverityVotes":
            return self.loaded_severity_votes
        elif cls.__name__ == "DBFactorVotes":
            return self.loaded_factor_votes
        return []


class DummyFactor:
    def __init__(self, fid):
        self.fid = fid
    def to_dict(self):
        return {"fid": self.fid}


class DummyVote:
    def __init__(self, email, fid=None, value=None, s1=10, s2=20, s3=20, s4=25, s5=25):
        self.member_email = email
        self.factor_id = fid
        self.value = value
        self.severity_level1 = s1
        self.severity_level2 = s2
        self.severity_level3 = s3
        self.severity_level4 = s4
        self.severity_level5 = s5


@pytest.fixture
def manager():
    return VoteManager(pid=42, db_access=FakeDB())


def test_add_and_remove_factor(manager):
    factor = DummyFactor(fid=1)
    res_add = manager.add_factor(factor)
    assert res_add.success
    assert manager.factors.get(1) == factor

    res_remove = manager.remove_factor(1)
    assert res_remove.success
    assert manager.factors.get(1) is None


def test_admin_remove_default_factor(manager):
    manager.factors_votes = {"user@example.com": {1: 3, 2: 4}}
    factor = DummyFactor(1)
    manager.factors.insert(1, factor)

    assert 1 in manager.factors_votes["user@example.com"]
    res = manager.admin_remove_default_factor(1)
    assert res.success
    assert 1 not in manager.factors_votes["user@example.com"]
    assert manager.factors.get(1) is None


def test_set_and_override_factor_vote(manager):
    manager.factors.insert(1, DummyFactor(1))
    res = manager.set_factor_vote("u@x.com", 1, 4)
    assert res.success
    assert manager.factors_votes["u@x.com"][1] == 4

    # Override vote
    res = manager.set_factor_vote("u@x.com", 1, 3)
    assert res.success
    assert manager.factors_votes["u@x.com"][1] == 3


def test_set_severity_vote_insert_and_update(manager):
    # Insert case
    res = manager.set_severity_vote("v@x.com", [20, 20, 20, 20, 20])
    assert res.success
    assert manager.severity_votes.get("v@x.com") == [20, 20, 20, 20, 20]

    # Update case
    manager.db_access.loaded_severity_votes = ["existing"]
    res = manager.set_severity_vote("v@x.com", [10, 20, 30, 20, 20])
    assert res.success
    assert manager.severity_votes.get("v@x.com") == [10, 20, 30, 20, 20]


def test_get_fully_and_partially_voted_amount(manager):
    manager.factors.insert(1, DummyFactor(1))
    manager.factors_votes = {"a@x.com": {1: 3}}
    manager.severity_votes.insert("a@x.com", [20, 20, 20, 20, 20])

    full = manager.get_fully_voted_amount()
    part = manager.get_partially_voted_amount()
    assert full == 1
    assert part == 1


def test_get_member_votes(manager):
    manager.factors.insert(1, DummyFactor(1))
    manager.set_factor_vote("x@y.com", 1, 4)
    manager.set_severity_vote("x@y.com", [10, 20, 20, 25, 25])
    res = manager.get_member_votes("x@y.com")
    assert res.success
    assert res.result["factor_votes"] == {1: 4}
    assert res.result["severity_votes"] == [10, 20, 20, 25, 25]


def test_score_calculation(manager):
    f = DummyFactor(1)
    manager.insert_factors_loaded_from_db([f])
    manager.set_factor_vote("v1@x.com", 1, 3)
    manager.set_severity_vote("v1@x.com", [20, 20, 20, 20, 20])
    weights = {"1": 5}

    score = manager.get_score([20, 20, 20, 20, 20], weights)
    assert isinstance(score, dict)
    assert "score" in score
    assert score["score"] >= 0


def test_get_project_factors_votes(manager):
    f = DummyFactor(1)
    manager.insert_factors_loaded_from_db([f])
    manager.set_factor_vote("u@x.com", 1, 3)
    votes = manager.get_project_factors_votes()
    assert 1 in votes
    assert votes[1] == [3]


def test_load_votes_from_db(manager):
    manager.db_access.loaded_factor_votes = [DummyVote("voter@x.com", 1, 4)]
    manager.db_access.loaded_severity_votes = [DummyVote("voter@x.com")]

    manager.factors.insert(1, DummyFactor(1))
    manager.load_factor_votes()
    manager.load_severity_votes()

    assert "voter@x.com" in manager.factors_votes.keys()
    assert "voter@x.com" in manager.severity_votes.getKeys()


def test_clear_votes(manager):
    manager.set_factor_vote("a@x.com", 1, 4)
    manager.set_severity_vote("a@x.com", [10, 20, 30, 20, 20])
    assert manager.factors_votes
    assert manager.severity_votes.size() == 1

    manager.clear_all_votes()
    assert not manager.factors_votes
    assert manager.severity_votes.size() == 0


# 🔵 ADDED: Remove nonexistent factor (lines 27–28, 100–102)
def test_remove_nonexistent_factor(manager):
    res = manager.remove_factor(42)
    assert not res.success

def test_add_factor_insert_failure():
    class FailDB:
        def insert(self, _): return ResponseFailMsg("insert failed")

    manager = VoteManager(pid=1, db_access=FailDB())
    factor = DummyFactor(fid=101)

    res = manager.add_factor(factor)

    assert not res.success
    assert "insert failed" in res.msg.lower()
    assert manager.factors.get(101) is None

def test_set_factor_vote_delete_failure():
    class FailDeleteDB:
        def insert(self, _): return ResponseSuccessMsg("insert ok")
        def delete_obj_by_query(self, cls, query): return ResponseFailMsg("delete failed")

    manager = VoteManager(pid=1, db_access=FailDeleteDB())
    fid = 1
    actor = "test@x.com"

    # Initial vote
    manager.factors.insert(fid, DummyFactor(fid))
    res1 = manager.set_factor_vote(actor, fid, 3)
    assert res1.success
    assert manager.factors_votes[actor][fid] == 3

    # Now try to override vote to force delete failure
    res2 = manager.set_factor_vote(actor, fid, 5)
    assert not res2.success
    assert "delete failed" in res2.msg.lower()
    assert manager.factors_votes[actor][fid] == 3  # Reverted to old vote

from Domain.src.Loggs.Response import ResponseFailMsg

def test_set_factor_vote_insert_failure():
    class FailInsertDB:
        def insert(self, _): return ResponseFailMsg("insert failed")
        def delete_obj_by_query(self, cls, query): return ResponseSuccessMsg("delete ok")

    manager = VoteManager(pid=2, db_access=FailInsertDB())
    fid = 2
    actor = "fail@x.com"

    manager.factors.insert(fid, DummyFactor(fid))

    res = manager.set_factor_vote(actor, fid, 4)
    assert not res.success
    assert "insert failed" in res.msg.lower()
    assert fid not in manager.factors_votes.get(actor, {})  # should not be saved

def test_set_severity_vote_insert_failure():
    class FailInsertDB:
        def load_by_query(self, cls, query): return []  # No existing vote
        def insert(self, instance): return ResponseFailMsg("insert failed")

    manager = VoteManager(pid=99, db_access=FailInsertDB())
    res = manager.set_severity_vote("user@fail.com", [10, 20, 30, 20, 20])

    assert not res.success
    assert "insert failed" in res.msg.lower()

def test_set_severity_vote_insert_exception():
    class ExplodingDB:
        def load_by_query(self, cls, query): return []
        def insert(self, instance): raise RuntimeError("DB exploded")

    manager = VoteManager(pid=100, db_access=ExplodingDB())
    res = manager.set_severity_vote("user@boom.com", [5, 10, 20, 30, 35])

    assert not res.success
    assert "failed to insert" in res.msg.lower()
    assert "db exploded" in res.msg.lower()

def test_set_severity_vote_update_failure():
    class FailUpdateDB:
        def load_by_query(self, cls, query): return ["existing"]
        def update(self, instance): return ResponseFailMsg("update failed")

    manager = VoteManager(pid=10, db_access=FailUpdateDB())
    res = manager.set_severity_vote("update@fail.com", [15, 20, 25, 20, 20])

    assert not res.success
    assert "update failed" in res.msg.lower()

def test_set_severity_vote_update_exception():
    class ExplodingUpdateDB:
        def load_by_query(self, cls, query): return ["existing"]
        def update(self, instance): raise RuntimeError("boom on update")

    manager = VoteManager(pid=11, db_access=ExplodingUpdateDB())
    res = manager.set_severity_vote("boom@update.com", [5, 10, 20, 30, 35])

    assert not res.success
    assert "failed to update" in res.msg.lower()
    assert "boom on update" in res.msg.lower()

def test_get_score_invalid_weights(manager):
    # Add two factors, but pass only one weight
    manager.insert_factors_loaded_from_db([DummyFactor(1), DummyFactor(2)])
    manager.set_factor_vote("voter@x.com", 1, 4)
    manager.set_severity_vote("voter@x.com", [20, 20, 20, 20, 20])

    with pytest.raises(Exception, match="invalid amount of weights"):
        manager.get_score([20, 20, 20, 20, 20], {"1": 5})  # Missing weight for factor 2