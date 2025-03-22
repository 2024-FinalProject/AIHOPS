from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from Service.config import Base

class DBProjectFactors(Base):
    __tablename__ = 'project_factors'

    project_id = Column(Integer, ForeignKey('projects.id', ondelete='CASCADE'), primary_key=True)
    factor_id = Column(Integer,ForeignKey('factors.id', ondelete='CASCADE'), primary_key=True)

    def __init__(self, factor_id, project_id):
        self.factor_id = factor_id
        self.project_id = project_id
