from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from Service.config import Base


class DBPendingRequests(Base):
    __tablename__= "pending_requests"
    project_id = Column(Integer, ForeignKey('projects.id'), primary_key=True)
    email = Column(String, primary_key=True)
     

    def __init__(self, project_id, email):
        self.project_id = project_id
        self.email = email



