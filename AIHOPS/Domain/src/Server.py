import random
import sys
from threading import RLock

from requests import session

from Domain.src.DS.FactorsPool import FactorsPool
from Domain.src.ProjectModule.ProjectManager import ProjectManager
from DAL.DBAccess import DBAccess
from Domain.src.Loggs.Response import Response, ResponseFailMsg, ResponseSuccessObj, ResponseSuccessMsg
from Domain.src.ProjectModule.ProjectManager import ProjectManager
from Domain.src.Session import Session
from Domain.src.Users.MemberController import MemberController


from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import json

from Domain.src.Users.TACController import TACController


class Server:
    def __init__(self, socketio=None):
        self.db_access = DBAccess()
        self.sessions = {}  # map cookies to sessions
        self.enter_lock = RLock()
        self.user_deletion_lock = RLock()
        self.user_controller = MemberController(self, self.db_access)
        self.project_manager = ProjectManager(self.db_access)
        self.GOOGLE_CLIENT_ID = "778377563471-10slj8tsgra2g95aq2hq48um0gvua81a.apps.googleusercontent.com"
        self.tac_controller = TACController(socketio)
        self.tac_controller.load()

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

    def verify(self, cookie, email, passwd, code):
        try:
            res = self.get_session_not_member(cookie)
            if not res.success:
                return res
            res = self.user_controller.verify(email, passwd, code)
            return res
        except Exception as e:
            return ResponseFailMsg(f"Failed to register: {e}")

    def verify_automatic(self, cookie, token):
        try:
            res = self.get_session_not_member(cookie)
            if not res.success:
                return res
            res = self.user_controller.verify_automatic(token)
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
            if not res.success:
                return res

            if res.is_admin:
                session.admin_login()
            else:
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
        
    def google_login(self, cookie, token_id):
        try:
            # Verify the Google token
            id_info = id_token.verify_oauth2_token(
                token_id, google_requests.Request(), self.GOOGLE_CLIENT_ID
            )
            
            if id_info['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                return ResponseFailMsg("Invalid token issuer")
            
            # Get user email from the token info
            email = id_info['email']
            
            # Get the session
            res = self.get_session(cookie)
            if not res.success:
                return res
            
            session = res.result
            
            # Check if user exists
            member_exists = self.user_controller.members.get(email) is not None
            
            if not member_exists:
                # User doesn't exist, create one with a random password
                import secrets
                random_password = secrets.token_hex(16)
                register_res = self.user_controller.register_google_user(email, random_password)
                
                if not register_res.success:
                    return register_res
            
            # Login the user with Google authentication
            login_res = self.user_controller.login_with_google(email)
            
            if login_res.success:
                session.login(email)
                return Response(True, f"Successfully logged in with Google as {email}", {"email": email}, False)
            
            return login_res
        
        except ValueError as e:
            return ResponseFailMsg(f"Invalid Google token: {str(e)}")
        except Exception as e:
            return ResponseFailMsg(f"Failed to login with Google: {str(e)}")
        
    def check_email_exists(self, cookie, token_id):
        try:
            # Verify the Google token
            id_info = id_token.verify_oauth2_token(
                token_id, google_requests.Request(), self.GOOGLE_CLIENT_ID
            )
            
            if id_info['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                return ResponseFailMsg("Invalid token issuer")
            
            # Get user email from the token info
            email = id_info['email']
            
            # Check if user exists
            user_exists = self.user_controller.members.get(email) is not None
            
            return Response(True, "Email check completed", {"userExists": user_exists, "email": email}, False)
        
        except ValueError as e:
            return ResponseFailMsg(f"Invalid Google token: {str(e)}")
        except Exception as e:
            return ResponseFailMsg(f"Failed to check email: {str(e)}")
        
    # def update_password(self, cookie, old_passwd, new_passwd):
    #     try:
    #         res = self.get_session_member(cookie)
    #         if not res.success:
    #             return res
    #         session = res.result
    #         return self.user_controller.update_password(session.user_name, old_passwd, new_passwd)
    #     except Exception as e:
    #         return ResponseFailMsg(f"Failed to update password: {e}")

    def start_password_recovery(self, cookie, email):
        try:
            res = self.get_session(cookie)
            if not res.success:
                return res
            return self.user_controller.start_password_recovery(email)
        except Exception as e:
            return ResponseFailMsg(f"Failed to recover password: {e}")

    def update_password(self, cookie, email, passwd, code):
        try:
            res = self.get_session(cookie)
            if not res.success:
                return res
            return self.user_controller.recover_password(email, passwd, code)
        except Exception as e:
            return ResponseFailMsg(f"Failed to update password: {e}")

    def is_valid_session(self, cookie, email):
        """if email is None -> check if cookie exists
            if email is not None -> check if cookie exists and logged in as email"""
        try:
            session = self.sessions.get(cookie, None)
            if session is None:
                return ResponseFailMsg(f"Session not found: {cookie}")
            if email is None:
                return ResponseSuccessMsg(f"Session found: {cookie}")
            if session.is_logged_in() is False or session.user_name != email:
                return ResponseFailMsg(f"session not logged in: {email}")
            return ResponseSuccessMsg(f"session found: {cookie}, logged in as {email}")
        except Exception as e:
            return ResponseFailMsg(f"Failed to check session: {e}")

    def delete_account(self, cookie):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res.result
            res = self.user_controller.delete_account(session.user_name)
            if not res.success:
                return res
            return self.project_manager.cleanup_member(session.user_name)
        except Exception as e:
            return ResponseFailMsg(f"Failed to delete account: {e}")

    # ------------- Project ------------------
    def create_project(self, cookie, name, description, use_default_factors=False, is_to_research=False):
        """when using default factors, if anything goes wrong with the factor assignment,
                    project will be created without or with partial factors"""
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res
            return self.project_manager.create_project(name, description, session.result.user_name, use_default_factors, is_to_research=is_to_research)
        except Exception as e:
            return ResponseFailMsg(f"Failed to create project: {e}")
    
    def set_project_factors(self, cookie, pid, factors):
        """expects a list of factor ids, that exist in actors factors pool"""
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res.result
            return self.project_manager.add_factors(pid, session.user_name, factors)
        except Exception as e:
            return ResponseFailMsg(f"Failed to set project factors: {e}")

    def add_project_factor(self, cookie, pid, factor_name, factor_desc, scales_desc, scales_explanation):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res.result
            return self.project_manager.add_project_factor(pid, session.user_name, factor_name, factor_desc, scales_desc, scales_explanation)
        except Exception as e:
            return ResponseFailMsg(f"Failed to set project factor: {e}")

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

    # TODO: newnewnew- need to change it
    def update_factor(self, cookie, fid, pid, name, desc, scales_desc, scales_explenation, apply_to_all_inDesign):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res.result
            actor = session.user_name
            ress = self.project_manager.update_factor(actor, fid, pid, name, desc, scales_desc, scales_explenation, apply_to_all_inDesign)
            print(f"from service.py: {ress.msg}")
            return ress
        except Exception as e:
            return ResponseFailMsg(f"Failed to update factor {fid} :\n {e}")


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
        """project not  published -> added to the toinvite list once project is published
                        published -> added to pending requests"""
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res
            return self.project_manager.add_member(session.result.user_name, pid, users_name)
        except Exception as e:
            return ResponseFailMsg(f"Failed to add member: {e}")
        
    def remove_member(self, cookie, pid, user_name):
        """only allowed for project owner
            removes user_name from all places -> member / pending / toinvite"""
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res
            return self.project_manager.remove_member(session.result.user_name, pid, user_name)
        except Exception as e:
            return ResponseFailMsg(f"Failed to remove member: {e}")
        
    def get_members_of_project(self, cookie, pid):
        """gets the approved members """
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res
            return self.project_manager.get_members(pid, session.result.user_name)
        except Exception as e:
            return ResponseFailMsg(f"Failed to get member projects: {e}")

    def get_project_to_invite(self, cookie, pid):
        """gets the members that are planned to be invited once the project is published"""
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res
            return self.project_manager.get_project_to_invite(pid, session.result.user_name)
        except Exception as e:
            return ResponseFailMsg(f"Failed to get member projects: {e}")

    def get_projects_of_owner(self, cookie):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res
            return self.project_manager.get_projects_by_owner(session.result.user_name)
        except Exception as e:
            return ResponseFailMsg(f"Failed to get projects: {e}")

    # TODO: remove? or add permissions?
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
        """only allowed for project owner
            must confirm factors and severity factors, and add at least 1 member to to_invite
            all to_invite are moved to pending requests"""
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res
            return self.project_manager.publish_project(pid, session.result.user_name)
        except Exception as e:
            return ResponseFailMsg(f"Failed to publish project: {e}")
        
    def archive_project(self, cookie, pid):
        """only allowed for project owner
            """
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
            actor = res.result.user_name
            return self.project_manager.update_project_name_and_desc(pid,actor, name, description)
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

    # TODO: new
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

    # TODO: new
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
  
    def get_score(self, cookie, pid, weights):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res.result
            user_name = session.user_name

            res = self.project_manager.get_score(user_name, pid, weights)
            print(f"this is the score: {res.result}")
            return res
        except Exception as e:
            print(self.sessions.keys())
            print(f"2cookie: {cookie}")
            return ResponseFailMsg(f"Failed to get score: {e}")
        
    def get_project_factors_votes(self, cookie, pid):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res.result
            return self.project_manager.get_project_factors_votes(pid, session.user_name)
        except Exception as e:
            return ResponseFailMsg(f"Failed to get project factors votes: {e}")
        
    def approve_member(self, cookie, pid):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res.result
            return self.project_manager.approve_member(pid, session.user_name)
        except Exception as e:
            return ResponseFailMsg(f"Failed to approve member: {e}")
        
    def reject_member(self, cookie, pid):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res.result
            return self.project_manager.reject_member(pid, session.user_name)
        except Exception as e:
            return ResponseFailMsg(f"Failed to reject member: {e}")

    def confirm_project_factors(self, cookie, pid):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            actor = res.result.user_name
            return self.project_manager.confirm_factors(pid, actor)
        except Exception as e:
            return ResponseFailMsg(f"Failed to confirm factors : {e}")

    def confirm_project_severity_factors(self, cookie, pid):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            actor = res.result.user_name
            return self.project_manager.confirm_severity_factors(pid, actor)
        except Exception as e:
            return ResponseFailMsg(f"Failed to confirm severity factors: {e}")

    def get_project_factors(self, cookie, pid):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            actor = res.result.user_name
            return self.project_manager.get_project_factors(pid, actor)
        except Exception as e:
            return ResponseFailMsg(f"Failed to get_project_factors: {e}")

    # TODO: newnew added dict fields
    def get_project_progress_for_owner(self, cookie, pid):
        """return {name: bool , desc: bool, factors: amount, d_score:bool, invited: bool}
                    new: {voted_amount: int, member_count: int, pending_members: int}
            voted: counts partial votes as well, also if only voted on severities and not on factors"""
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            actor = res.result.user_name
            return self.project_manager.get_project_progress_for_owner(pid, actor)
        except Exception as e:
            return ResponseFailMsg(f"Failed to get_project_progress_for_owner: {e}")

    def get_project_severity_factors(self, cookie, pid):
        """returns projects current severity factors"""
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            actor = res.result.user_name
            return self.project_manager.get_project_severity_factors(pid, actor)
        except Exception as e:
            return ResponseFailMsg(f"Failed to get_project_severity_factors: {e}")

    # TODO: new
    def get_projects_of_member(self, cookie):
        """returns all the projects actor is active member of"""
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            actor = res.result.user_name
            return self.project_manager.get_projects_of_member(actor)
        except Exception as e:
            return ResponseFailMsg(f"Failed get_project_of_member: {e}")

    def get_factor_pool_of_member(self, cookie):
        """returns all members factors"""
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            actor = res.result.user_name
            return self.project_manager.get_factor_pool(actor)
        except Exception as e:
            return ResponseFailMsg(f"Failed to get factor pool of member: {e}")
        
    def get_projects_factor_pool_of_member(self, cookie, pid):
        """returns all the projects actor is active member of"""
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            actor = res.result.user_name
            return self.project_manager.get_projects_factor_pool(actor, pid)
        except Exception as e:
            return ResponseFailMsg(f"Failed to get projects factor pool of member: {e}")

    # TODO: newnew
    def get_member_vote_on_project(self, cookie, pid):
        """returns asking actors vote on ongoing project,
            {"factor_votes": {fid: score, fid: score ...}
             "severity_votes": [v1, v2, v3, v4, v5]}"""
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            actor = res.result.user_name
            return self.project_manager.get_member_votes(pid, actor)
        except Exception as e:
            return ResponseFailMsg(f"Failed to get members vote on project: {e}")

    def fetch_default_severity_factors_full(self, cookie):
        try:
            return self.project_manager.get_default_severity_factors()
        except Exception as e:
            return ResponseFailMsg(f"Failed to fetch default factors: {e}")
        
    def delete_project(self, cookie, pid):
        """Verifies session, then hands off to ProjectManager."""
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res.result
            return self.project_manager.delete_project(pid, session.user_name)
        except Exception as e:
            return ResponseFailMsg(f"Failed to delete project: {e}")

# -------------  admin actions ------------------------

    def _verify_admin(self, cookie):
        res = self.get_session_member(cookie)
        if not res.success:
            raise Exception("user is not admin")
        if not res.result.is_admin:
            raise Exception("user is not admin")

    def admin_change_default_factor(self, cookie, fid, name, desc, scales_desc, scales_explanation):
        """change will persist in all projects"""
        try:
            self._verify_admin(cookie)
            return self.project_manager.admin_change_default_factor(fid, name, desc, scales_desc, scales_explanation)
        except Exception as e:
            return ResponseFailMsg(f"Failed change default factor {fid}: {e}")

    def admin_add_default_factor(self, cookie, name, desc, scales_desc, scales_explanation):
        """factor wont be added automatically to any project"""
        try:
            self._verify_admin(cookie)
            return self.project_manager.admin_add_default_factor(name, desc, scales_desc, scales_explanation)
        except Exception as e:
            return ResponseFailMsg(f"Failed to add default factor {name}: {e}")

    def admin_remove_default_factor(self, cookie, fid):
        """change will persist in all projects"""
        try:
            self._verify_admin(cookie)
            return self.project_manager.admin_remove_default_factor(fid)
        except Exception as e:
            return ResponseFailMsg(f"Failed to remove default factor {fid}: {e}")

    def admin_fetch_default_factors(self, cookie):
        try:
            self._verify_admin(cookie)
            return self.project_manager.get_default_factors()
        except Exception as e:
            return ResponseFailMsg(f"Failed to fetch default factors: {e}")

    def admin_fetch_default_severity_factors(self, cookie):
        try:
            self._verify_admin(cookie)
            return self.project_manager.get_default_severity_factors()
        except Exception as e:
            return ResponseFailMsg(f"Failed to fetch default factors: {e}")

    def admin_update_default_severity_factors(self, cookie, severity_factors):
        """change will not persist in any project, all future projects will be defaulted with these severity factors"""
        try:
            self._verify_admin(cookie)
            return self.project_manager.admin_update_default_severity_factors(severity_factors)
        except Exception as e:
            return ResponseFailMsg(f"Failed update severity factors: {e}")

    def admin_update_terms_and_conditions(self, cookie, updated_terms):
        try:
            self._verify_admin(cookie)
            return self.tac_controller.update(updated_terms)
        except Exception as e:
            return ResponseFailMsg(f"admin failed update terms and conditions: {e}")


    def get_research_projects(self, cookie):
        try:
            self._verify_admin(cookie)
            return self.project_manager.research_get_projects()
        except Exception as e:
            print(f"users cookie: {cookie}\nadmins cookie: {[x.cookie for x in self.sessions.values() if x.is_admin]}")
            return ResponseFailMsg(f"Failed to get research projects: {e}")

    def remove_research_project(self, cookie, pid):
        try:
            self._verify_admin(cookie)
            return self.project_manager.research_remove_project(pid)
        except Exception as e:
            return ResponseFailMsg(f"Failed to remove research project: {e}")

