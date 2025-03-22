from datetime import datetime
from sqlalchemy import Column, Index, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from Service.config import Base


class DBPendingRequests(Base):
    __tablename__= "pending_requests"
    project_id = Column(Integer, ForeignKey('projects.id', ondelete='CASCADE'), primary_key=True)
    email = Column(String(255), primary_key=True)

    __table_args__ = (
        Index('idx_pending_requests', 'project_id', 'email'),
    )
     

    def __init__(self, project_id, email):
        self.project_id = project_id
        self.email = email



