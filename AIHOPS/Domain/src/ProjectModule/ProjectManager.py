from Domain.src.DS.FactorsPool import FactorsPool
from Domain.src.DS.IdMaker import IdMaker
from Domain.src.DS.ThreadSafeDict import ThreadSafeDict
from Domain.src.DS.ThreadSafeDictWithListValue import ThreadSafeDictWithListValue
from Domain.src.Loggs.Response import ResponseSuccessObj, ResponseSuccessMsg, ResponseFailMsg, Response
from Domain.src.ProjectModule.Project import Project



class ProjectManager():
    def __init__(self, db_access):
        self.projects = ThreadSafeDict()                  # {p_id: Project}
        self.owners = ThreadSafeDictWithListValue()         # {email: [projects]}
        self.pending_requests = ThreadSafeDictWithListValue()           # {email: [projects]}
        self.project_id_maker = IdMaker()
        self.factor_pool = FactorsPool()

    def _verify_unique_project(self, actor, name, desc):
        """raises error if there is active project with same name and description"""
        projects = self.owners.get(actor)
        if projects is None:
            return
        tmp = Project(-999, name, desc, actor)
        for proj in projects:
            if proj.is_published() and proj == tmp:
                raise NameError("Duplicate Project")

    def _verify_owner(self, pid, actor):
        projects = self.owners.get(actor)
        found = False
        for proj in projects:
            if proj.pid == pid:
                return proj
        raise NameError(f"actor {actor} not owner of project {pid}")


    # ------------  Project Creation ------------------------

    def create_project(self, name, description, owner, is_default_factors=True):
        if not name or name == "":
            return ResponseFailMsg("Name cannot be empty")
        if not description or description == "":
            return ResponseFailMsg("Description cannot be empty")
        # check valid name and description for founder (cant have 2 published projects with same name and desc)
        self._verify_unique_project(owner, name, description)
        # create Project
        pid = self.project_id_maker.next_id()
        project = Project(pid, name, description, owner, is_default_factors)
        # add to lists
        self.projects.insert(pid, project)
        self.owners.insert(owner, project)
        return ResponseSuccessObj(f"actor: {owner} sccessfully created project: {pid, name, description}", pid)

    def add_project_factor(self, pid, actor, factor_name, factor_desc):
        """ adds of factor to a project"""
        # check valid project, and owned by owner
        project = self._verify_owner(pid, actor)
        factor = self.factor_pool.add_factor(actor, factor_name, factor_desc)
        project.add_factor(factor)
        return ResponseSuccessMsg(f"actor: {actor} added factor {factor.name} to project {project.name}")

    def add_factors(self, pid, actor, factors):
        """ adds factor list to project: list of tuples (name, description)"""
        project = self._verify_owner(pid, actor)
        fails = ""
        success = ""
        for factor_data in factors:
            try:
                factor = self.factor_pool.add_factor(actor, factor_data[0], factor_data[1])
                project.add_factor(factor)
                success += f"actor: {actor} added factor {factor.name} to project {project.name}"
            except Exception as e:
                fails += f"factor {factor_data[0]} failed to add : {e}\n"
        if len(fails) > 0:
            return ResponseFailMsg(fails)
        return ResponseSuccessMsg(success)

    def delete_factor(self, pid, actor, fid):
        project = self._verify_owner(pid, actor)
        return project.remove_factor(fid)

    def delete_factor_from_pool(self, fid, actor):
        # check if any of the projects founded by actor have the factor, if so fail
        if fid < 0:
            raise NameError(f"factor {fid} is default and cant be removed")
        projects = self.owners.get(actor)
        projects_containing_factor = []
        for proj in projects:
            if proj.has_factor(fid):
                projects_containing_factor.append(proj.pid)
        if len(projects_containing_factor) > 0:
            Response(False, "factor appears in projects", projects_containing_factor, False)
        else:
            return self.factor_pool.remove_factor(actor, fid)


    def set_severity_factors(self, pid, actor, severities):
        """ expects 5 severity factors, overrides existing"""
        project = self._verify_owner(pid, actor)
        return project.set_severity_factors(severities)


    def update_project_name_and_desc(self, pid, actor, name, desc):
        project = self._verify_owner(pid, actor)
        project.update_name(name)
        project.update_name(desc)
        return ResponseSuccessMsg(f"{pid}: updated name and desc to {project.name}, {project.desc}")

    # TODO: add to server
    def get_project_progress_for_owner(self, pid, actor):
        """return {name: bool , desc: bool, factors: amount, d_score:bool, invited: bool}"""
        project = self._verify_owner(pid, actor)
        return project.get_progress_for_owner()

    # ----------------  Member Control ----------------

    def _add_member_after_verifying_owner(self, project, member):
        if project.is_published():
            self.pending_requests.insert(member, project.id)
        else:
            project.add_member_to_invite(member)

    def add_member(self, actor, pid, member):
        """adds project to member pendings"""
        project = self._verify_owner(pid, actor)
        return ResponseSuccessMsg(f"members: {member} pending request added for project {pid}: {project.name}")


    def add_members(self, actor, pid, user_names):
        """ adds list of users to a project"""
        project = self._verify_owner(pid, actor)
        for member in user_names:
            self._add_member_after_verifying_owner(project, member)
        return ResponseSuccessMsg(f"members: {user_names} pending requests added for project {pid}: {project.name}")

    def remove_member(self, actor, pid, member):
        project = self._verify_owner(pid, actor)
        res = project.remove_member(member)
        if not res.success:
            # then member maybe in pendings
            try:
                self.pending_requests.pop(member, pid)
            except Exception:
                return ResponseFailMsg(f"failed removing member {member}, \npending: {Exception}\nproject: {res.msg}")
        return res

    # -------------- project Info -----------------
    def _find_project(self, pid):
        project = self.projects.get(pid)
        if project is None:
            raise NameError(f"project {pid} is not found")
        return project

    # TODO: add to server
    def get_project_factors(self, pid, actor):
        project = self._find_project(pid)
        return project.get_factors(actor)

    def get_members(self, pid, actor):
        project = self._verify_owner(pid, actor)
        return project.get_members()

    # TODO: add to server
    def get_project_severity_factors(self, pid, actor):
        project = self._verify_owner(pid, actor)
        return project.get_severities()

    # TODO: remove
    def get_project(self, pid):
        ...

    # TODO: add to server
    def get_pending_emails_for_project(self, pid, actor):
        project = self._verify_owner(pid, actor)
        if project.is_published():
            pending_emails = []
            for email, projects in self.pending_requests.dict.items():
                if pid in projects:  # Check if the project_id exists in the list of project_ids
                    pending_emails.append(email)  #If so, add the email to the result list
            return ResponseSuccessObj(f"pending requests for project {pid} : {pending_emails}", pending_emails)
        else:
            return project.get_members()

    # ---------------- Projects by Users ----------

    def get_pending_projects_for_email(self, actor):
        pids = self.pending_requests.get(actor)
        projects = []
        for pid in pids:
            projects.append(self._find_project(pid).to_dict())
        return ResponseSuccessObj(f"pending projects for actor {actor} : {pids}", projects)


    # TODO: add to server
    def get_projects_by_owner(self, actor):
        """returns all projects founded by actor"""
        projects = self.owners.get(actor)
        if projects is None:
            projects = []
        return ResponseSuccessObj(f"projects for actor {actor} : {projects}", projects)

    # TODO: add to server
    def get_projects_of_member(self, actor):
        """returns all projects actors participates in"""
        pids = self.projects.getKeys()
        projects = []
        pids_with_member = []
        for pid in pids:
            project = self._find_project(pid)
            if project.has_member(actor):
                projects.append(project)
                pids_with_member.append(pid)
        return ResponseSuccessObj(f"projects for actor {actor} : {pids_with_member}", projects)

    def _verify_member_in_pending(self, pid, actor):
        pending_pids = self.pending_requests.get(actor)
        if pid not in pending_pids:
            raise NameError(f"project {pid} is not pending for actor {actor}")

    def approve_member(self, pid, actor):
        """ member who approves to be in a project
        get out of pending and into project members"""
        self._verify_member_in_pending(pid, actor)
        project = self._find_project(pid)
        project.add_member(actor)
        self.pending_requests.remove(pid, actor)
        return ResponseSuccessMsg(f"member {actor} approved for project {pid}: {project.name}")

    def reject_member(self, pid, actor):
        self._verify_member_in_pending(pid, actor)
        self.pending_requests.remove(pid, actor)
        return ResponseSuccessMsg(f"member {actor} denied participation in project {pid}")


    # --------  data collection ----------------------
    # TODO: remove?
    def vote(self, pid, actor, factor_values, severity_factor_vals):
        ...

    def vote_on_factor(self, pid, actor, fid, score):
        project = self._find_project(pid)
        return project.vote_factor(actor, fid, score)

    def vote_severities(self, pid, actor, severities):
        project = self._find_project(pid)
        return project.vote_severiries(actor, severities)

    # ----------- Project Control -----------------------

    def publish_project(self, pid, actor):
        project = self._verify_owner(pid, actor)
        res = project.publish_project(actor)
        if not res.success:
            return res
        to_invite = res.result
        for member in to_invite:
            self._add_member_after_verifying_owner(project, member)
        return ResponseSuccessMsg(f"project {pid} published successfully, and members invited")


    def archive_project(self, pid, actor):
        """changes projects status to inActive"""
        project = self._verify_owner(pid, actor)
        return project.archive_project(actor)

    def get_score(self, pid, actor):
        project = self._verify_owner(pid, actor)
        return project.get_score()

    # TODO: add to server
    def duplicate_project(self, pid, actor):
        """creates project NTH"""
        pass

    # TODO: add to server
    def get_project_voting_progress(self):
        """returns percentage of voter"""
        # TODO: we allow partial voting, if member voted on 1 factor is it enough?
        pass

    # --------------- Data Base ------------------------

    def load_from_db(self):
        # load projects & set idmaker
        # load factor pool
        # load pendings
        # load archive??
        ...








