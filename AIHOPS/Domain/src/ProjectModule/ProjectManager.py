from pathlib import Path
import sys
from threading import RLock
import json

from DAL.Objects.DBFactors import DBFactors
from DAL.Objects.DBPendingRequests import DBPendingRequests
from DAL.Objects.DBProject import DBProject
from DAL.Objects.DBProjectFactors import DBProjectFactors
from DAL.Objects.DBProjectMembers import DBProjectMembers
from Domain.src.DS.FactorsPool import FactorsPool
from Domain.src.DS.IdMaker import IdMaker
from Domain.src.DS.ThreadSafeDict import ThreadSafeDict
from Domain.src.DS.ThreadSafeDictWithListValue import ThreadSafeDictWithListValue
from Domain.src.Loggs.Response import (
    ResponseSuccessObj,
    ResponseSuccessMsg,
    ResponseFailMsg,
    Response,
)
from Domain.src.ProjectModule.Project import Project, load_default_severity_factors

from Domain.src.Users.Gmailor import Gmailor
from Domain.src.Users.MemberController import ADMIN


import os
from Domain.src.Users.MemberController import ADMIN

from Tests.AcceptanceTests.mocks.MockGmailor import MockGmailor


class ProjectManager:
    def __init__(self, db_access):
        self.research_projects = {}
        self.db_access = db_access
        self.projects = ThreadSafeDict()  # {p_id: Project}
        self.owners = ThreadSafeDictWithListValue()  # {email: [projects]}
        self.pending_requests = ThreadSafeDictWithListValue()  # {email: [projects]}
        self.project_id_maker = IdMaker()
        self.factor_pool = FactorsPool(self.db_access)
        self.load_from_db()
        if os.getenv("TEST_MODE") == "true":
            self.gmailor = MockGmailor()
        else:
            self.gmailor = Gmailor()
        self.project_lock = RLock()
        self.research_lock = RLock()

    def _verify_unique_project(self, actor, name, desc):
        """raises error if there is active project with same name and description"""
        projects = self.owners.get(actor)
        if projects is None:
            return
        for proj in projects:
            if proj.is_published() and [proj.name, proj.desc] == [name, desc]:
                raise NameError("Duplicate Project")

    def _check_if_research(self, pid, actor):
        print(f"actor: {actor}")
        if actor == ADMIN[0]:
            print("actor is indeed admin")
            with self.research_lock:
                proj = self.research_projects.get(pid)
                if proj is not None:
                    return proj
                print("project is not found")
        raise NameError(f"actor {actor} not owner of project {pid}")

    def _verify_owner(self, pid, actor):
        projects = self.owners.get(actor)
        found = False
        for proj in projects:
            if proj.pid == pid:
                return proj
        return self._check_if_research(pid, actor)

    def cleanup_member(self, member_email):
        """Remove all in-memory traces of this user’s projects and pending requests."""
        # Remove all projects they own from owners, projects, and research_projects
        owned_projects = self.owners.dict.pop(member_email, [])
        for proj in owned_projects:
            pid = proj.pid
            # Remove from the main projects map
            self.projects.dict.pop(pid, None)
            # If it was a research project, remove it too
            self.research_projects.pop(pid, None)

        return ResponseSuccessMsg(
            f"Cleaned up all traces of {member_email} from memory."
        )

    # ------------  Project Creation ------------------------

    def create_project(
        self, name, description, owner, is_default_factors=True, is_to_research=False
    ):
        if not name or name == "":
            return ResponseFailMsg("Name cannot be empty")
        if not description or description == "":
            return ResponseFailMsg("Description cannot be empty")
        # check valid name and description for founder (cant have 2 published projects with same name and desc)
        self._verify_unique_project(owner, name, description)
        # create Project
        pid = self.project_id_maker.next_id()
        project = Project(
            pid, name, description, owner, self.db_access, is_to_research=is_to_research
        )
        # add to lists
        self.projects.insert(pid, project)
        with self.project_lock:
            self.owners.insert(owner, project)
        msg = f"actor: {owner} sccessfully created project: {pid, name, description}"
        # default_factors:
        if is_default_factors:
            def_facts = self.factor_pool.get_default_factor_ids()
            res_facts = self.add_factors(pid, owner, def_facts)
            msg += res_facts.msg

        if is_to_research:
            with self.research_lock:
                self.research_projects[pid] = project
        return ResponseSuccessObj(msg, pid)

    def add_project_factor(
        self, pid, actor, factor_name, factor_desc, scales_desc, scales_exaplanation
    ):
        """adds of factor to a project"""
        # check valid project, and owned by owner
        project = self._verify_owner(pid, actor)
        factor = self._create_factor(
            actor, factor_name, factor_desc, scales_desc, scales_exaplanation
        )
        project.add_factor(factor)
        return ResponseSuccessObj(
            f"actor: {actor} added factor {factor.name} to project {project.name}",
            factor,
        )

    def _create_factor(
        self, actor, factor_name, factor_desc, scales_desc, scales_exaplanation
    ):
        """creates a new factor for actors factor pool"""
        if factor_name == "" or factor_desc == "":
            return ResponseFailMsg("factor name and description cannot be empty")
        factor = self.factor_pool.add_factor(
            actor, factor_name, factor_desc, scales_desc, scales_exaplanation
        )
        return factor

    def add_factors(self, pid, actor, factor_ids):
        project = self._verify_owner(pid, actor)
        fails = []
        success = []

        for factor_id in factor_ids:
            try:
                # Attempt to find the factor
                factor = self.factor_pool.find_factors(actor, factor_id)
                project.add_factor(factor)
                success.append(
                    f"actor: {actor} added factor {factor.name} to project {project.name}"
                )
            except Exception as e:
                # Use the factor_id in case `factor` is not defined
                fails.append(f"factor ID {factor_id} failed to add: {e}")

        if fails:
            return ResponseFailMsg("\n".join(fails))
        return ResponseSuccessMsg("\n".join(success))

    def delete_factor(self, pid, actor, fid):
        project = self._verify_owner(pid, actor)
        return project.remove_factor(fid)

    def delete_factor_from_pool(self, actor, fid):
        # check if any of the projects founded by actor have the factor, if so fail
        if fid < 0:
            raise NameError(f"factor {fid} is default and cant be removed")
        projects = self.owners.get(actor)
        projects_containing_factor = []
        for proj in projects:
            if proj.has_factor(fid):
                projects_containing_factor.append(proj.pid)
        if len(projects_containing_factor) > 0:
            return Response(
                False, "factor appears in projects", projects_containing_factor, False
            )
        else:
            return self.factor_pool.remove_factor(actor, fid)

    def set_severity_factors(self, pid, actor, severities):
        """expects 5 severity factors, overrides existing"""
        project = self._verify_owner(pid, actor)
        return project.set_severity_factors(severities)

    def update_project_name_and_desc(self, pid, actor, name, desc):
        project = self._verify_owner(pid, actor)
        if project.is_published():
            raise NameError("project is published and cannot be changed")
        project.update_name(name)
        project.update_desc(desc)
        return ResponseSuccessMsg(
            f"{pid}: updated name and desc to {project.name}, {project.desc}"
        )

    def get_project_progress_for_owner(self, pid, actor):
        """return {name: bool , desc: bool, factors: amount, d_score:bool, invited: bool}
        new: {voted_amount: int, member_count: int, pending_members: int}"""
        project = self._verify_owner(pid, actor)
        if project.is_published():
            pending_amount = len(self.get_pending_emails_for_project(pid, actor).result)
        else:
            pending_amount = len(project.get_to_invite().result)
        return ResponseSuccessObj(
            f"{actor}: progress for project {pid}",
            project.get_progress_for_owner(pending_amount),
        )

    def confirm_factors(self, pid, actor):
        project = self._verify_owner(pid, actor)
        return project.confirm_factors()

    def confirm_severity_factors(self, pid, actor):
        project = self._verify_owner(pid, actor)
        project.confirm_severity_factors()
        return ResponseSuccessMsg(
            f"{actor}: confirmed severity factors to {project.name}"
        )

    # ----------------  Member Control ----------------

    def _verify_not_duplicate_member(self, project, member):
        if (
            member in self.pending_requests.get(project.pid)
            or project.has_member(member)
            or project.to_invite_when_published.contains(member)
        ):
            raise Exception(
                f"member: {member} already member, or invite, or pending for project {project.pid}"
            )

    def _add_member_after_verifying_owner(self, project, member, persist=True):
        if project.archived:
            raise Exception("project already archived")
        db_instance = DBPendingRequests(project.pid, member)
        if persist:
            res = self.db_access.insert(db_instance)
            if not res.success:
                return res
        if not persist or res.success:
            try:
                if project.is_published():
                    self.pending_requests.insert(member, project.pid)
                    # send invite email
                    self.gmailor.send_email_invitation(
                        member, project.owner, project.name
                    )
                else:
                    project.add_member_to_invite(member)
            except Exception as e:
                if persist:
                    self.db_access.delete(db_instance)

    def add_member(self, actor, pid, member):
        """adds project to member pendings"""
        project = self._verify_owner(pid, actor)
        self._verify_not_duplicate_member(project, member)
        self._add_member_after_verifying_owner(project, member)
        return ResponseSuccessMsg(
            f"members: {member} pending request added for project {pid}: {project.name}"
        )

    def add_members(self, actor, pid, user_names):
        """adds list of users to a project"""
        project = self._verify_owner(pid, actor)
        for member in user_names:
            self._verify_not_duplicate_member(project, member)
            self._add_member_after_verifying_owner(project, member)
        return ResponseSuccessMsg(
            f"members: {user_names} pending requests added for project {pid}: {project.name}"
        )

    def _remove_project_member_from_db(self, pid, member):
        res1 = self.db_access.delete_obj_by_query(
            DBPendingRequests, {"project_id": pid, "email": member}
        )
        res2 = self.db_access.delete_obj_by_query(
            DBProjectMembers, {"project_id": pid, "member_email": member}
        )
        if not res1.success and not res2.success:
            raise Exception(f"project {pid} member {member} not found")

    def remove_member(self, actor, pid, member):
        project = self._verify_owner(pid, actor)
        self._remove_project_member_from_db(pid, member)

        res = project.remove_member(member)
        if not res.success:
            # then member maybe in pendings
            try:
                self.pending_requests.pop(member, pid)
                return ResponseSuccessMsg(
                    f"member {member} removed from project {pid} pendings"
                )
            except Exception as e:
                return ResponseFailMsg(
                    f"failed removing member {member}, \npending: {e}\nproject: {res.msg}"
                )
        return res

    # -------------- project Info -----------------
    def _find_project(self, pid):
        project = self.projects.get(pid)
        if project is None:
            raise NameError(f"project {pid} is not found")
        return project

    def get_project_factors(self, pid, actor):
        project = self._find_project(pid)
        factors = project.get_factors(actor)
        to_ret = []
        for factor in factors.result:
            to_ret.append(factor.to_dict())
        return ResponseSuccessObj(f"factors for project {pid}", to_ret)

    def get_members(self, pid, actor):
        """return only projects active members"""
        project = self._verify_owner(pid, actor)
        return project.get_members()

    def get_to_invite(self, pid, actor):
        """return only members that will be invited once the project will be published"""
        project = self._verify_owner(pid, actor)
        return project.get_to_invite()

    def get_project_severity_factors(self, pid, actor):
        project = self._verify_owner(pid, actor)
        return project.get_severity_factors()

    # TODO: remove
    def get_project(self, pid):
        return ResponseSuccessObj(self._find_project(pid))

    def _get_pending_emails_by_projects_list(self, pid):
        pending_emails = []
        for email, projects in self.pending_requests.dict.items():
            if pid in projects:
                pending_emails.append(email)
        return pending_emails

    def get_pending_emails_for_project(self, pid, actor):
        project = self._verify_owner(pid, actor)
        if project.is_published():
            pending_emails = self._get_pending_emails_by_projects_list(pid)
            return ResponseSuccessObj(
                f"pending requests for project {pid} : {pending_emails}", pending_emails
            )
        else:
            return project.get_members()

    def get_project_to_invite(self, pid, actor):
        project = self._verify_owner(pid, actor)
        project = self._find_project(pid)
        return project.get_to_invite()

    # ---------------- Projects by Users ----------

    def get_pending_projects_for_email(self, actor):
        pids = self.pending_requests.get(actor)
        projects = []
        for pid in pids:
            projects.append(self._find_project(pid).to_dict())
        return ResponseSuccessObj(
            f"pending projects for actor {actor} : {pids}", projects
        )

    def get_projects_by_owner(self, actor):
        """returns all projects founded by actor"""
        projects = self.owners.get(actor)
        ret = []
        if projects is None:
            projects = []
        for proj in projects:
            ret.append(proj.to_dict())
        return ResponseSuccessObj(f"projects for actor {actor} : {ret}", ret)

    def get_projects_of_member(self, actor):
        """returns all projects actors participates in"""
        # TODO: how to return projects, maybe only active projects
        pids = self.projects.getKeys()
        projects = []
        pids_with_member = []
        for pid in pids:
            project = self._find_project(pid)
            if project.has_member(actor) and project.is_published():
                projects.append(project.to_dict())
                pids_with_member.append(pid)
        return ResponseSuccessObj(
            f"projects for actor {actor} : {pids_with_member}", projects
        )

    def _verify_member_in_pending(self, pid, actor):
        pending_pids = self.pending_requests.get(actor)
        if pid not in pending_pids:
            raise NameError(f"project {pid} is not pending for actor {actor}")

    def approve_member(self, pid, actor):
        """member who approves to be in a project
        get out of pending and into project members"""
        self._verify_member_in_pending(pid, actor)
        project = self._find_project(pid)
        project.add_member(actor)

        db_project_member = DBProjectMembers(pid, actor)
        res = self.db_access.insert(db_project_member)
        if not res.success:
            project.remove_member(actor)
            self.db_access.delete(db_project_member)
            return res

        self.pending_requests.remove(actor, pid)
        res2 = self.db_access.delete_obj_by_query(
            DBPendingRequests, {"project_id": pid, "email": actor}
        )
        if not res2.success:
            self.db_access.insert(db_project_member)
            self.pending_requests.insert(actor, pid)
            return res2

        return ResponseSuccessMsg(
            f"member {actor} approved for project {pid}: {project.name}"
        )

    def reject_member(self, pid, actor):
        self._verify_member_in_pending(pid, actor)
        res = self.db_access.delete_obj_by_query(
            DBPendingRequests, {"project_id": pid, "email": actor}
        )
        if not res.success:
            self.pending_requests.insert(pid, actor)
        self.pending_requests.remove(actor, pid)
        return ResponseSuccessMsg(
            f"member {actor} denied participation in project {pid}"
        )

    def get_member_votes(self, pid, actor):
        project = self._find_project(pid)
        return project.get_member_votes(actor)

    def get_project_factors_votes(self, pid, actor):
        project = self._verify_owner(pid, actor)
        return project.get_project_factors_votes()

    # --------  data collection ----------------------
    # TODO: remove?
    def vote(self, pid, actor, factor_values, severity_factor_vals): ...

    def vote_on_factor(self, pid, actor, fid, score):
        project = self._find_project(pid)
        return project.vote_on_factor(actor, fid, score)

    def vote_severities(self, pid, actor, severities):
        project = self._find_project(pid)
        return project.vote_severities(actor, severities)

    # ----------- Project Control -----------------------

    def publish_project(self, pid, actor):
        project = self._verify_owner(pid, actor)
        self._verify_unique_project(actor, project.name, project.desc)
        res = project.publish()
        if not res.success:
            return res
        to_invite = res.result
        for member in to_invite:
            self._add_member_after_verifying_owner(project, member, False)
        return ResponseSuccessMsg(
            f"project {pid} published successfully, and members invited"
        )

    def archive_project(self, pid, actor):
        project = self._verify_owner(pid, actor)
        pending_emails = self._get_pending_emails_by_projects_list(pid)
        res = project.archive_project()
        if res.success:
            for email in pending_emails:
                self._remove_project_member_from_db(pid, email)
                self.pending_requests.remove(email, pid)
        return res

    def get_score(self, actor, pid, weights):
        project = self._verify_owner(pid, actor)
        pendings = self._get_pending_emails_by_projects_list(pid)
        return project.get_score(len(pendings), weights)

    def get_factor_pool(self, actor):
        factors = self.factor_pool.get_factors(actor)
        to_ret = []
        for factor in factors:
            to_ret.append(factor.to_dict())
        return ResponseSuccessObj(f"factors pool for user: {actor}", to_ret)

    def _get_projects_containing_factor(self, actor, fid):
        actors_projects = self.owners.get(actor)
        ps = []
        for project in actors_projects:
            if project.has_factor(fid):
                ps.append(project)
        return ps

    def get_owners_projects_with_factor_per_status(self, actor, fid):
        with self.project_lock:
            ownersProjects = self.owners.get(actor)
            inDesign = set()
            Active = set()
            Archived = set()
            for project in ownersProjects:
                if project.has_factor(fid):
                    if project.archived:
                        Archived.add(project.pid)
                    elif project.published:
                        Active.add(project.pid)
                    else:
                        inDesign.add(project.pid)
        return inDesign, Active, Archived

    def update_factor(
        self,
        actor,
        fid,
        pid,
        name,
        desc,
        scales_desc,
        scales_explenation,
        apply_to_all_inDesign,
    ):
        """if there is an active or an archived project with the factor actr is trying to update => must change name/ or desc and a new factor will be created
        also true id there is a project in design and apply_to_all_inDesgin = False
        if no projects except this one exists or there are only projects in design containing this actor then
        delete current factor and create a new one instead"""
        # load inDesign \ pid, Active, Archived projects of actor with fid in them
        print(f"project manage, update_factor: pid: {pid}")
        inDesign, Active, Archived = self.get_owners_projects_with_factor_per_status(
            actor, fid
        )
        project = None
        deleted = False
        if pid >= 0:
            project = self._verify_owner(pid, actor)
            inDesign.discard(pid)
            res = self.delete_factor(pid, actor, fid)

        try:
            if (
                (fid >= 0)
                and (len(Active) == 0 and len(Archived) == 0)
                and (len(inDesign) == 0 or apply_to_all_inDesign)
            ):
                for p in inDesign:
                    self.delete_factor(p, actor, fid)
                old_factor = self.factor_pool.find_factors(actor, fid)
                self.delete_factor_from_pool(actor, fid)
                deleted = True

            factor = self._create_factor(
                actor, name, desc, scales_desc, scales_explenation
            )

            if project is not None:
                project.add_factor(factor)
            if apply_to_all_inDesign:
                for p in inDesign:
                    self.projects.get(p).add_factor(factor)
        except Exception as e:
            if deleted:
                restored_factor = self.factor_pool.add_factor(
                    actor,
                    old_factor.name,
                    old_factor.description,
                    old_factor.scales_desc,
                    old_factor.scales_explanation,
                )
                fid = restored_factor.fid
            if pid >= 0:
                self.add_factors(pid, actor, [fid])
                if apply_to_all_inDesign:
                    for p in inDesign:
                        self.add_factors(p, actor, [fid])

            return ResponseFailMsg(f"updating factor {fid} failed: {e}")

        return ResponseSuccessObj(f"factor {fid} updated successfully", factor)

    # def update_factor(self, actor, fid, name, desc):
    #     res = self.factor_pool.update_factor(actor, fid, name, desc)
    #     if not res.success:
    #         return res
    #     factor = res.result
    #     projects = self._get_projects_containing_factor(actor, fid)
    #     for project in projects:
    #         project.update_factor(factor)
    #     return res

    def get_projects_factor_pool(self, actor, pid):
        """returns available factors for project, that are nop in the project already"""
        factors = self.factor_pool.get_factors(actor)
        project = self._find_project(pid)
        to_ret = []
        for factor in factors:
            if not project.has_factor(factor.fid):
                to_ret.append(factor.to_dict())
        return ResponseSuccessObj(
            f"projects factors pool for user: {actor} {to_ret}", to_ret
        )

    # TODO: add to server
    def duplicate_project(self, pid, actor):
        """creates project NTH"""
        pass

    def delete_project(self, pid, actor):
        # 1) ownership check
        project = self._verify_owner(pid, actor)

        # 2) let DBAccess handle every delete in one transaction
        res = self.db_access.delete_project(pid)
        if not res.success:
            return res

        # 3) clear in‑memory state lastly
        with self.project_lock:
            self.projects.pop(pid)
            self.owners.remove(actor, project)
            self.research_projects.pop(pid, None)
            for entry in self.pending_requests.to_list():
                if pid in entry["value"]:
                    self.pending_requests.remove(entry["key"], pid)

        return ResponseSuccessMsg(f"Project {pid} deleted successfully")

    # --------------- Data Base ------------------------

    def load_from_db(self):
        # load projects & set idmaker
        published_pids = self.load_projects_from_db()
        # load pendings
        self.load_pendings(published_pids)

    def load_pendings(self, pids):
        for pid in pids:
            pendings = self.db_access.load_by_query(
                DBPendingRequests, {"project_id": pid}
            )
            for pending in pendings:
                self.pending_requests.insert(pending.email, pid)

    def _load_factors_ids(self, pid):
        join_condition = DBProjectFactors.factor_id == DBFactors.id
        factors_data_res = self.db_access.load_by_join_query(
            DBProjectFactors,
            DBFactors,
            [DBFactors.id],  # Only fetch ID
            join_condition,
            {"project_id": pid},
        )

        if not factors_data_res:
            return []

        factor_ids = [row.id for row in factors_data_res]
        return factor_ids

    def load_projects_from_db(self):
        existing_projects = self.db_access.load_all(DBProject)
        if existing_projects is None or len(existing_projects) == 0:
            return []
        last_id = 0
        published_pids = []
        for project_data in existing_projects:
            project_factor_ids = self._load_factors_ids(project_data.id)
            project_factors = self.factor_pool.find_factors(
                project_data.owner, project_factor_ids
            )
            project = Project(
                project_data.id,
                project_data.name,
                project_data.description,
                project_data.owner,
                db_access=self.db_access,
                db_instance=project_data,
                project_factors=project_factors,
                is_to_research=project_data.is_to_research,
            )
            last_id = max(last_id, project.pid + 1)
            self.projects.insert(project.pid, project)
            self.owners.insert(project.owner, project)
            if project.is_published():
                published_pids.append(project.pid)

            if project_data.is_to_research:
                self.research_projects[project.pid] = project
        self.project_id_maker.start_from(last_id)
        return published_pids

    def check_factor_voting_status(self, pid, actor):
        """Check if member has completed voting on all factors"""
        project = self._find_project(pid)
        return project.check_factor_voting_status(actor)

    def admin_change_default_factor(
        self, fid, name, desc, scales_desc, scales_explanation
    ):
        """change will persist in all projects in design and also published projects"""
        return self.factor_pool.admin_change_default_factor(
            fid, name, desc, scales_desc, scales_explanation
        )

    def admin_add_default_factor(self, name, desc, scales_desc, scales_explanation):
        """factor wont be added automatically to any project"""
        return self.factor_pool.admin_add_default_factor(
            name, desc, scales_desc, scales_explanation
        )

    def admin_remove_default_factor(self, fid):
        """change will persist in all projects in design and also published projects"""
        with self.project_lock:
            for project in self.projects.getKeys():
                p = self.projects.get(project)
                if p.has_factor(fid):
                    p.admin_remove_factor(fid)
        res = self.factor_pool.admin_remove_default_factor(fid)
        return ResponseSuccessMsg(
            f"factor {fid} removed successfully, from all projects"
        )

    def admin_update_default_severity_factors(
        self,
        severity_factors_full_data,
        filename="Domain/src/ProjectModule/severity_factors.txt",
    ):
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(severity_factors_full_data, f, indent=2)
        load_default_severity_factors()
        return ResponseSuccessMsg(f"default severity factors updated successfully")

    def get_default_factors(self):
        return ResponseSuccessObj(
            "got default factors", self.factor_pool.get_default_factors()
        )

    def get_default_severity_factors(
        self, filename="Domain/src/ProjectModule/severity_factors.txt"
    ):
        with open(filename, "r", encoding="utf-8") as f:
            return ResponseSuccessObj("got default severity factors", json.load(f))

    def research_get_projects(self):
        with self.research_lock:
            projects = [proj.to_dict() for proj in self.research_projects.values()]
            print(f"found {len(projects)} research projects")
            return ResponseSuccessObj("got research projects", projects)

    def research_remove_project(self, pid):
        with self.research_lock:
            project = self.research_projects.get(pid)
            if project is None:
                return ResponseFailMsg(f"research project {pid} not found")
            project.stop_research()
            self.research_projects.pop(pid)
        return ResponseSuccessMsg(f"research project {pid} removed successfully")


# if __name__ == '__main__':
#     admin_update_default_severity_factors([0.5, 1, 25, 100, 400], 'severity_factors.txt')
