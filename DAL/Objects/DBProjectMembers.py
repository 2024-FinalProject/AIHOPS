from datetime import datetime
from sqlalchemy import Column, Index, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from Service.config import Base

class DBProjectMembers(Base):
    __tablename__ = 'project_memebers'

    project_id = Column(Integer, ForeignKey('projects.id', ondelete='CASCADE'), primary_key=True)
    member_email = Column(String,ForeignKey('members.email', ondelete='CASCADE'), primary_key=True)

    __table_args__ = (
        Index('idx_project_members', 'project_id', 'member_email'),
    )

    def __init__(self, project_id, member_email):
        self.project_id = project_id
        self.member_email = member_email
        
