from datetime import datetime
from sqlalchemy import Column, Index, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from Service.config import Base

class DBFactorVotes(Base):
    __tablename__ = 'factor_votes'

    project_id = Column(Integer, ForeignKey('projects.id', ondelete='CASCADE'), primary_key=True)
    member_email = Column(String(255), ForeignKey('members.email', ondelete='CASCADE'), primary_key=True)
    factor_id = Column(Integer, ForeignKey('factors.id', ondelete='CASCADE'), primary_key=True)
    value = Column(Integer, nullable=False)

    __table_args__ = (
        Index('idx_factor_votes', 'project_id', 'member_email', 'factor_id'),
    )


    def __init__(self, factor_id, email, project_id, value):
        self.factor_id = factor_id
        self.memeber_email = email
        self.project_id = project_id
        self.value = value
