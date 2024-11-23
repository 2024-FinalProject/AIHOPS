import random
import sys
from threading import RLock

from DAL.DBAccess import DBAccess
from Domain.src.Loggs.Response import Response, ResponseFailMsg, ResponseSuccessObj
from Domain.src.Session import Session
from Domain.src.Users.MemberController import MemberController


class Server:

    def __init__(self):
        self.sessions = {}  # map cookies to sessions
        self.enter_lock = RLock()
        self.user_controller = MemberController(self)
        self.user_deletion_lock = RLock()
        self.db_access = DBAccess()

    def clear_db(self):
        self.db_access.clear_db()

    def generateNextCookie(self):
        min = 1
        max = sys.maxsize
        while True:
            cookie = random.randrange(min, max)
            if self.sessions.get(cookie) is None:
                return cookie

    def enter(self):
        # TODO: Should I start a thread for every user?? or does the OS does the scheduling for me?
        with self.enter_lock:
            cookie = int(str(self.generateNextCookie()))
            new_session = Session(cookie)
            self.sessions[cookie] = new_session
        return Response(True, f"session: {cookie} has been added", new_session, False)

    def get_session(self, cookie):
        session = self.sessions.get(cookie)
        if session is None:
            return ResponseFailMsg("invalid cookie")
        return ResponseSuccessObj("session found", session)

    def get_session_not_member(self, cookie):
        res = self.get_session(cookie)
        if not res.success:
            return res
        session = res.result
        if session.is_member:
            return ResponseFailMsg('need to logout first')
        return res
    
    def get_session_member(self, cookie):
        res = self.get_session(cookie)
        if not res.success:
            return res
        session = res.result
        if not session.is_member:
            return ResponseFailMsg('need to login first')
        return res

    def register(self, cookie, name, passwd):
        res = self.get_session_not_member(cookie)
        if not res.success:
            return res
        res = self.user_controller.register(name, passwd)
        return res

    def login(self, cookie, name, passwd):
        res = self.get_session(cookie)
        if not res.success:
            return res
        session = res.result
        res = self.user_controller.login(name, passwd)
        if res.success:
            session.login(name)
        return res

    def logout(self, cookie):
        res = self.get_session_member(cookie)
        if not res.success:
            return res
        session = res.result
        return session.logout()