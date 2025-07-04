from threading import RLock

from DAL.Objects.DBFactorVotes import DBFactorVotes
from DAL.Objects.DBFactors import DBFactors
from DAL.Objects.DBPendingRequests import DBPendingRequests
from DAL.Objects.DBProjectFactors import DBProjectFactors
from DAL.Objects.DBProjectMembers import DBProjectMembers
from DAL.Objects.DBProjectSeverityFactor import DBProjectSeverityFactor
from DAL.Objects.DBProject import DBProject
from DAL.Objects.DBSeverityVotes import DBSeverityVotes
from Domain.src.DS.ThreadSafeDictWithListValue import ThreadSafeDictWithListValue
from DAL.DBAccess import DBAccess
from Domain.src.DS.IdMaker import IdMaker
from Domain.src.DS.ThreadSafeDict import ThreadSafeDict

from Domain.src.Loggs.Response import (
    Response,
    ResponseSuccessMsg,
    ResponseFailMsg,
    ResponseSuccessObj,
)
from Domain.src.ProjectModule.Project import Project
from copy import deepcopy as deepCopy

DEFAULT_FACTORS_COUNT = 0


class ProjectManager:

    def __init__(self, db_access):
        self.projects = ThreadSafeDict()  # project_id -> Project
        self.founder_projects = (
            ThreadSafeDictWithListValue()
        )  # founder -> list of projects
        self.pending_requests = (
            ThreadSafeDictWithListValue()
        )  # email -> list of projects_id's
        self.id_maker = IdMaker()
        self.db_access = db_access
        self.get_projects_from_db()
        self.get_pending_requests_from_db()
        self.factors_lock = RLock()
        self.factor_id_maker = IdMaker()
        self.set_project_id_maker()

    def set_project_id_maker(self):
        # get highest factor id from db
        highest = self.db_access.get_highest_factor_id()
        # set id_maker next id to retrieved value+1
        if highest is not None:
            self.factor_id_maker.start_from(highest + 1)

    def get_projects_from_db(self):
        existing_projects = self.db_access.load_all(DBProject)
        if existing_projects is None or len(existing_projects) == 0:
            return 1
        last_id = 0
        for project_data in existing_projects:
            project = Project(
                project_data.id,
                project_data.name,
                project_data.description,
                project_data.founder,
                project_data.factors_num,
                fromDB=True,
            )
            # Verify factors count matches the stored factors_num
            factors_count = project.factors.size()
            if factors_count != project_data.factors_num:
                # Delete the project and all related data if the factors count is wrong
                self.delete_project(project_data.id)
                continue
            last_id = max(last_id, project.id + 1)
            self.projects.insert(project.id, project)
            self.founder_projects.insert(project.founder, project)
        self.id_maker.start_from(last_id)

    def get_pending_requests_from_db(self):
        pending_requests = self.db_access.load_all(DBPendingRequests)
        if pending_requests is None:
            return 1
        for request in pending_requests:
            project = self.projects.get(request.project_id)
            if not project.is_member(request.email):
                self.pending_requests.insert(request.email, request.project_id)

    def create_project(self, name, description, founder):
        if name == "" or description == "":
            return ResponseFailMsg("name and description can't be empty")

        if founder == "":
            return ResponseFailMsg("founder can't be empty")

        # self.verify_founder_exists(founder)
        if not self.founder_projects.get(founder):
            self.founder_projects.insert(founder, [])

        temp_projects = self.founder_projects.get(founder)
        prj = Project(-999, name, description, founder)
        for project in temp_projects:
            if project == prj and project.isActive:
                return ResponseFailMsg(
                    f"project with {name} already exists and is active for this founder."
                )

        project_id = self.id_maker.next_id()
        prj = Project(project_id, name, description, founder)

        # Add DB insert
        db_project = DBProject(
            name, founder, description, project_id, DEFAULT_FACTORS_COUNT
        )
        self.db_access.insert(db_project)

        # Add DB insert for founder
        db_project_member = DBProjectMembers(project_id, founder)
        self.db_access.insert(db_project_member)

        self.projects.insert(project_id, prj)
        self.founder_projects.insert(founder, prj)

        return Response(True, f"project {name} has been created", project_id, False)

    def set_project_factors(self, project_id, factors):
        if len(factors) == 0:
            return ResponseFailMsg("factors can't be empty")
        project = self.find_Project(project_id)

        # insert -1 factors num for project to db
        db_project = self.db_access.load_by_query(DBProject, {"id": project_id})
        if isinstance(db_project, ResponseFailMsg):
            return db_project

        db_project = db_project[0]
        db_project.factors_num = -1
        update_result = self.db_access.update(db_project)
        if not update_result.success:
            return update_result

        # insert to DB
        for factor in factors:
            next_id = self.factor_id_maker.next_id()
            db_factor = DBFactors(factor[0], factor[1], next_id)
            self.db_access.insert(db_factor)
            db_project_factor = DBProjectFactors(next_id, project_id)
            self.db_access.insert(db_project_factor)

        db_project.factors_num = len(factors)
        update_result = self.db_access.update(db_project)
        if not update_result.success:
            return update_result
        # cache changes only after db persistance
        project.set_factors(factors)

        # insert correct factors num for project to db

        return ResponseSuccessMsg(f"project {project_id} factors has been set")

    def set_project_severity_factors(self, project_id, severity_factors):
        # TODO: redundant??
        if len(severity_factors) == 0:
            return ResponseFailMsg("severity factors can't be empty")

        if len(severity_factors) != 5:
            return ResponseFailMsg(
                "there should be exactly 5 severity factors, but there were "
                + str(len(severity_factors))
            )

        for sf in severity_factors:
            if sf < 0:
                return ResponseFailMsg("severity factor can't be a negative")

        project = self.find_Project(project_id)

        # insert to DB
        db_severity = DBProjectSeverityFactor(project_id, *severity_factors)
        res = self.db_access.update(db_severity)

        # cache changes only after db persistance
        project.set_severity_factors(severity_factors)
        return ResponseSuccessMsg(f"project {project_id} severity factors has been set")

    def add_members(self, asking, project_id, users_names):
        existing_members_in_proj = []
        temp_project = self.find_Project(project_id)

        if asking != temp_project.founder:
            return ResponseFailMsg(
                f"only founder {temp_project.founder} can add members"
            )

        if users_names == []:
            return ResponseFailMsg("user names can't be empty")

        if not temp_project.isActive or not temp_project.is_initialized_project():
            return ResponseFailMsg(
                f"cant add member to project {project_id} because it is not finalized"
            )

        for user_name in users_names:
            # check if user is already pending for this project
            try:
                temp_pending_requests = self.find_pending_requests(user_name)
                if project_id in temp_pending_requests:
                    existing_members_in_proj.append(user_name)
                else:
                    self.pending_requests.insert(user_name, project_id)
                    # insert into DB
                    db_pending = DBPendingRequests(project_id, user_name)
                    self.db_access.insert(db_pending)
            except Exception as e:
                self.pending_requests.insert(user_name, project_id)
                # insert into DB
                db_pending = DBPendingRequests(project_id, user_name)
                self.db_access.insert(db_pending)

                # TODO: What happens if the insert fails? f.e: if the user is already in the pending requests

            # with self.lock:
            #     self.db_access.insert(DBPendingRequests(project_id, user_name
            #     return ResponseSuccessMsg(f"user {user_name} has invation to {project_id}")

        if len(existing_members_in_proj) > 0:
            return ResponseFailMsg(
                f"users waiting for approval to project: {project_id}, except {existing_members_in_proj}"
            )
        return ResponseSuccessMsg(
            f"users waiting for approval to project :{project_id}"
        )

    def remove_member(self, asking, project_id, user_name):
        temp_project = self.find_Project(project_id)
        if asking != temp_project.founder:
            return ResponseFailMsg(
                f"only founder {temp_project.founder} can remove members"
            )
        try:
            temp_pending_requests = self.find_pending_requests(user_name)
            if project_id in temp_pending_requests:
                self.pending_requests.pop(user_name, project_id)
                # Delete member from pending requests
                self.db_access.delete_obj_by_query(
                    DBPendingRequests, {"project_id": project_id, "email": user_name}
                )
                return ResponseSuccessMsg(
                    f"user {user_name} has been removed from project {project_id}"
                )
        except Exception as e:
            temp_project.remove_member(asking, user_name)
            # Delete member from project
            self.db_access.delete_obj_by_query(
                DBProjectMembers, {"project_id": project_id, "member_email": user_name}
            )
            return ResponseSuccessMsg(
                f"user {user_name} has been removed from project {project_id}"
            )

    def get_members_of_project(self, asking, project_id):
        temp_project = self.find_Project(project_id)
        if asking != temp_project.founder:
            return ResponseFailMsg(
                f"only founder {temp_project.founder} can get members"
            )
        return ResponseSuccessMsg(
            f"list of members in project {project_id} : {temp_project.get_members()}"
        )

    def get_projects(self, founder):
        try:
            projects = self.find_Projects(founder)

            temp_projects = []
            for project in projects:
                if hasattr(project, "to_dict"):
                    temp_projects.append(project.to_dict())

            return ResponseSuccessObj(
                f"List of projects for founder {founder}", temp_projects
            )
        except Exception as e:
            return ResponseFailMsg(str(e))

    def vote(self, project_id, user_name, factors_values, severity_factors_values):
        if factors_values == [] or severity_factors_values == []:
            return ResponseFailMsg("factors and severity factors can't be empty")
        try:
            project = self.find_Project(project_id)
            severity_amount = 0
            for factor in factors_values:
                if factor < 0 or factor > 4:
                    return ResponseFailMsg("factor needs to be between 0 and 4")
            for severity in severity_factors_values:
                if severity < 0 or severity > 100:
                    return ResponseFailMsg(
                        "severity factor needs to be between 0 and 1"
                    )
                severity_amount += severity
            if severity_amount != 100:
                return ResponseFailMsg("severity factors sum needs to be excaly 1")

            # Save initial placeholder row with -1 id and -1 value
            db_vote = DBFactorVotes(-1, user_name, project_id, -1)
            self.db_access.insert(db_vote)

            factor_votes = {}
            # Save factor votes
            for i, value in enumerate(factors_values):
                db_vote = DBFactorVotes(i, user_name, project_id, value)
                self.db_access.insert(db_vote)
                factor_votes[i] = value

            # Save severity votes
            db_severity_vote = DBSeverityVotes(
                user_name, project_id, *severity_factors_values
            )
            self.db_access.insert(db_severity_vote)

            temp_factor = DBFactorVotes(-1, user_name, project_id, -1)
            temp_factor.value = 1
            # Update the object
            update_result = self.db_access.update(temp_factor)
            if not update_result.success:
                return update_result

            project.vote(user_name, factor_votes, severity_factors_values)
        except Exception as e:
            return ResponseFailMsg(e)
        # with self.lock:
        #     for factor in factors_values:
        #         self.db_access.insert(DBFactorVotes(factor.id, user_name, project_id, factor.value))
        #     self.db_access.insert(DBSeverityVotes(user_name, project_id, severity_factors_values))
        return ResponseSuccessMsg(f"user {user_name} has voted in project {project_id}")

    def get_project(self, project_id):
        temp_project = self.find_Project(project_id)
        return ResponseSuccessMsg(f"project {temp_project}")

    def get_project_by_name_and_desc(self, founder, project_name, project_desc):
        temp_project = self.find_Project_By_Name_And_Desc(
            founder, project_name, project_desc
        )
        return ResponseSuccessMsg(f"project {temp_project.to_dict()}")

    def publish_project(self, project_id, founder):
        temp_project = self.find_Project(project_id)
        # Check if project is initialized
        if not temp_project.is_initialized_project():
            return ResponseFailMsg(
                "Can't publish project without initializing factors and severity factors"
            )
        temp_projects = self.find_Projects(founder)
        for project in temp_projects:
            if project == temp_project and project.isActive:
                return ResponseFailMsg(
                    f"project with {temp_project.name} already exists and is active for this founder."
                )
        temp_project.publish_project()
        # Update project status to active
        self.update_project_status(project_id, True)
        return ResponseSuccessMsg(f"project {project_id} has been published")

    def archive_project(self, project_id):
        temp_project = self.find_Project(project_id)
        temp_project.hide_project()

        # Update project status to non active
        self.update_project_status(project_id, False)
        return ResponseSuccessMsg(f"project {project_id} has been closed")

    def get_score(self, requesting_member, pid):
        project = self.find_Project(pid)
        score = project.get_score(requesting_member)
        return ResponseSuccessMsg(f"score of project {pid} is {score}")

    def get_pending_requests(self, email):
        try:
            temp_pending_requests = self.find_pending_requests(email)
            to_return_pending_requests = []
            for pending_requests in temp_pending_requests:
                to_return_pending_requests.append(
                    self.projects.get(pending_requests).to_dict()
                )

            return ResponseSuccessObj(
                f"pending requests for email {email} : {to_return_pending_requests}",
                list(to_return_pending_requests),
            )

        except Exception as e:
            return ResponseSuccessObj(f"no pending requests", [])

    def get_pending_emails_for_project(self, project_id, founder):
        if self.find_Project(project_id).founder != founder:
            return ResponseFailMsg(f"only founder {founder} can get pending requests")
        emails = []
        for email, projects in self.pending_requests.dict.items():
            if (
                project_id in projects
            ):  # Check if the project_id exists in the list of project_ids
                emails.append(email)  # If so, add the email to the result list
        return ResponseSuccessObj(
            f"pending requests for project {project_id} : {emails}", list(emails)
        )

    def approve_member(self, project_id, user_name):
        # pending_requests = self.find_pending_requests(user_name)
        self.pending_requests.pop(user_name, project_id)
        project = self.find_Project(project_id)
        if project.isActive:
            project.approved_member(user_name)
            # insert into DB approved member
            db_member = DBProjectMembers(project_id, user_name)
            self.db_access.insert(db_member)
            # Remove member from pending requests
            self.db_access.delete_obj_by_query(
                DBPendingRequests, {"project_id": project_id, "email": user_name}
            )
            return ResponseSuccessMsg(
                f"member {user_name} has been approved in project {project_id}"
            )
        else:
            # Remove member from pending requests
            self.db_access.delete_obj_by_query(
                DBPendingRequests, {"project_id": project_id, "email": user_name}
            )
            return ResponseFailMsg(
                f"cant approve member {user_name} in project {project_id} because it is not active"
            )

    def reject_member(self, project_id, user_name):
        pending_requests = self.find_pending_requests(user_name)
        if pending_requests is not None and project_id in pending_requests:
            pending_requests.remove(project_id)
            print("remove")
            # Delete member from pending requests
            self.db_access.delete_obj_by_query(
                DBPendingRequests, {"project_id": project_id, "email": user_name}
            )
            print
            return ResponseSuccessMsg(
                f"member {user_name} has been rejected from project {project_id}"
            )
        return ResponseFailMsg(
            f"member {user_name} is not pending in project {project_id}"
        )

    def find_Project(self, project_id):
        prj = self.projects.get(project_id)
        if prj is None or prj == []:
            raise Exception(f"project {project_id} not found")
        return prj

    def find_Project_By_Name_And_Desc(self, project_name, project_desc, founder):
        prjs = self.founder_projects.get(founder)
        if prjs is None or prjs == []:
            raise Exception(f"founder {founder} has no projects")
        for prj in prjs:
            if prj.name == project_name and prj.description == project_desc:
                return prj
        raise Exception(f"founder {founder} has no project with the provide details")

    def find_Projects(self, founder):
        prjs = self.founder_projects.get(founder)
        if prjs is None or prjs == []:
            raise Exception(f"founder {founder} has no projects")
        return prjs

    def find_pending_requests(self, email):
        prjs = self.pending_requests.get(email)
        if prjs is None or prjs == []:
            raise Exception(f"no pending requests found for email {email}")
        return prjs

    def verify_founder_exists(self, founder):
        if not self.founder_projects.get(founder):
            raise Exception(f"founder {founder} not found")
        return True

    def update_project_name_and_desc(self, project_id, name, description):
        try:
            project = self.find_Project(project_id)

            # Update the project name and description in the database
            db_project = DBProject(
                name, project.founder, description, project_id, project.factors.size()
            )
            db_project.id = project_id
            project.update_project_name_and_desc(name, description)
            return self.db_access.update(db_project)
        except Exception as e:
            return ResponseFailMsg(
                f"Failed to update project name and description: {str(e)}"
            )

    def update_project_status(self, project_id, is_active):
        try:
            project = self.find_Project(project_id)
            project.isActive = is_active

            # Update the project status in the database
            db_project = DBProject(
                project.name,
                project.founder,
                description=project.description,
                project_id=project_id,
                factors_num=project.factors.size(),
            )
            db_project.id = project_id
            db_project.is_active = is_active

            return self.db_access.update(db_project)
        except Exception as e:
            return ResponseFailMsg(f"Failed to update project status: {str(e)}")

    def delete_project(self, project_id):
        try:
            # Delete all related data (factors, votes, pending requests, members, etc.)
            self.db_access.delete_obj_by_query(
                DBProjectFactors, {"project_id": project_id}
            )
            self.db_access.delete_obj_by_query(
                DBFactorVotes, {"project_id": project_id}
            )
            self.db_access.delete_obj_by_query(
                DBSeverityVotes, {"project_id": project_id}
            )
            self.db_access.delete_obj_by_query(
                DBPendingRequests, {"project_id": project_id}
            )
            self.db_access.delete_obj_by_query(
                DBProjectMembers, {"project_id": project_id}
            )
            self.db_access.delete_obj_by_query(DBProject, {"id": project_id})

            # Remove the project from the in-memory data structures
            self.projects.pop(project_id, None)
            for founder, projects in self.founder_projects.items():
                self.founder_projects[founder] = [
                    p for p in projects if p.id != project_id
                ]

            return ResponseSuccessMsg(
                f"Project {project_id} and all related data have been deleted."
            )
        except Exception as e:
            return ResponseFailMsg(f"Failed to delete project {project_id}: {str(e)}")
