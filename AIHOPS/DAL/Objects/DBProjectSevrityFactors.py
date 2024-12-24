from sqlalchemy import CheckConstraint, Column, Float, Integer, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from Service.config import Base

class DBProjectSeverityFactor(Base):
    __tablename__ = 'project_severity_factors'

    project_id = Column(Integer, ForeignKey('projects.id', ondelete='CASCADE'), primary_key=True)
    severity_level1 = Column(Float, nullable=False)
    severity_level2 = Column(Float, nullable=False)
    severity_level3 = Column(Float, nullable=False)
    severity_level4 = Column(Float, nullable=False)
    severity_level5 = Column(Float, nullable=False)

    # Add constraints to ensure values are between 0 and 1
    __table_args__ = (
        CheckConstraint('severity_level1 >= 0 AND severity_level1 <= 1'),
        CheckConstraint('severity_level2 >= 0 AND severity_level2 <= 1'),
        CheckConstraint('severity_level3 >= 0 AND severity_level3 <= 1'),
        CheckConstraint('severity_level4 >= 0 AND severity_level4 <= 1'),
        CheckConstraint('severity_level5 >= 0 AND severity_level5 <= 1'),
    )



    def __init__(self, project_id, level1, level2, level3, level4, level5):
        self.project_id = project_id
        self.severity_level1 = level1
        self.severity_level2 = level2
        self.severity_level3 = level3
        self.severity_level4 = level4
        self.severity_level5 = level5