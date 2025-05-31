
import pytest
from types import SimpleNamespace
from conftest import FakeSuccess, FakeFail

from Domain.src.ProjectModule.Project import Project


class StubVoteManager:
    def __init__(self, pid, db_access):
        self.pid = pid
        self.factors = []
        self.severity_votes = {}
        self.factor_votes = {}
        self.factors_loaded = False

    def get_factors(self):
        return self.factors

    def add_factor(self, factor):
        self.factors.append(factor)

    def remove_factor(self, fid):
        for f in self.factors:
            if f.fid == fid:
                self.factors.remove(f)
                return FakeSuccess()
        return FakeFail("not found")

    def admin_remove_default_factor(self, fid):
        return FakeSuccess()

    def set_factor_vote(self, actor, fid, score):
        self.factor_votes[(actor, fid)] = score
        return FakeSuccess()

    def set_severity_vote(self, actor, votes):
        self.severity_votes[actor] = votes
        return FakeSuccess()

    def get_partially_voted_amount(self):
        return len(self.severity_votes)

    def get_score(self, severities, weights):
        return {"score": 88.5}

    def get_project_factors_votes(self):
        return {"some_factor_id": [1, 2]}

    def get_member_votes(self, actor):
        return self.factor_votes.get(actor, [])

    def insert_factors_loaded_from_db(self, factors): pass
    def load_factor_votes(self): pass
    def load_severity_votes(self): pass
    def has_voted_all_factors(self, actor): return True


class StubDBAccess:
    def __init__(self):
        self.inserted = []
        self.updated = []

    def insert(self, obj):
        self.inserted.append(obj)
        return FakeSuccess()

    def update(self, obj):
        self.updated.append(obj)
        return FakeSuccess()

    def load_by_query(self, model, query):
        return []


class DummyFactor:
    def __init__(self, fid): self.fid = fid
    def to_dict(self): return {"fid": self.fid}


@pytest.fixture
def project(monkeypatch):
    monkeypatch.setattr("Domain.src.ProjectModule.Project.VoteManager", StubVoteManager)
    return Project(pid=1, name="Demo", desc="Test project", owner="owner@example.com", db_access=StubDBAccess())


def test_add_and_confirm_factors(project):
    factor = DummyFactor(fid=101)
    project.add_factor(factor)
    res = project.confirm_factors()
    assert res.success


def test_remove_factor_success_and_fail(project):
    f = DummyFactor(fid=99)
    project.add_factor(f)
    res = project.remove_factor(99)
    assert res.success

    fail = project.remove_factor(999)
    assert not fail.success


def test_confirm_severity_factors(project):
    project.confirm_severity_factors()
    assert project.severity_factors_inited


def test_set_severity_factors_invalid_and_valid(project):
    too_few = project.set_severity_factors([1, 2])
    assert not too_few.success

    descending = project.set_severity_factors([5, 4, 3, 2, 1])
    assert not descending.success

    success = project.set_severity_factors([1, 2, 3, 4, 5])
    assert success.success


def test_update_name_and_description(project):
    project.update_name("UpdatedName")
    project.update_desc("UpdatedDesc")
    assert project.name == "UpdatedName"
    assert project.desc == "UpdatedDesc"


def test_add_and_remove_member(project):
    project.add_member("newguy@example.com")
    assert project.has_member("newguy@example.com")

    res = project.remove_member("newguy@example.com")
    assert res.success


def test_remove_member_from_invite_only(project):
    project.to_invite_when_published.append("invited@example.com")
    res = project.remove_member("invited@example.com")
    assert res.success


def test_vote_on_factor_and_severities(project):
    f = DummyFactor(fid=123)
    project.add_member("voter@example.com")
    project.add_factor(f)

    project.confirm_factors()
    project.confirm_severity_factors()

    vote1 = project.vote_on_factor("voter@example.com", 123, 4)
    assert vote1.success

    invalid = project.vote_severities("voter@example.com", [10, 10, 10])
    assert not invalid.success

    valid = project.vote_severities("voter@example.com", [20, 20, 20, 20, 20])
    assert valid.success


def test_publish_and_archive(project):
    f = DummyFactor(fid=5)
    project.add_factor(f)
    project.confirm_factors()
    project.confirm_severity_factors()

    res = project.publish()
    assert res.success

    archive = project.archive_project()
    assert archive.success


def test_block_action_after_archive(project):
    f = DummyFactor(fid=5)
    project.add_factor(f)
    project.confirm_factors()
    project.confirm_severity_factors()
    project.publish()
    project.archive_project()

    with pytest.raises(Exception):
        project.add_factor(DummyFactor(7))

    with pytest.raises(Exception):
        project.update_name("Blocked")


def test_score_and_progress(project):
    project.confirm_factors()
    project.confirm_severity_factors()

    # Simulate a member vote
    project.vote_manager.set_severity_vote("voter@example.com", [20, 20, 20, 20, 20])

    score = project.get_score(1, {"weight": 1})
    assert score.success

    progress = project.get_progress_for_owner(2)
    assert isinstance(progress, dict)


def test_project_dict_and_eq(project):
    d = project.to_dict()
    assert d["name"] == project.name
    assert d["founder"] == project.owner

    same = Project(1, "Demo", "Test project", "owner@example.com", db_access=StubDBAccess())
    assert project == same


def test_check_voting_status(project):
    project.add_member("actor@example.com")
    assert project.check_factor_voting_status("actor@example.com")
