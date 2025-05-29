from threading import RLock

from DAL.DBAccess import DBAccess
from DAL.Objects import DBPendingRequests
from DAL.Objects.DBMember import DBMember
from Domain.src.DS.IdMaker import IdMaker
from Domain.src.Loggs.Response import Response, ResponseFailMsg, ResponseSuccessMsg, ResponseLogin, ResponseSuccessObj
from Domain.src.Users.Gmailor import Gmailor
from Tests.AcceptanceTests.mocks.MockGmailor import MockGmailor
from Domain.src.Users.Member import Member
from Domain.src.DS.ThreadSafeDict import ThreadSafeDict
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import os

ADMIN = ["admin@admin.com", "admin"]


class MemberController:
    def __init__(self, server, db_access):
        self.members = ThreadSafeDict()     # name: user
        if os.getenv("TEST_MODE") == "true":
            self.gmailor = MockGmailor()
        else:
            self.gmailor = Gmailor()
        self.register_lock = RLock()
        self.id_maker = IdMaker()
        self.db_access = db_access
        self.get_users_from_db()
        self.GOOGLE_CLIENT_ID = server.GOOGLE_CLIENT_ID


    def get_users_from_db(self):
        registered_users = self.db_access.load_all(DBMember)
        if registered_users is None:
            return 1
        last_id = 0
        for member_data in registered_users:
            member = Member(member_data.email, member_data.encrypted_passwd, member_data.id, True, member_data.verified, accepted_tac_version=member_data.accepted_tac_version)
            last_id = max(last_id, member.id + 1)
            self.members.insert(member.email, member)
        self.id_maker.start_from(last_id)

    def register(self, email, passwd, accepted_tac_version=-1):
        # verify username is available
        # add to users
        with self.register_lock:
            member = self.members.get(email)
            if member is not None and member.verified:
                return Response(False, f'username {email} is taken', None, False)

            if member is not None:
                if self.gmailor.is_member_verifiable(email):
                    return Response(False, f'username {email} is taken', None, False)
                else:
                    # delete user
                    res = self.db_access.delete_obj_by_query(DBMember, {"email": email})
                    if not res.success:
                        return res

            uid = self.id_maker.next_id()
            member = Member(email, passwd, uid, accepted_tac_version=accepted_tac_version)
            # insert to db:
            res = self.db_access.insert(DBMember(uid, email, member.encrypted_passwd, accepted_tac_version=accepted_tac_version))
            if not res.success:
                return res
            self.members.insert(email, member)

        self.gmailor.register(email)
        return Response(True, f'new member {email} has been registered', member, False)

    def verify(self, email, passwd, code):
        # verify user exists
        member = self.members.get(email)
        if member is None:
            return Response(False, f'incorrect username or password', None, False)
        # verify correct passwd
        member.verify_passwd(passwd)
        res = self.gmailor.verify(email, code)
        if not res.success:
            return res
        res = self.db_access.update_by_query(DBMember, {"email": email}, {"verified": True})
        if not res.success:
            return res
        member.verify()
        return res

    def verify_automatic(self, token):
        res = self.gmailor.verify_automatic(token)
        email = res.result
        member = self.members.get(email)
        res = self.db_access.update_by_query(DBMember, {"email": email}, {"verified": True})
        if not res.success:
            return res
        member.verify()
        return res

    def _admin_login(self, user, passwd):
        if user == ADMIN[0] and passwd == ADMIN[1]:
            return True

    def login(self, email, passwd):
        # Handle admin login
        if self._admin_login(email, passwd):
            response = ResponseSuccessMsg("Admin logged in successfully")
            response.is_admin = True
            response.accepted_tac_version = -1  # Default value
            return response
        
        # Check if member exists
        member = self.members.get(email)
        if member is None:
            return ResponseFailMsg(f"Member {email} not found - {self.members.size()} members registered")
            # return ResponseFailMsg("Incorrect Member")
        # TODO
        
        # Verify login
        try:
            # Check if member is verified
            if not member.verified:
                return ResponseFailMsg(f"{email} is not verified")
            
            # Check if email matches
            if member.email != email:
                return ResponseFailMsg("Incorrect username or password")
            
            # Verify password
            member.verify_passwd(passwd)
            
            # Set logged in flag
            member.logged_in = True
            
            # Create standardized response
            response = ResponseSuccessMsg(f"User {email} logged in successfully")
            
            # Set additional attributes needed by clients
            response.is_admin = False
            response.accepted_tac_version = getattr(member, 'accepted_tac_version', -1)
            
            return response
            
        except Exception as e:
            return ResponseFailMsg(str(e))

    def isValidMember(self, email):
        member = self.members.get(email)
        if member is None:
            return ResponseFailMsg(f'invalid user: {email}')
        return ResponseSuccessMsg(f'member {email} is valid')
    
    def update_password(self, email, old_passwd, new_passwd):
        with self.register_lock:
            member = self.members.get(email)
            if member is None:
                return ResponseFailMsg(f'invalid user: {email}')
            temp_res = member.update_password(email, old_passwd, new_passwd)
            if(temp_res.success == False):
                return temp_res
            updated_member = Member(email, new_passwd, member.id)
            #update db
            res = self.db_access.update(DBMember(member.id, email, updated_member.encrypted_passwd))
            if not res.success:
                return res
            self.members.insert(email, updated_member)
        return ResponseSuccessMsg(f'password updated for {email}')

    def _verify_valid_member(self, email):
        member = self.members.get(email)
        if member is None:
            raise Exception(f'invalid user: {email}')

    def start_password_recovery(self, email):
        self._verify_valid_member(email)
        self.gmailor.start_password_recovery(email)
        return ResponseSuccessMsg(f'Started password recovery for {email}, you have 5 minutes to make a new password - please check your email')

    def recover_password(self, email, passwd, code):
        self._verify_valid_member(email)
        self.gmailor.recover_password(email, code)
        member = self.members.get(email)
        old_passwd = member.encrypted_passwd
        member.update_password(passwd)
        res = self.db_access.update_by_query(DBMember, {"email": email}, {"encrypted_passwd": member.encrypted_passwd})
        if not res.success:
            member.encrypted_passwd = old_passwd
            return ResponseFailMsg(f'password recovery failed for {email}')
        return ResponseSuccessMsg(f'password recovery for {email} has been successful')
    
    def register_google_user(self, email, passwd, accepted_tac_version=-1):
        """Register a user that authenticated through Google"""
        with self.register_lock:
            member = self.members.get(email)
            if member is not None and member.verified:
                # User already exists and is verified
                if not hasattr(member, 'is_google_user') or not member.is_google_user:
                    member.is_google_user = True
                    # Update database record to mark as Google user
                    res = self.db_access.update_by_query(DBMember, {"email": email}, {"is_google_user": True})
                    if not res.success:
                        return res
                return Response(True, f'User {email} already exists', member, False)

            if member is not None:
                # User exists but is not verified, update the user to be verified
                member.verify()
                member.is_google_user = True
                res = self.db_access.update_by_query(DBMember, {"email": email}, 
                                                {"verified": True, "is_google_user": True})
                if not res.success:
                    return res
                return Response(True, f'User {email} has been verified', member, False)

            # User doesn't exist, create a new one
            uid = self.id_maker.next_id()
            # Create a new member and set is_google_user to True
            member = Member(email, passwd, uid, from_db=False, verified=True, is_google_user=True, accepted_tac_version=accepted_tac_version)
            
            # Insert to db with is_google_user flag set to True
            res = self.db_access.insert(DBMember(uid, email, member.encrypted_passwd, is_verified=True, is_google_user=True, accepted_tac_version=accepted_tac_version))
            if not res.success:
                return res
            
            self.members.insert(email, member)
            
            return Response(True, f'Google user {email} has been registered', member, False)

    def login_with_google(self, email):
        """Login a user that authenticated through Google without password check"""
        member = self.members.get(email)
        if member is None:
            return ResponseLogin(False, f'User {email} not found')
        
        if not member.verified:
            # Update verification status for the Google user
            member.verify()
            member.is_google_user = True
            res = self.db_access.update_by_query(DBMember, {"email": email}, {"verified": True, "is_google_user": True})
            if not res.success:
                return ResponseLogin(res.success, res.msg)
        elif not hasattr(member, 'is_google_user') or not member.is_google_user:
            # Update existing user to mark as Google user
            member.is_google_user = True
            res = self.db_access.update_by_query(DBMember, {"email": email}, {"is_google_user": True})
            if not res.success:
                return ResponseLogin(res.success, res.msg)
        
        # Use the new login_with_google method that bypasses password verification
        return member.login_with_google(email)


    def delete_account(self, email):
        """Delete this member and all their projects."""
        # 1) verify the member exists
        member = self.members.get(email)
        if member is None:
            return ResponseFailMsg(f"invalid user: {email}")

        # 2) perform atomic DB deletion
        res = self.db_access.delete_member_and_projects(email)
        if not res.success:
            return res

        # 3) clean up in-memory state
        self.members.pop(email)
        return ResponseSuccessMsg(f"Member {email} and all their projects have been deleted.")

    def accept_terms(self, email, version):
        self._verify_valid_member(email)
        member = self.members.get(email)
        # print(f"Member!!!!!! {email}")
        # print(f"Version!!!!!! {version}")
        res = self.db_access.update_by_query(DBMember, {"email": email}, {"accepted_tac_version": version})
        if not res.success:
            return res
        member.accepted_tac_version = version
        return ResponseSuccessMsg(f'Accepted terms for {email} version {version}')
    
    def fetch_profile_picture_from_google(self, token_id, source='google'):
        """
        Fetches the profile picture from Gmail/Google account using OAuth token
        and uploads it to Cloudinary
        """
        try:
            if not hasattr(self, 'GOOGLE_CLIENT_ID') or not self.GOOGLE_CLIENT_ID:
                # Emergency fallback if the attribute is still missing
                self.GOOGLE_CLIENT_ID = "778377563471-10slj8tsgra2g95aq2hq48um0gvua81a.apps.googleusercontent.com"
                print(f"Using emergency fallback Google Client ID: {self.GOOGLE_CLIENT_ID}")
                
            print(f"Attempting to fetch Google profile picture with token of length: {len(token_id) if token_id else 0}")
            print(f"Using Google Client ID: {self.GOOGLE_CLIENT_ID}")
            
            # Verify the Google token
            id_info = id_token.verify_oauth2_token(
                token_id, google_requests.Request(), self.GOOGLE_CLIENT_ID
            )
            
            print(f"Token verification successful, issuer: {id_info.get('iss')}")
            
            if id_info['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                return ResponseFailMsg("Invalid token issuer")
            
            # Get user email from the token info
            email = id_info['email']
            print(f"Email from token: {email}")
            
            # Check if the token contains a picture URL
            if 'picture' in id_info:
                picture_url = id_info['picture']
                print(f"Found picture URL in token: {picture_url}")
                
                # Initialize Cloudinary with credentials from config
                from Domain.src.Users.CloudinaryProfilePictureManager import CloudinaryProfilePictureManager
                from Service.config import CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
                
                print(f"Initializing Cloudinary with cloud name: {CLOUDINARY_CLOUD_NAME}")
                cloudinary_manager = CloudinaryProfilePictureManager(
                    CLOUDINARY_CLOUD_NAME, 
                    CLOUDINARY_API_KEY, 
                    CLOUDINARY_API_SECRET
                )
                
                # Upload the image to Cloudinary directly from Google's URL
                print(f"Uploading image from Google URL to Cloudinary with public_id: {email}")
                upload_result = cloudinary_manager.upload_from_url(picture_url, public_id=email)
                
                if upload_result.success:
                    # Get the URL and public_id from the result
                    cloudinary_url = upload_result.result["url"]
                    cloudinary_public_id = upload_result.result["public_id"]
                    
                    print(f"Successfully uploaded to Cloudinary. URL: {cloudinary_url}, Public ID: {cloudinary_public_id}")
                    
                    # Update the database with the Cloudinary info and the source
                    member = self.members.get(email)
                    if member is not None:
                        print(f"Updating database for member {email} with profile picture: {cloudinary_public_id}")
                        # Update the member's profile picture information and source
                        update_result = self.db_access.update_by_query(
                            DBMember, 
                            {"email": email}, 
                            {
                                "profile_picture": cloudinary_public_id,
                                "profile_picture_source": source
                            }
                        )
                        
                        if update_result.success:
                            print(f"Database updated successfully")
                            # Important: Use ResponseSuccessObj instead of ResponseSuccessMsg for returning data
                            return ResponseSuccessObj("Profile picture uploaded to Cloudinary", {
                                "url": cloudinary_url,
                                "public_id": cloudinary_public_id
                            })
                        else:
                            print(f"Failed to update database: {update_result.msg}")
                            return ResponseFailMsg(f"Failed to update database with Cloudinary info: {update_result.msg}")
                    else:
                        print(f"Member not found: {email}")
                        return ResponseFailMsg(f"Member not found: {email}")
                else:
                    print(f"Failed to upload to Cloudinary: {upload_result.msg}")
                    return ResponseFailMsg(f"Failed to upload to Cloudinary: {upload_result.msg}")
            else:
                print("No profile picture found in the Google token")
                return ResponseFailMsg("No profile picture found in the user's Google account")
        
        except ValueError as e:
            print(f"Invalid Google token: {str(e)}")
            return ResponseFailMsg(f"Invalid Google token: {str(e)}")
        except Exception as e:
            import traceback
            print(f"Failed to fetch profile picture from Gmail: {str(e)}")
            traceback.print_exc()
            return ResponseFailMsg(f"Failed to fetch profile picture from Gmail: {str(e)}")

    def update_profile_picture(self, email, filename, source='upload'):
        """Updates the profile picture filename and source for a member"""
        try:
            # Skip session validation and work directly with the email
            member = self.members.get(email)
            if member is None:
                return ResponseFailMsg("Member not found")
            
            # Update the in-memory member object
            member.set_profile_picture(filename)
            
            # Update the database with both filename and source
            success = self.db_access.update_by_query(
                DBMember, 
                {"email": email}, 
                {
                    "profile_picture": filename,
                    "profile_picture_source": source
                }
            ).success
            
            if success:
                return ResponseSuccessMsg("Profile picture updated successfully")
            else:
                return ResponseFailMsg("Database update failed")
        except Exception as e:
            return ResponseFailMsg(f"Failed to update profile picture: {e}")

    def get_terms_and_conditions_version(self, email):
        """
        Returns the current version of the Terms and Conditions.
        This is a placeholder method that should be implemented to return the actual version.
        """
        # For now, we return a hardcoded version number
        actor = self.members.get(email)
        if actor is None:
            return ResponseFailMsg(f"Member {email} not found")
        return ResponseSuccessObj("Terms and Conditions version", actor.accepted_tac_version)