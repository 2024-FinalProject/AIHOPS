import random
import sys
from threading import RLock

from Domain.src.ProjectModule.ProjectManager import ProjectManager
from DAL.DBAccess import DBAccess
from Domain.src.Loggs.Response import Response, ResponseFailMsg, ResponseSuccessObj
from Domain.src.ProjectModule.ProjectManager import ProjectManager
from Domain.src.Session import Session
from Domain.src.Users.MemberController import MemberController


class Server:

    def __init__(self):
        self.db_access = DBAccess()
        self.sessions = {}  # map cookies to sessions
        self.enter_lock = RLock()
        self.user_deletion_lock = RLock()
        self.user_controller = MemberController(self, self.db_access)
        self.project_manager = ProjectManager(self.db_access)

    def clear_db(self):
        self.db_access.clear_db()

    def generateNextCookie(self):
        min = 1
        max = sys.maxsize
        while True:
            cookie = random.randrange(min, max)
            if self.sessions.get(cookie) is None:
                return cookie
            
    # ------------- User ------------------

    def enter(self):
        try:
            # TODO: Should I start a thread for every user?? or does the OS does the scheduling for me?
            with self.enter_lock:
                cookie = int(str(self.generateNextCookie()))
                new_session = Session(cookie)
                self.sessions[cookie] = new_session
            return Response(True, f"session: {cookie} has been added", new_session, False)
        except Exception as e:
            return Response(False, f"Failed to enter: {e}", None, False)
        
    def get_session(self, cookie):
        try:
            session = self.sessions.get(cookie)
            if session is None:
                return ResponseFailMsg("invalid cookie")
            return ResponseSuccessObj("session found", session)
        except Exception as e:
            return ResponseFailMsg(str(e))  #Convert exception to string

    def get_session_not_member(self, cookie):
        try:
            res = self.get_session(cookie)
            if not res.success:
                return res
            session = res.result
            if session.is_member:
                return ResponseFailMsg('need to logout first')
            return res
        except Exception as e:
            return ResponseFailMsg(f"Failed to get session not member: {e}")
        
    def get_session_member(self, cookie):
        try:
            res = self.get_session(cookie)
            if not res.success:
                return res
            session = res.result
            if not session.is_member:
                return ResponseFailMsg('need to login first')
            return res
        except Exception as e:
            return ResponseFailMsg(f"Failed to get session member: {e}")

    def register(self, cookie, name, passwd):
        try:
            res = self.get_session_not_member(cookie)
            if not res.success:
                return res
            res = self.user_controller.register(name, passwd)
            return res
        except Exception as e:
            return ResponseFailMsg(f"Failed to register: {e}")

    def login(self, cookie, name, passwd):
        try:
            res = self.get_session(cookie)
            if not res.success:
                return res
            session = res.result
            res = self.user_controller.login(name, passwd)
            if res.success:
                session.login(name)
            return res
        except Exception as e:
            return ResponseFailMsg(f"Failed to login: {e}")

    def logout(self, cookie):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res.result
            return session.logout()
        except Exception as e:
            return ResponseFailMsg(f"Failed to logout: {e}")
    
    # ------------- Project ------------------

    def create_project(self, cookie, name, description):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res
            return self.project_manager.create_project(name, description, session.result.user_name)
        except Exception as e:
            return ResponseFailMsg(f"Failed to create project: {e}")
    
    def set_project_factors(self, cookie, pid, factors):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res.result
            return self.project_manager.add_factors(pid, session.user_name, factors)
        except Exception as e:
            return ResponseFailMsg(f"Failed to set project factors: {e}")


    def add_project_factor(self, cookie, pid, factor):
        """factor: (name, description)"""
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res.result
            return self.project_manager.add_project_factor(pid, session.user_name, factor)
        except Exception as e:
            return ResponseFailMsg(f"Failed to set project factors: {e}")

    def delete_project_factor(self, cookie, pid, fid):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res.result
            return self.project_manager.delete_factor(pid, session.user_name, fid)
        except Exception as e:
            return ResponseFailMsg(f"Failed to remove factor {fid} from project {pid}:\n {e}")

    def delete_factor_from_pool(self, cookie, fid):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res.result
            actor = session.user_name
            return self.project_manager.delete_factor_from_pool(actor, fid)
        except Exception as e:
            return ResponseFailMsg(f"Failed to remove factor {fid} from users {actor} pool:\n {e}")
        
    def set_project_severity_factors(self, cookie, pid, severity_factors):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res.result
            actor = session.user_name
            return self.project_manager.set_severity_factors(pid, actor, severity_factors)
        except Exception as e:
            return ResponseFailMsg(f"Failed to set project severity factors: {e}")
        
    def add_members(self, cookie, pid, users_names):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res
            return self.project_manager.add_members(session.result.user_name, pid, users_names)
        except Exception as e:
            return ResponseFailMsg(f"Failed to add member: {e}")

    def add_member(self, cookie, pid, users_name):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res
            return self.project_manager.add_members(session.result.user_name, pid, users_name)
        except Exception as e:
            return ResponseFailMsg(f"Failed to add member: {e}")
        
    def remove_member(self, cookie, pid, user_name):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res
            return self.project_manager.remove_member(session.result.user_name, pid, user_name)
        except Exception as e:
            return ResponseFailMsg(f"Failed to remove member: {e}")
        
    def get_members_of_project(self, cookie, pid):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res
            return self.project_manager.get_members(pid, session.result.user_name)
        except Exception as e:
            return ResponseFailMsg(f"Failed to get member projects: {e}")

    # TODO: remove?
    def get_projects(self, cookie):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res
            return self.project_manager.get_projects(session.result.user_name)
        except Exception as e:
            return ResponseFailMsg(f"Failed to get projects: {e}")

    # TODO: remove?
    def get_project(self, cookie, pid):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res.result
            return self.project_manager.get_project(pid)
        except Exception as e:
            return ResponseFailMsg(f"Failed to get project: {e}")

    # TODO: remove?
    def get_project_by_name_and_desc(self, cookie, name, description):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res.result
            return self.project_manager.get_project_by_name_and_desc(session.result.user_name, name, description)
        except Exception as e:
            return ResponseFailMsg(f"Failed to get project by name and description: {e}")

    def publish_project(self, cookie, pid):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res
            return self.project_manager.publish_project(pid, session.result.user_name)
        except Exception as e:
            return ResponseFailMsg(f"Failed to publish project: {e}")
        
    def archive_project(self, cookie, pid):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res.result
            return self.project_manager.archive_project(pid, session.user_name)
        except Exception as e:
            return ResponseFailMsg(f"Failed to close project: {e}")
        
    def update_project_name_and_desc(self, cookie, pid, name, description):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res
            return self.project_manager.update_project_name_and_desc(pid, name, description)
        except Exception as e:
            return ResponseFailMsg(f"Failed to update project name and description: {e}")

    # TODO: remove?
    def vote(self, cookie, pid, factors_values, severity_factors_values):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res.result
            user_name = session.user_name
            return self.project_manager.vote(pid, user_name, factors_values, severity_factors_values)
        except Exception as e:
            return ResponseFailMsg(f"Failed to vote: {e}")

    def vote_on_factor(self, cookie, pid, fid, score):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res.result
            user_name = session.user_name
            return self.project_manager.vote_on_factor(pid, user_name, fid, score)
        except Exception as e:
            return ResponseFailMsg(f"Failed to vote: {e}")

    def vote_severities(self, cookie, pid, severity_votes):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res.result
            user_name = session.user_name
            return self.project_manager.vote_severities(pid, user_name, severity_votes)
        except Exception as e:
            return ResponseFailMsg(f"Failed to vote: {e}")
    
    def get_pending_requests(self, cookie):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res.result
            user_name = session.user_name
            return self.project_manager.get_pending_projects_for_email(user_name)
        except Exception as e:
            return ResponseFailMsg(f"Failed to get pending requests: {e}")

    def get_pending_emails_for_project(self, cookie, pid):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res.result
            user_name = session.user_name
            return self.project_manager.get_pending_emails_for_project(pid, user_name)
        except Exception as e:
            return ResponseFailMsg(f"Failed to get pending emails for project: {e}")
  
    def get_score(self, cookie, pid):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res.result
            user_name = session.user_name
            res = self.project_manager.get_score(user_name, pid)
            return res
        except Exception as e:
            return ResponseFailMsg(f"Failed to get score: {e}")
        
    def approve_member(self, cookie, pid):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res
            return self.project_manager.approve_member(pid, session.result.user_name)
        except Exception as e:
            return ResponseFailMsg(f"Failed to approve member: {e}")
        
    def reject_member(self, cookie, pid):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res
            return self.project_manager.reject_member(pid, session.result.user_name)
        except Exception as e:
            return ResponseFailMsg(f"Failed to reject member: {e}")