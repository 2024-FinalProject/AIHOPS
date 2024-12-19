# from datetime import datetime
# from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
# from sqlalchemy.ext.declarative import declarative_base
# from Service.config import Base

# class DBFactorVotes(Base):
#     __tablename__ = 'factor_votes'

#     project_id = Column(Integer, ForeignKey('projects.id'), primary_key=True)
#     memeber_email = Column(String,ForeignKey('members.email'), primary_key=True)
#     factor_id = Column(Integer,ForeignKey('factors.id'), primary_key=True)
#     value = Column(Integer)


#     def __init__(self, factor_id, email, project_id, value):
#         self.factor_id = factor_id
#         self.memeber_email = email
#         self.project_id = project_id
#         self.value = value
