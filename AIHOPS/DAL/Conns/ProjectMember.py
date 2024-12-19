from sqlalchemy import Column, String

from Service.config import Base


class ProjectMember(Base):
    __tablename__ = 'project_members'
    project_name = Column(String(50), primary_key=True)
    user_name = Column(String(50), primary_key=True)

    def __init__(self, project_name, user_name):
        self.project_name = project_name
        self.user_name = user_name

