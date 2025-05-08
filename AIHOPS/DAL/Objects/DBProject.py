from datetime import datetime
from sqlalchemy import Column, Index, Integer, String, DateTime, Boolean

from Service.config import Base

class DBProject(Base):
    __tablename__ = 'projects'

    id = Column(Integer, primary_key=True)
    owner = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(String(1000))
    date_created = Column(DateTime, default=datetime.utcnow)
    published = Column(Boolean, default=False)
    archived = Column(Boolean, default=False)
    factors_confirmed = Column(Boolean, default=False)
    severity_factors_confirmed = Column(Boolean, default=False)
    is_to_research = Column(Boolean, default=False)

    __table_args__ = (
        Index('idx_project_name', 'name'),
        Index('idx_project_owner', 'owner'),
    )

    def __init__(self, pid, owner, name, description, is_to_research=False):
        self.id = pid
        self.owner = owner
        self.name = name
        self.description = description
        self.published = False
        self.archived = False
        self.factors_confirmed = False
        self.severity_factors_confirmed = False
        self.is_to_research = is_to_research
