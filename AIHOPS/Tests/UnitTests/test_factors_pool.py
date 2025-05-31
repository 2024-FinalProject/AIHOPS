import pytest
from unittest.mock import mock_open, patch
from conftest import StubDB, FakeSuccess, FakeFail
from Domain.src.DS import FactorsPool as fp
from Domain.src.DS.FactorsPool import FactorsPool, Factor


def setup_module(module):
    fp.DEFAULT_FACTORS[:] = []
    fp.DEFAULT_FACTORS_IDS[:] = []


@pytest.fixture
def pool(monkeypatch):
    monkeypatch.setattr(fp, "ResponseSuccessMsg", FakeSuccess, raising=False)
    monkeypatch.setattr(fp, "ResponseFailMsg", FakeFail, raising=False)
    monkeypatch.setattr(fp, "save_default_factors_to_file", lambda *args, **kwargs: None)
    return FactorsPool(StubDB())


def test_add_and_remove_default_factor(pool, monkeypatch):
    fp.DEFAULT_FACTORS_IDS.append(-100)
    result = pool.admin_add_default_factor("NewFactor", "NewDesc", ["a"]*5, ["b"]*5)
    assert result.success
    fid = fp.DEFAULT_FACTORS[-1].fid
    result = pool.admin_remove_default_factor(fid)
    assert result.success


def test_admin_update_default_factor(pool, monkeypatch):
    fp.DEFAULT_FACTORS_IDS.append(-101)
    pool.admin_add_default_factor("Temp", "Desc", ["1"]*5, ["2"]*5)
    fid = fp.DEFAULT_FACTORS[-1].fid
    result = pool.admin_change_default_factor(fid, "Updated", "Updated", ["u"]*5, ["v"]*5)
    assert result.success
    updated = [f for f in fp.DEFAULT_FACTORS if f.fid == fid][0]
    assert updated.name == "Updated"


def test_update_failure_raises(pool, monkeypatch):
    fp.DEFAULT_FACTORS_IDS.append(-102)
    pool.admin_add_default_factor("FailTest", "Desc", ["1"]*5, ["2"]*5)
    fid = fp.DEFAULT_FACTORS[-1].fid
    monkeypatch.setattr(pool.db_access, "update_by_query", lambda *args, **kwargs: FakeFail("fail"))
    with pytest.raises(Exception, match=r".*failed to update factor.*"):
        pool.admin_change_default_factor(fid, "X", "Y", ["z"]*5, ["w"]*5)


def test_remove_nonexistent_default_raises(pool):
    with pytest.raises(KeyError):
        pool.admin_remove_default_factor(-9999)


def test_admin_add_insert_failure(monkeypatch):
    class FailDB:
        def insert(self, *_): return FakeFail("db insert failed")
        def load_all(self, *_): return []

    monkeypatch.setattr(fp, "DBAccess", lambda: FailDB())
    monkeypatch.setattr(fp, "save_default_factors_to_file", lambda *args, **kwargs: None)
    fp.DEFAULT_FACTORS_IDS.append(-103)
    pool = FactorsPool(FailDB())

    with pytest.raises(Exception, match=r".*failed to insert new factor.*"):
        pool.admin_add_default_factor("X", "Y", ["1"]*5, ["2"]*5)


def test_get_default_factors_and_ids(monkeypatch):
    f = Factor(-99, "default", "Mock", "Desc", ["a"]*5, ["b"]*5)
    fp.DEFAULT_FACTORS[:] = [f]
    fp.DEFAULT_FACTORS_IDS[:] = [f.fid]
    assert isinstance(fp.DEFAULT_FACTORS[0].to_dict(), dict)
    assert isinstance(str(fp.DEFAULT_FACTORS[0]), str)
    pool = FactorsPool(StubDB())
    assert pool.get_default_factors()[0]["name"] == "Mock"
    assert -99 in pool.get_default_factor_ids()


def test_save_default_factors_to_file(monkeypatch):
    f = Factor(-100, "saveuser", "SaveName", "SaveDesc", ["a"]*5, ["b"]*5)
    m = mock_open()
    monkeypatch.setattr("builtins.open", m)
    fp.save_default_factors_to_file([f])
    handle = m()
    handle.write.assert_called()


def test_load_default_factors_from_file(monkeypatch):
    fake_json = '[{"fid": -1, "owner": "admin", "name": "LoadTest", "description": "desc", "scales_desc": ["a", "a", "a", "a", "a"], "scales_explanation": ["b", "b", "b", "b", "b"]}]'
    m = mock_open(read_data=fake_json)
    monkeypatch.setattr("builtins.open", m)
    factors = fp.load_default_factors_from_file()
    assert len(factors) == 1
    assert factors[0].name == "LoadTest"


def test_insert_defaults(monkeypatch):
    inserted = []
    class FakeDB:
        def insert(self, obj): inserted.append(obj); return FakeSuccess()

    f = Factor(-200, "admin", "InsertTest", "desc", ["x"]*5, ["y"]*5)
    monkeypatch.setattr(fp, "DEFAULT_FACTORS", [f])
    monkeypatch.setattr(fp, "DBAccess", lambda: FakeDB())
    fp.insert_defaults()
    assert len(inserted) == 1


def test_factor_update_success(monkeypatch):
    f = Factor(1, "test", "old", "old", ["1"]*5, ["2"]*5)
    db = type("FakeDB", (), {"insert": lambda *_: FakeSuccess()})()
    res = f.update("new", "newdesc", db)
    assert res.success
    assert f.name == "new"


def test_factor_update_failure(monkeypatch):
    f = Factor(2, "fail", "old", "old", ["1"]*5, ["2"]*5)
    db = type("FakeDB", (), {"insert": lambda *_: FakeFail("fail")})()
    res = f.update("x", "y", db)
    assert not res.success


def test_factor_update_new_failure(monkeypatch):
    f = Factor(3, "fail", "x", "y", ["a"]*5, ["b"]*5)
    db = type("FakeDB", (), {"update_by_query": lambda *_: FakeFail("db fail")})()
    with pytest.raises(Exception, match="failed to update factor"):
        f.update_new("z", "w", ["1"]*5, ["2"]*5, db)

def test_factor_update_new_success(monkeypatch):
    f = Factor(3, "fail", "x", "y", ["a"]*5, ["b"]*5)
    class GoodDB:
        def update_by_query(self, *_): return FakeSuccess()
    db = GoodDB()
    res = f.update_new("z", "w", ["1"]*5, ["2"]*5, db)
    assert res.success


def test_factor_str_and_to_dict():
    f = Factor(10, "u", "n", "d", ["1"]*5, ["2"]*5)
    assert "Factor id" in str(f)
    d = f.to_dict()
    assert d["name"] == "n"

def test_add_factor_success_and_duplicate(monkeypatch):
    pool = FactorsPool(StubDB())
    monkeypatch.setattr(fp, "ResponseSuccessMsg", FakeSuccess)

    f = pool.add_factor("user@example.com", "Test Factor", "A description", ["s"]*5, ["e"]*5)
    assert isinstance(f, Factor)

    # Duplicate name and desc for same user → should raise
    with pytest.raises(NameError):
        pool.add_factor("user@example.com", "Test Factor", "A description", ["s"]*5, ["e"]*5)

    # Same name for another user → allowed
    f2 = pool.add_factor("another@example.com", "Test Factor", "A description", ["s"]*5, ["e"]*5)
    assert f2.owner == "another@example.com"

def test_remove_factor_success_and_failure(monkeypatch):
    pool = FactorsPool(StubDB())
    monkeypatch.setattr(fp, "ResponseSuccessMsg", FakeSuccess)

    f = pool.add_factor("user@example.com", "Removable", "Desc", ["s"]*5, ["e"]*5)
    fid = f.fid

    res = pool.remove_factor("user@example.com", fid)
    assert res.success

    # Already removed → should raise
    with pytest.raises(KeyError):
        pool.remove_factor("user@example.com", fid)

def test_get_factors_combined(monkeypatch):
    pool = FactorsPool(StubDB())
    monkeypatch.setattr(fp, "ResponseSuccessMsg", FakeSuccess)

    # Add one factor
    f = pool.add_factor("me@example.com", "Custom", "Desc", ["s"]*5, ["e"]*5)

    # Add fake default
    fake_default = Factor(-999, "DEFAULT", "DName", "DDesc", ["1"]*5, ["2"]*5)
    fp.DEFAULT_FACTORS.append(fake_default)
    fp.DEFAULT_FACTORS_IDS.append(fake_default.fid)

    factors = pool.get_factors("me@example.com")
    assert f in factors
    assert any(fac.fid == -999 for fac in factors)

def test_multiple_users_same_factor(monkeypatch):
    pool = FactorsPool(StubDB())
    monkeypatch.setattr(fp, "ResponseSuccessMsg", FakeSuccess)

    f1 = pool.add_factor("user1@example.com", "SharedName", "SharedDesc", ["a"]*5, ["b"]*5)
    f2 = pool.add_factor("user2@example.com", "SharedName", "SharedDesc", ["a"]*5, ["b"]*5)

    assert f1.name == f2.name
    assert f1.description == f2.description
    assert f1.owner != f2.owner

def test_user_deletes_only_their_own_factor(monkeypatch):
    pool = FactorsPool(StubDB())
    monkeypatch.setattr(fp, "ResponseSuccessMsg", FakeSuccess)

    f1 = pool.add_factor("alice@example.com", "UniqueFactor", "SameDesc", ["a"]*5, ["b"]*5)
    f2 = pool.add_factor("bob@example.com", "UniqueFactor", "SameDesc", ["a"]*5, ["b"]*5)

    assert f1.fid != f2.fid

    # Alice removes her factor
    pool.remove_factor("alice@example.com", f1.fid)

    # Bob should still have his factor
    remaining = pool.find_factors("bob@example.com", f2.fid)
    assert remaining.fid == f2.fid

    # Alice should no longer have hers
    with pytest.raises(KeyError):
        pool.find_factors("alice@example.com", f1.fid)

def test_user_cannot_access_or_delete_others_factor(monkeypatch):
    pool = FactorsPool(StubDB())
    monkeypatch.setattr(fp, "ResponseSuccessMsg", FakeSuccess)

    f1 = pool.add_factor("charlie@example.com", "Invisible", "Private", ["x"]*5, ["y"]*5)

    # Another user cannot see this factor
    with pytest.raises(KeyError):
        pool.find_factors("dana@example.com", f1.fid)

    # Or remove it
    with pytest.raises(KeyError):
        pool.remove_factor("dana@example.com", f1.fid)