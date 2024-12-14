from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from Service.config import Base

class DBVotes(Base):
    __tablename__ = 'votes'

    id = Column(Integer, primary_key=True, autoincrement = True)
    pid = Column(Integer, nullable=False)
    user_name = Column(String, unique=True, nullable=False)
    factors_values = Column(String)
    severity_factors_values = Column(String)

    def __init__(self, pid, user_name, factors_values, severity_factors_values):
        self.pid = pid
        self.user_name = user_name
        self.factors_values = factors_values
        self.severity_factors_values = severity_factors_values