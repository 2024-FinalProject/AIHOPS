from Domain.src.DS.IdMaker import IdMaker


class ProjectManager:
    def __init__(self):
        self.project = {}
        self.id_maker = IdMaker()
        self.user_project_dict = {}

    def create_project(self):
        ...

    def set_project_factors(self):
        ...

    def set_project_severity_factors(self):
        ...

    def add_member(self):
        ...

    def remove_member(self):
        ...

    def get_member_projects(self):
        ...

    def vote(self):
        ...

    def get_project(self):
        ...

    def close_project(self):
        ...



