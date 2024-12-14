from sqlalchemy import Integer, Column, String

from Domain.src.Loggs.Response import Response, ResponseFailMsg, ResponseSuccessObj
from Service.config import Base


class DBMember(Base):
    __tablename__ = 'members'
    id = Column(Integer, primary_key=True)
    name = Column(String(50))
    encrypted_passwd = Column(String)

    def __init__(self, name, encrypted_passwd, uid):
        self.id = uid
        self.name = name
        self.encrypted_passwd = encrypted_passwd
