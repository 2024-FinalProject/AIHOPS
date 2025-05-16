import random
import sys
from threading import RLock


from DAL.Objects.DBMember import DBMember
from Domain.src.ProjectModule.ProjectManager import ProjectManager
from DAL.DBAccess import DBAccess
from Domain.src.Loggs.Response import Response, ResponseFailMsg, ResponseSuccessObj, ResponseSuccessMsg
from Domain.src.ProjectModule.ProjectManager import ProjectManager
from Domain.src.Session import Session
from Domain.src.Users.MemberController import MemberController


from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import os
from werkzeug.utils import secure_filename
import io
import traceback
from PIL import Image, ImageDraw, ImageFont
from Domain.src.Users.CloudinaryProfilePictureManager import CloudinaryProfilePictureManager
from Service.config import CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, UPLOAD_FOLDER, ALLOWED_EXTENSIONS

from Domain.src.Users.TACController import TACController

GOOGLE_CLIENT_ID = "778377563471-10slj8tsgra2g95aq2hq48um0gvua81a.apps.googleusercontent.com"

class Server:
    def __init__(self, socketio=None):
        self.db_access = DBAccess()
        self.sessions = {}  # map cookies to sessions
        self.enter_lock = RLock()
        self.user_deletion_lock = RLock()
        self.GOOGLE_CLIENT_ID = GOOGLE_CLIENT_ID
        self.user_controller = MemberController(self, self.db_access)
        self.project_manager = ProjectManager(self.db_access)
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

    def register(self, cookie, name, passwd, accepted_terms_version=-1):
        try:
            res = self.get_session_not_member(cookie)
            if not res.success:
                return res
            res = self.user_controller.register(name, passwd, accepted_terms_version)
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

    def _is_need_to_accept_new_terms_anc_conditions(self, version):
        return self.tac_controller.current_version > version

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
                res.need_to_accept_new_terms = self._is_need_to_accept_new_terms_anc_conditions(res.accepted_tac_version)
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
        
    def google_login(self, cookie, token_id, accepted_terms_version=-1):
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
                register_res = self.user_controller.register_google_user(email, random_password, accepted_terms_version)
                
                if not register_res.success:
                    return register_res
            
            # Login the user with Google authentication
            login_res = self.user_controller.login_with_google(email)
            login_res.need_to_accept_new_terms= self._is_need_to_accept_new_terms_anc_conditions(login_res.accepted_tac_version)
            print(f"{email} accepted: {login_res.accepted_tac_version}, current version: {self.tac_controller.current_version}")
            
            if login_res.success:
                session.login(email)
                login_res.result = {"email": email}

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

    def accept_terms(self, cookie, version):
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            actor = res.result.user_name
            return self.user_controller.accept_terms(actor, version)
        except Exception as e:
            return ResponseFailMsg(f"Failed to accept terms: {str(e)}")

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

    def fetch_profile_picture_from_google(self, token_id, source='google'):
        """Fetches profile picture from Google via OAuth token and stores it on Cloudinary"""
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
            member = self.user_controller.members.get(email)
            if not member:
                return ResponseFailMsg(f"User {email} not found")
            
            # Forward to the member controller to handle the fetch and storage
            return self.user_controller.fetch_profile_picture_from_google(token_id, source)
            
        except ValueError as e:
            return ResponseFailMsg(f"Invalid Google token: {str(e)}")
        except Exception as e:
            return ResponseFailMsg(f"Failed to fetch Google profile picture: {str(e)}")

    def update_profile_picture(self, cookie, filename, source='upload'):
        """Updates the user's profile picture filename and source in the database"""
        try:
            res = self.get_session_member(cookie)
            if not res.success:
                return res
            session = res.result
            return self.user_controller.update_profile_picture(session.user_name, filename, source)
        except Exception as e:
            return ResponseFailMsg(f"Failed to update profile picture: {e}")

    def get_member_profile_info(self, email):
        """Gets profile information for a member, including picture source"""
        try:
            # Check if the user exists
            member = self.user_controller.members.get(email)
            if not member:
                return ResponseFailMsg(f"User {email} not found")
            
            # Query the database for profile information
            result = self.db_access.load_by_query(DBMember, {"email": email})
            
            if not result or not isinstance(result, list) or len(result) == 0:
                return ResponseFailMsg(f"No database record found for {email}")
            
            member_record = result[0]
            
            # Include all relevant profile information
            info = {
                'email': email,
                'has_picture': hasattr(member_record, 'profile_picture') and member_record.profile_picture is not None,
                'profile_picture': getattr(member_record, 'profile_picture', None),
                'profile_picture_source': getattr(member_record, 'profile_picture_source', 'none')
            }
            
            return ResponseSuccessObj(f"Retrieved profile info for {email}", info)
            
        except Exception as e:
            return ResponseFailMsg(f"Failed to get member profile info: {str(e)}")

    def allowed_file(self, filename):
        """Check if the file extension is allowed"""
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

    def handle_upload_profile_picture(self, request_data, files):
        """Handler for profile picture uploads - moved from service layer"""
        try:
            print("==== Upload Profile Picture Request ====")
            
            # Get cookie from form data
            if 'cookie' not in request_data:
                return {"message": "Authentication required - no cookie found", "success": False}
                
            cookie = request_data.get('cookie')
            
            # Get source parameter (defaults to 'upload')
            source = request_data.get('source', 'upload')
            
            # Check if there's a file part
            if 'file' not in files:
                return {"message": "No file part in request", "success": False}
            
            file = files['file']
            
            # If user does not select file, browser might submit an empty file without filename
            if file.filename == '':
                return {"message": "No file selected", "success": False}
            
            # Validate file extension
            if not file or not self.allowed_file(file.filename):
                return {"message": "File type not allowed", "success": False}
                
            try:
                # Get the session using cookie
                cookie_int = int(cookie)
            except (ValueError, TypeError) as e:
                return {"message": f"Invalid cookie format: {str(e)}", "success": False}
                
            # Get session information
            res = self.get_session_member(cookie_int)
            if not res.success:
                return {"message": res.msg, "success": False}
                
            # Get the user email from the session
            session = res.result
            user_email = session.user_name
            
            try:
                # First save the file locally (temporarily)
                filename = secure_filename(file.filename)
                ext = filename.rsplit('.', 1)[1].lower()
                temp_filename = f"temp_{user_email}.{ext}"
                temp_file_path = os.path.join(UPLOAD_FOLDER, temp_filename)
                
                # Save the file temporarily
                file.save(temp_file_path)
                
                # Upload to Cloudinary
                cloudinary_manager = CloudinaryProfilePictureManager(
                    CLOUDINARY_CLOUD_NAME, 
                    CLOUDINARY_API_KEY, 
                    CLOUDINARY_API_SECRET
                )
                
                # Upload to Cloudinary
                cloudinary_result = cloudinary_manager.upload_image(temp_file_path, public_id=user_email)
                
                # Clean up the temporary file regardless of upload result
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)
                
                if cloudinary_result.success:
                    # Get the URL and public_id from the result
                    cloudinary_url = cloudinary_result.result["url"]
                    cloudinary_public_id = cloudinary_result.result["public_id"]
                    
                    # Update the database with the Cloudinary info and the source
                    update_result = self.update_profile_picture(cookie_int, cloudinary_public_id, source)
                    
                    if update_result.success:
                        return {
                            "message": "Profile picture uploaded to Cloudinary successfully", 
                            "success": True,
                            "url": cloudinary_url,
                            "public_id": cloudinary_public_id,
                            "email": user_email,
                            "source": source
                        }
                    else:
                        return {"message": update_result.msg, "success": False}
                else:
                    return {
                        "message": f"Failed to upload to Cloudinary: {cloudinary_result.msg}", 
                        "success": False
                    }
                    
            except Exception as e:
                # Clean up any temporary files
                if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
                    os.remove(temp_file_path)
                    
                return {"message": f"Error saving file: {str(e)}", "success": False}
        
        except Exception as e:
            traceback.print_exc()
            return {"message": f"Server error: {str(e)}", "success": False}

    def handle_get_profile_picture(self, email):
        """Handler for getting profile pictures - moved from service layer"""
        try:
            print(f"Received request for profile picture of: {email}")
            
            # Query the database to get the profile picture ID for this user
            member_info = self.get_member_profile_info(email)
            
            if member_info.success and member_info.result and member_info.result.get('profile_picture'):
                # Get the Cloudinary public_id from the database
                cloudinary_public_id = member_info.result.get('profile_picture')
                print(f"Found profile picture ID in database: {cloudinary_public_id}")
                
                # Initialize Cloudinary with credentials
                cloudinary_manager = CloudinaryProfilePictureManager(
                    CLOUDINARY_CLOUD_NAME, 
                    CLOUDINARY_API_KEY, 
                    CLOUDINARY_API_SECRET
                )
                
                # Get the URL from Cloudinary
                cloudinary_url = cloudinary_manager.get_profile_picture_url(cloudinary_public_id)
                
                if cloudinary_url:
                    print(f"Redirecting to Cloudinary URL: {cloudinary_url}")
                    # Return the Cloudinary URL for redirect
                    return {"success": True, "redirect_url": cloudinary_url}
                else:
                    print(f"Failed to generate Cloudinary URL for: {cloudinary_public_id}")
            else:
                print(f"No profile picture found for {email} or database query failed")
                if not member_info.success:
                    print(f"Database query error: {member_info.msg}")
            
            # If no Cloudinary profile picture found, generate a default avatar
            try:
                print(f"Generating default avatar for: {email}")
                
                # Create a simple colored square with the first letter of the email
                img_size = 200
                img = Image.new('RGB', (img_size, img_size), color=(73, 109, 137))
                
                # Add a letter if possible
                if email and len(email) > 0:
                    draw = ImageDraw.Draw(img)
                    letter = email[0].upper()
                    
                    # Try to load a font, fall back to default if not available
                    try:
                        font = ImageFont.truetype("arial.ttf", 100)
                    except IOError:
                        font = ImageFont.load_default()
                    
                    # Get text size to center it
                    try:
                        text_width = draw.textlength(letter, font=font)
                        text_height = font.getbbox(letter)[3]
                    except AttributeError:
                        # Fallback for older PIL versions
                        text_width = font.getsize(letter)[0]
                        text_height = font.getsize(letter)[1]
                    
                    position = ((img_size - text_width) / 2, (img_size - text_height) / 2)
                    draw.text(position, letter, font=font, fill=(255, 255, 255))
                
                # Convert PIL Image to bytes
                img_io = io.BytesIO()
                img.save(img_io, 'PNG')
                img_io.seek(0)
                
                print(f"Generated default avatar successfully")
                return {"success": True, "default_avatar": img_io}
                
            except Exception as e:
                print(f"Error generating default avatar: {e}")
                # If PIL fails, return a transparent pixel as fallback
                return {"success": False, "error": str(e)}
            
        except Exception as e:
            traceback.print_exc()
            print(f"Error retrieving profile picture: {e}")
            return {"success": False, "error": str(e)}

    def handle_fetch_google_profile_picture(self, request_data):
        """Handler for fetching Google profile pictures - moved from service layer"""
        try:
            print(f"Received fetch_google_profile_picture request: {request_data.keys()}")
            
            if 'cookie' not in request_data or 'tokenId' not in request_data:
                return {
                    "message": "Missing required fields (cookie, tokenId)",
                    "success": False
                }
            
            # Get the source parameter (defaults to 'google')
            source = request_data.get('source', 'google')
            print(f"Using source: {source}")
            
            try:
                cookie = int(request_data["cookie"])
                print(f"Converted cookie to int: {cookie}")
            except (ValueError, TypeError) as e:
                print(f"Failed to convert cookie to int: {str(e)}")
                return {
                    "message": f"Invalid cookie format: {str(e)}",
                    "success": False
                }
            
            # Get the session to verify it's valid
            session_res = self.get_session_member(cookie)
            if not session_res.success:
                print(f"Invalid session: {session_res.msg}")
                return {
                    "message": f"Invalid session: {session_res.msg}",
                    "success": False
                }
                
            email = session_res.result.user_name
            print(f"Session validated for user: {email}")
            
            # Use the server method to fetch the profile picture
            print(f"Calling fetch_profile_picture_from_google with token length: {len(request_data['tokenId']) if request_data['tokenId'] else 0}")
            result = self.fetch_profile_picture_from_google(request_data["tokenId"], source)
            
            if result.success:
                print(f"Successfully fetched profile picture: {result.result}")
                return {
                    "message": "Profile picture fetched successfully",
                    "success": True,
                    "url": result.result.get("url"),
                    "public_id": result.result.get("public_id"),
                    "email": email,
                    "source": source
                }
            
            print(f"Failed to fetch profile picture: {result.msg}")
            return {
                "message": result.msg,
                "success": False
            }
            
        except Exception as e:
            print(f"Error fetching Google profile picture: {str(e)}")
            traceback.print_exc()
            return {
                "message": f"Error fetching Google profile picture: {str(e)}",
                "success": False
            }

    def handle_get_profile_source(self, request_args):
        """Handler for getting profile source - moved from service layer"""
        try:
            # Get cookie from query parameters
            if 'cookie' not in request_args:
                return {"message": "Authentication required", "success": False}
                
            try:
                cookie = int(request_args.get("cookie"))
            except (ValueError, TypeError) as e:
                return {"message": f"Invalid cookie format: {str(e)}", "success": False}
                
            # Get session information
            res = self.get_session_member(cookie)
            if not res.success:
                return {"message": res.msg, "success": False}
                
            # Get the user email from the session
            session = res.result
            user_email = session.user_name
            
            # Get the profile source from the database
            profile_info = self.get_member_profile_info(user_email)
            
            if profile_info.success:
                return {
                    "message": "Profile source retrieved successfully",
                    "success": True,
                    "source": profile_info.result.get('profile_picture_source', 'none'),
                    "has_picture": profile_info.result.get('has_picture', False)
                }
            else:
                return {"message": profile_info.msg, "success": False}
                
        except Exception as e:
            traceback.print_exc()
            return {"message": f"Server error: {str(e)}", "success": False}