# from datetime import datetime
# from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
# from sqlalchemy.ext.declarative import declarative_base
# from Service.config import Base

# class DBProjectMembers(Base):
#     __tablename__ = 'project_memebers'

#     project_id = Column(Integer, ForeignKey('projects.id'), primary_key=True)
#     member_email = Column(String,ForeignKey('members.email'), primary_key=True)

#     def __init__(self, project_id, member_email):
#         self.project_id = project_id
#         self.member_email = member_email
        
