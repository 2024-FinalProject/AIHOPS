from datetime import datetime
from sqlalchemy import Column, Index, Integer, String, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base

from Service.config import Base

class DBProject(Base):
    __tablename__ = 'projects'

    id = Column(Integer, primary_key=True)
    name = Column(String(255), unique=True, nullable=False)
    founder = Column(String(255), nullable=False)
    description = Column(String(1000))
    date_created = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=False)
    factors_num = Column(Integer)

    _table_args__ = (
        Index('idx_project_name', 'name'),
        Index('idx_project_founder', 'founder'),
    )

    def __init__(self, name, founder, description, project_id, factors_num):
        self.name = name
        self.founder = founder
        self.description = description
        self.id = project_id
        self.date_created = datetime.now()
        self.is_active = False
        self.factors_num = factors_num
       