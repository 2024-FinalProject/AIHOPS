from Domain.src.Server import Server
import random


class Facade:
    def __init__(self, server=None):
        self.server = server
        if self.server is None:
            self.server = Server()

        self.map = {}  # username: cookie
        self.users = {
            "Alice": ["Alice@test.com", "password123"],
            "Bob": ["Bob@test.com", "password123"],
            "Admin": ["admin@admin.com", "admin"],
        }

    def setup_server(self):
        """Initialize server with mocks - for compatibility with AdminTests"""
        # Server is already initialized in __init__, this is for compatibility
        pass

    def register_and_verify(self, server, cookie, email, passwd):
        res = server.register(cookie, email, passwd)
        if not res.success:
            return res
        return server.verify(cookie, email, passwd, "1234")

    def get_cookie(self):
        res = self.server.enter()
        if not res.success:
            raise Exception(f"failed to get cookie: {res.msg}")
        cookie = res.result.cookie
        return cookie

    def _find_cookie(self, actor):
        cookie = self.map.get(actor, None)
        if cookie is None:
            raise Exception(f"failed to find cookie: {actor}")
        return cookie

    def _register_and_login_user(self, actor):
        """Register and login a user, storing their cookie"""
        if actor not in self.users:
            raise Exception(f"Unknown user: {actor}")

        email, password = self.users[actor]

        # Handle admin separately
        if actor == "Admin":
            enter_res = self.server.enter()
            if enter_res.success:
                cookie = enter_res.result.cookie
                login_res = self.server.login(cookie, email, password)
                if login_res.success:
                    self.map[actor] = cookie
                    return cookie
            raise Exception(f"Admin login failed")

        # Regular user registration flow
        enter_res = self.server.enter()
        if not enter_res.success:
            raise Exception(f"Failed to enter for {actor}: {enter_res.msg}")

        cookie = enter_res.result.cookie

        # Register user
        register_res = self.server.register(cookie, email, password)
        if not register_res.success:
            raise Exception(f"Failed to register {actor}: {register_res.msg}")

        # Verify user
        verify_res = self.server.verify(cookie, email, password, "1234")
        if not verify_res.success:
            raise Exception(f"Failed to verify {actor}: {verify_res.msg}")

        # Login user
        login_res = self.server.login(cookie, email, password)
        if not login_res.success:
            raise Exception(f"Failed to login {actor}: {login_res.msg}")

        self.map[actor] = cookie
        return cookie

    def register_and_verify_self(self, email, passwd):
        cookie = self.get_cookie()
        res = self.server.register(cookie, email, passwd)
        self.map[email] = cookie
        if not res.success:
            # Check if user already exists but is not verified
            if "is taken" in res.msg:
                # Try to login instead - user might already exist
                login_res = self.server.login(cookie, email, passwd)
                if login_res.success:
                    return  # User already exists and can login
            raise Exception(f"failed to register {email}: {res.msg}")

        # HERE'S THE KEY FIX: Get the actual code from MockGmailor
        gmailor = self.server.user_controller.gmailor

        # Try multiple verification strategies
        verify_success = False

        # Strategy 1: Try with "1234" (the default)
        verify_res = self.server.verify(cookie, email, passwd, "1234")
        if not verify_res.success:
            raise Exception(f"failed to verify {email}: {verify_res.msg}")
        
    
        if verify_res.success:
            verify_success = True
        else:
            # Strategy 2: Check if there are any codes in the MockGmailor and try them
            if hasattr(gmailor, "codes_users"):
                codes_dict = getattr(gmailor, "codes_users", {})

                # Handle ThreadSafeDict
                available_codes = []
                try:
                    if hasattr(codes_dict, "getKeys"):
                        # ThreadSafeDict has getKeys method
                        available_codes = codes_dict.getKeys()
                        print(f"Available codes via getKeys(): {available_codes}")
                    elif hasattr(codes_dict, "dict"):
                        # Access internal dict
                        available_codes = list(codes_dict.dict.keys())
                        print(f"Available codes via internal dict: {available_codes}")
                    elif hasattr(codes_dict, "keys"):
                        # Regular dict
                        available_codes = list(codes_dict.keys())
                        print(f"Available codes via keys(): {available_codes}")
                    else:
                        # Try to iterate directly
                        try:
                            available_codes = list(codes_dict)
                            print(f"Available codes via iteration: {available_codes}")
                        except:
                            print("Could not get keys from codes_dict")
                except Exception as e:
                    print(f"Error getting codes: {e}")

                # Try each available code
                available_codes_copy = list(
                    available_codes
                )  # Make a copy to avoid iteration issues
                for code in available_codes_copy:
                    print(f"Trying verification with code: {code}")
                    verify_res = self.server.verify(cookie, email, passwd, str(code))
                    if verify_res.success:
                        verify_success = True
                        print(f"Verification successful with code: {code}")
                        break

        if not verify_success:
            # Last resort: try some common codes
            common_codes = ["1234", "123456", "0000", "verification"]
            print(f"Trying common codes: {common_codes}")
            for code in common_codes:
                verify_res = self.server.verify(cookie, email, passwd, code)
                if verify_res.success:
                    verify_success = True
                    print(f"Verification successful with common code: {code}")
                    break

        if not verify_success:
            raise Exception(
                f"failed to verify {email} with any available code: {verify_res.msg}"
            )
    
    def accept_terms(self, email):
        res = self.server.accept_terms(email)
        if not res.success:
            raise Exception(f"failed to accept terms: {res.msg}")
        return res

    def register_verify_login(self, email, passwd):
        try:
            self.register_and_verify_self(email, passwd)
        except Exception as e:
            # If registration fails because user exists, try to just login
            if "is taken" in str(e):
                cookie = self.get_cookie()
                self.map[email] = cookie
                res = self.server.login(cookie, email, passwd)
                if res.success:
                    return  # Successfully logged in existing user
            raise e  # Re-raise if it's a different error

        res = self.server.login(self._find_cookie(email), email, passwd)
        if not res.success:
            raise Exception(f"failed to login {email}: {res.msg}")
        
    def login(self, email, passwd):
        cookie = self._find_cookie(email)
        res = self.server.login(cookie, email, passwd)
        if not res.success:
            raise Exception(f"failed to login {email}: {res.msg}")
        return res.result

    def create_project(self, actor, use_def_factors, p_name, p_desc):
        # Handle both email and username lookup
        if "@" not in actor:
            # It's a username, convert to email
            actor = self.users.get(actor, [actor])[0]

        cookie = self._find_cookie(actor)
        res = self.server.create_project(cookie, p_name, p_desc, use_def_factors)
        if not res.success:
            raise Exception(f"failed to create project: {res.msg}")
        # need to return projects id
        return res.result

    def add_factor(
        self, actor, pid, factor_name, factor_desc, scales_desc, scales_explanation
    ):
        # Handle both email and username lookup
        if "@" not in actor:
            # It's a username, convert to email
            actor = self.users.get(actor, [actor])[0]

        cookie = self._find_cookie(actor)
        res = self.server.add_project_factor(
            cookie, pid, factor_name, factor_desc, scales_desc, scales_explanation
        )
        if not res.success:
            raise Exception(f"failed to update factor: {res.msg}")
        # need to return factors id
        return res.result.fid

    def update_factor(
        self,
        actor,
        fid,
        pid,
        apply_to_all_inDesign,
        name,
        desc,
        scales_desc,
        scales_explanation,
    ):
        # Handle both email and username lookup
        if "@" not in actor:
            # It's a username, convert to email
            actor = self.users.get(actor, [actor])[0]

        cookie = self._find_cookie(actor)
        res = self.server.update_factor(
            cookie,
            fid,
            pid,
            name,
            desc,
            scales_desc,
            scales_explanation,
            apply_to_all_inDesign,
        )
        if not res.success:
            raise Exception(f"failed to update factor: {res.msg}")
        # need to return updated factors id
        return res.result.fid

    def get_actors_factor_pool(self, actor):
        # Handle both email and username lookup
        if "@" not in actor:
            # It's a username, convert to email
            actor = self.users.get(actor, [actor])[0]

        cookie = self._find_cookie(actor)
        res = self.server.get_factor_pool_of_member(cookie)
        if not res.success:
            raise Exception(f"failed to {actor}'s factor pool: {res.msg}")
        return res.result

    def get_projects_factors(self, actor, pid):
        # Handle both email and username lookup
        if "@" not in actor:
            # It's a username, convert to email
            actor = self.users.get(actor, [actor])[0]

        cookie = self._find_cookie(actor)
        res = self.server.get_project_factors(cookie, pid)
        if not res.success:
            raise Exception(
                f"failed to get {actor}'s projects: {pid}, factors: {res.msg}"
            )
        return res.result

    def clear_db(self):
        self.server.clear_db()

    def insert_factor_from_pool(self, actor, fid, pid):
        # Handle both email and username lookup
        if "@" not in actor:
            # It's a username, convert to email
            actor = self.users.get(actor, [actor])[0]

        cookie = self._find_cookie(actor)
        res = self.server.set_project_factors(cookie, pid, [fid])
        if not res.success:
            raise Exception(
                f"failed to set {actor}'s projects: {pid}, factors: {res.msg}"
            )
        return True

    def create_and_publish_project_def_factors(self, actor, name, desc, members=None):
        # Handle both email and username lookup
        if "@" not in actor:
            # It's a username, convert to email
            actor = self.users.get(actor, [actor])[0]

        cookie = self._find_cookie(actor)
        pid = self.create_project(actor, True, name, desc)
        self.server.confirm_project_factors(cookie, pid)

        # Set default severity factors
        severities = [1, 2, 3, 4, 5]
        severity_res = self.server.set_project_severity_factors(cookie, pid, severities)
        if severity_res.success:
            self.server.confirm_project_severity_factors(cookie, pid)

        # Add members if provided
        if members:
            if isinstance(members, str):
                members = [members]
            for member in members:
                # Ensure the member is registered
                if member not in self.map:
                    self._register_and_login_user(member)
                # Use email from users dict
                member_email = self.users.get(member, [member])[0]
                add_member_res = self.server.add_member(cookie, pid, member_email)
                if not add_member_res.success:
                    print(
                        f"Warning: Could not add member {member}: {add_member_res.msg}"
                    )

        res = self.server.publish_project(cookie, pid)
        if not res.success:
            raise Exception(f"failed to publish {actor}'s project: {pid}")
        return pid

    def _check_res(self, res, msg):
        if not res.success:
            raise Exception(msg)

    def vote(self, actor, pid, factor_vote, severity_vote):
        cookie = self._find_cookie(actor)
        factors = self.server.get_project_factors(cookie, pid)
        for idx, factor in enumerate(factors.result):
            res = self.server.vote_on_factor(
                cookie, pid, factor["id"], factor_vote[idx]
            )
            self._check_res(
                res, f"failed to vote on factor {factor_vote[idx]}: {res.msg}"
            )
        res = self.server.vote_severities(cookie, pid, severity_vote)
        self._check_res(res, f"failed to vote on severities {severity_vote}: {res.msg}")
        return True

    def get_score(self, actor, pid, weights=None):
        cookie = self._find_cookie(actor)
        if not weights:
            weights = {}
            factors = self.server.get_project_factors(cookie, pid).result
            if not factors:
                raise Exception(f"failed to get factors for project {pid}")
            # Check if factors is a response object or a list
            if hasattr(factors, "success") and not factors.success:
                raise Exception(
                    f"failed to get factors for project {pid}: {factors.msg}"
                )
            # Handle case where factors might be a response object
            factor_list = factors if isinstance(factors, list) else factors
            for i in range(len(factor_list)):
                weights[str(factor_list[i]["id"])] = random.randint(1, 10)

        res = self.server.get_score(cookie, pid, weights)
        self._check_res(res, f"failed to get score: {res.msg}")
        return res.result

    # Admin-specific methods
    def admin_delete_default_factor(self, factor_id):
        """Admin action to delete default factor"""
        admin_cookie = self._find_cookie("Admin")
        return self.server.admin_remove_default_factor(admin_cookie, factor_id)

    def admin_get_default_factors(self):
        """Admin action to get default factors"""
        admin_cookie = self._find_cookie("Admin")
        return self.server.admin_fetch_default_factors(admin_cookie)

    def vote_on_factor(self, actor, pid, factor_id, score):
        """Vote on a specific factor"""
        cookie = self._find_cookie(actor)
        return self.server.vote_on_factor(cookie, pid, factor_id, score)

    def vote_severities(self, actor, pid, severity_votes):
        """Vote on severities"""
        cookie = self._find_cookie(actor)
        return self.server.vote_severities(cookie, pid, severity_votes)

    def get_project_score(self, actor, pid, weights=None):
        """Get project score - alias for get_score for compatibility"""
        return self.get_score(actor, pid, weights)

    def admin_add_default_factor(self, name, desc, scales_desc, scales_explanation):
        """Admin action to add default factor"""
        admin_cookie = self._find_cookie("Admin")
        return self.server.admin_add_default_factor(
            admin_cookie, name, desc, scales_desc, scales_explanation
        )

    def admin_update_default_severity_factors(self, severity_data):
        """Admin action to update default severity factors"""
        admin_cookie = self._find_cookie("Admin")
        return self.server.admin_update_default_severity_factors(
            admin_cookie, severity_data
        )

    def admin_fetch_default_severity_factors(self):
        """Admin action to fetch default severity factors"""
        admin_cookie = self._find_cookie("Admin")
        return self.server.admin_fetch_default_severity_factors(admin_cookie)
