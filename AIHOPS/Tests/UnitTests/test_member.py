import pytest
import hashlib
from Domain.src.Users.Member import Member
from Domain.src.Loggs.Response import Response, ResponseLogin, ResponseSuccessObj

@pytest.fixture
def default_member():
    return Member(email="user@example.com", passwd="password123", uid=1)

@pytest.fixture
def verified_member():
    return Member(email="user@example.com", passwd="password123", uid=1, verified=True)

@pytest.fixture
def db_member():
    encrypted = hashlib.sha256("password123".encode('utf8')).hexdigest()
    return Member(email="user@example.com", passwd=encrypted, uid=1, from_db=True, verified=True)

def test_password_verification_success(db_member):
    db_member.verify_passwd("password123")  # Should not raise

def test_password_verification_failure(db_member):
    with pytest.raises(Exception, match="incorrect credentials"):
        db_member.verify_passwd("wrongpass")

def test_login_success(verified_member):
    res = verified_member.login("user@example.com", "password123")
    assert res.success
    assert verified_member.logged_in

def test_login_unverified_user(default_member):
    res = default_member.login("user@example.com", "password123")
    assert not res.success
    assert not default_member.logged_in

def test_login_wrong_email(verified_member):
    res = verified_member.login("wrong@example.com", "password123")
    assert not res.success
    assert not verified_member.logged_in

def test_login_wrong_password(verified_member):
    with pytest.raises(Exception, match="incorrect credentials"):
        verified_member.login("user@example.com", "wrongpass")

def test_login_with_google_success():
    m = Member("g@example.com", "irrelevant", 2, verified=True, is_google_user=True)
    res = m.login_with_google("g@example.com")
    assert res.success
    assert m.logged_in
    assert res.accepted_tac_version == -1

def test_login_with_google_unverified():
    m = Member("g@example.com", "irrelevant", 2, is_google_user=True)
    res = m.login_with_google("g@example.com")
    assert not res.success
    assert not m.logged_in

def test_login_with_google_wrong_email():
    m = Member("g@example.com", "irrelevant", 2, verified=True, is_google_user=True)
    res = m.login_with_google("wrong@example.com")
    assert not res.success
    assert not m.logged_in

def test_logout(verified_member):
    verified_member.logged_in = True
    res = verified_member.logout()
    assert not verified_member.logged_in
    assert res.success

def test_get_user_name(verified_member):
    res = verified_member.getUserName()
    assert isinstance(res, ResponseSuccessObj)
    assert res.result == "user@example.com"

def test_to_json_google_user():
    m = Member("u@gmail.com", "xxx", 3, is_google_user=True)
    js = m.to_json()
    assert js["name"] == "u@gmail.com"
    assert js["is_google_user"] is True

def test_update_password(db_member):
    db_member.update_password("newpassword")
    expected = hashlib.sha256("newpassword".encode("utf8")).hexdigest()
    assert db_member.encrypted_passwd == expected

def test_set_profile_picture(verified_member):
    success = verified_member.set_profile_picture("pic.jpg")
    assert success
    assert verified_member.profile_picture == "pic.jpg"
