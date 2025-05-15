from Domain.src.Server import Server


class Facade:
    def __init__(self, server=None):
        self.server = server
        if self.server is None:
            self.server = Server()

        self.map = {} # username: cookie

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

    def register_and_verify_self(self, email, passwd):
        cookie = self.get_cookie()
        res = self.server.register(cookie, email, passwd)
        self.map[email] = cookie
        if not res.success:
            raise Exception(f"failed to register {email}: {res.msg}")
        verify_res = self.server.verify(cookie, email, passwd, "1234")
        if not verify_res.success:
            raise Exception(f"failed to verify {email}: {verify_res.msg}")

    def register_verify_login(self, email, passwd):
        self.register_and_verify_self(email, passwd)
        res = self.server.login(self._find_cookie(email), email, passwd)
        if not res.success:
            raise Exception(f"failed to login {email}: {res.msg}")

    def create_project(self, actor, use_def_factors, p_name, p_desc):
        cookie = self._find_cookie(actor)
        res = self.server.create_project(cookie, p_name, p_desc, use_def_factors)
        if not res.success:
            raise Exception(f"failed to create project: {res.msg}")
        # need to return projects id
        return res.result

    def add_factor(self, actor, pid, factor_name, factor_desc, scales_desc, scales_explanation):
        cookie = self._find_cookie(actor)
        res = self.server.add_project_factor(cookie, pid, factor_name, factor_desc, scales_desc, scales_explanation)
        if not res.success:
            raise Exception(f"failed to update factor: {res.msg}")
        # need to return factors id
        return res.result.fid

    def update_factor(self, actor, fid, pid, apply_to_all_inDesign, name, desc, scales_desc, scales_explenation):
        cookie = self._find_cookie(actor)
        res = self.server.update_factor(cookie, fid, pid, name, desc, scales_desc, scales_explenation, apply_to_all_inDesign)
        if not res.success:
            raise Exception(f"failed to update factor: {res.msg}")
        # need to return updated factors id
        return res.result.fid

    def get_actors_factor_pool(self, actor):
        cookie = self._find_cookie(actor)
        res = self.server.get_factor_pool_of_member(cookie)
        if not res.success:
            raise Exception(f"failed to {actor}'s factor pool: {res.msg}")
        return res.result

    def get_projects_factors(self, actor, pid):
        cookie = self._find_cookie(actor)
        res = self.server.get_project_factors(cookie, pid)
        if not res.success:
            raise Exception(f"failed to get {actor}'s projects: {pid}, factors: {res.msg}")
        return res.result

    def clear_db(self):
        self.server.clear_db()

    def insert_factor_from_pool(self, actor, fid, pid):
        cookie = self._find_cookie(actor)
        res = self.server.set_project_factors(cookie, pid, [fid])
        if not res.success:
            raise Exception(f"failed to set {actor}'s projects: {pid}, factors: {res.msg}")
        return True

    def create_and_publish_project_def_factors(self, actor, name, desc, members):
        cookie = self._find_cookie(actor)
        pid = self.create_project(actor, True, name, desc)
        self.server.confirm_project_factors(cookie, pid)
        self.server.confirm_project_severity_factors(cookie, pid)
        self.server.add_members(cookie, pid, members)
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
        for idx, factor in factors:
            res = self.server.vote_on_factor(cookie, pid, factor.fid, factor_vote[idx])
            self._check_res(res, f"failed to vote on factor {factor_vote[idx]}: {res.msg}")
        res = self.server.vote_severities(cookie, pid, severity_vote)
        self._check_res(res, f"failed to vote on severities {severity_vote}: {res.msg}")
        return True

    def get_score(self, actor, pid, weights=None):
        cookie = self._find_cookie(actor)
        if not weights:
            amount = len(self.get_projects_factors(actor, pid))
            weights = [1 for _ in range(amount)]
        res = self.server.get_score(cookie, pid, weights)
        self._check_res(res, f"failed to get score: {res.msg}")
        return res.result