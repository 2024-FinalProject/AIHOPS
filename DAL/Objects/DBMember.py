from sqlalchemy import Integer, Column, String, Index

from Domain.src.Loggs.Response import Response, ResponseFailMsg, ResponseSuccessObj
from Service.config import Base


class DBMember(Base):
    __tablename__ = 'members'
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(50))
    encrypted_passwd = Column(String(255), nullable=False)

    __table_args__ = (
        Index('idx_member_email', 'email'),
    )

    def __init__(self, id, email, encrypted_passwd):
        self.id = id
        self.email = email
        self.encrypted_passwd = encrypted_passwd
