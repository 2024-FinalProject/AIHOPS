# from datetime import datetime
# from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
# from sqlalchemy.ext.declarative import declarative_base
# from Service.config import Base

# class DBProjectSeverityFactor(Base):
#     __tablename__ = 'project_severity_factors'

#     project_id = Column(Integer, ForeignKey('projects.id'), primary_key=True)
#     severity_level1 = Column(float)
#     severity_level2 = Column(float)
#     severity_level3 = Column(float)
#     severity_level4 = Column(float)
#     severity_level5 = Column(float)



#     def __init__(self, project_id, level1, level2, level3, level4, level5):
#         self.project_id = project_id
#         self.severity_level1 = level1
#         self.severity_level2 = level2
#         self.severity_level3 = level3
#         self.severity_level4 = level4
#         self.severity_level5 = level5