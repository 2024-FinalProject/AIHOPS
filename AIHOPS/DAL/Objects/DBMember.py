from sqlalchemy import Integer, Column, String

from Domain.src.Loggs.Response import Response, ResponseFailMsg, ResponseSuccessObj
from Service.config import Base


class DBMember(Base):
    __tablename__ = 'members'
    email = Column(Integer, primary_key=True)
    name = Column(String(50))
    encrypted_passwd = Column(String)

    def __init__(self, name, encrypted_passwd, email):
        self.email = email
        self.name = name
        self.encrypted_passwd = encrypted_passwd
