from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from Service.config import Base

class DBProject(Base):
    __tablename__ = 'projects'

    id = Column(Integer, primary_key=True, autoincrement = True)
    name = Column(String, unique=True, nullable=False)
    founder = Column(String, nullable=False)
    description = Column(String)
    date_created = Column(DateTime)
    is_active = Column(Boolean, default=True)

    def __init__(self, name, founder, **kwargs):
        self.name = name
        self.founder = founder
        self.description = kwargs.get('description')
        self.date_created = datetime.now()
        self.is_active = False
       