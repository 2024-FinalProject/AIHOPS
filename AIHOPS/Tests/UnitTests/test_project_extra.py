from types import SimpleNamespace

import pytest
from Domain.src.ProjectModule.Project import Project
from conftest import FakeSuccess, FakeFail


class StubVoteManager:
    def __init__(self, pid, db_access):
        self.factors = []
        self.factor_votes = {}
        self.severity_votes = {}
        self.voted_all = True

    def get_factors(self): return self.factors
    def get_partially_voted_amount(self): return 1
    def get_score(self, severity, weights): return {"score": 100}
    def get_project_factors_votes(self): return {"f1": [3, 4]}
    def get_member_votes(self, actor): return [("f1", 4)]
    def has_voted_all_factors(self, actor): return self.voted_all
    def add_factor(self, f): self.factors.append(f)
    def remove_factor(self, fid): return FakeSuccess()
    def set_factor_vote(self, actor, fid, score): return FakeSuccess()
    def set_severity_vote(self, actor, votes): return FakeSuccess()
    def admin_remove_default_factor(self, fid): return FakeSuccess()
    def insert_factors_loaded_from_db(self, f): pass
    def load_factor_votes(self): pass
    def load_severity_votes(self): pass


class StubDB:
    def __init__(self):
        self.inserted = []
        self.updated = []

    def insert(self, obj): self.inserted.append(obj); return FakeSuccess()
    def update(self, obj): self.updated.append(obj); return FakeSuccess()
    def load_by_query(self, model, query): return []


@pytest.fixture
def proj(monkeypatch):
    monkeypatch.setattr("Domain.src.ProjectModule.Project.VoteManager", StubVoteManager)
    return Project(9, "ProjX", "Desc", "admin@x.com", db_access=StubDB())


def test__set_factors_inited_false(proj):
    proj.factors_inited = True
    proj._set_factors_inited_false()
    assert not proj.factors_inited


def test__set_severity_factors_inited_false(proj):
    proj.severity_factors_inited = True
    proj._set_severity_factors_inited_false()
    assert not proj.severity_factors_inited


def test__verify_not_archived_raises(proj):
    proj.archived = True
    with pytest.raises(Exception, match="archived"):
        proj._verify_not_archived()


def test_remove_member_fail_paths(proj):
    r = proj.remove_member("not_found@x.com")
    assert "not in to invite nor" in r.msg


def test_get_data_methods(proj):
    res1 = proj.get_members()
    res2 = proj.get_to_invite()
    res3 = proj.get_severity_factors()
    assert res1.success and res2.success and res3.success


def test_vote_severities_sum_not_100(proj):
    proj.add_member("voter@x.com")
    res = proj.vote_severities("voter@x.com", [10, 20, 30, 10, 10])  # sum = 80
    assert not res.success


def test_publish_failures(proj):
    proj.factors_inited = False
    proj.severity_factors_inited = False
    res = proj.publish()
    assert not res.success


def test_archive_without_publish(monkeypatch):
    monkeypatch.setattr("Domain.src.ProjectModule.Project.VoteManager", StubVoteManager)
    project = Project(2, "Name", "Desc", "me@x.com", db_access=StubDB())
    res = project.archive_project()
    assert not res.success


def test_eq_and_dict_repr(monkeypatch):
    monkeypatch.setattr("Domain.src.ProjectModule.Project.VoteManager", StubVoteManager)
    a = Project(1, "A", "D", "me@x.com", db_access=StubDB())
    b = Project(1, "A", "D", "me@x.com", db_access=StubDB())
    assert a == b
    d = a.to_dict()
    assert "description" in d


# def test_load_from_db_all(monkeypatch):
#     monkeypatch.setattr("Domain.src.ProjectModule.Project.VoteManager", StubVoteManager)
#
#     db_instance = SimpleNamespace(
#         name="Test Project",
#         description="Loaded from DB",
#         owner="admin@example.com",
#         published=True,
#         archived=True,
#         severity_factors_confirmed=True,
#         factors_confirmed=True,
#         members=["user1@example.com"],
#         to_invite_when_published=[],
#         severity_factors=[1, 2, 3, 4, 5]
#     )
#
#     project = Project(
#         pid=99,
#         name="Test Project",
#         desc="Loaded from DB",
#         owner="admin@example.com",
#         db_access=StubDB(),
#         db_instance=db_instance
#     )
#
#     project.load_from_db()
#
#     assert project.name == "Test Project"
#     assert project.desc == "Loaded from DB"
#     assert project.owner == "admin@example.com"
#     assert project.published is True
#     assert project.archived is True
#     assert project.factors_inited is True
#     assert project.severity_factors_inited is True
#     assert project.members == ["user1@example.com"]
#     assert project.severity_factors == [1, 2, 3, 4, 5]
