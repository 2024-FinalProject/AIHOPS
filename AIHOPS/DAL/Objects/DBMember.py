from sqlalchemy import Integer, Column, String, Index, Boolean

from Domain.src.Loggs.Response import Response, ResponseFailMsg, ResponseSuccessObj
from Service.config import Base


class DBMember(Base):
    __tablename__ = 'members'
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(50))
    encrypted_passwd = Column(String(255), nullable=False)
    verified = Column(Boolean, default=False)
    is_google_user = Column(Boolean, default=False)  #New field to track Google authentication
    accepted_tac_version = Column(Integer, default=-1)
    profile_picture = Column(String(255), nullable=True)
    profile_picture_source = Column(String, default='none')  # 'none', 'google', or 'upload'

    __table_args__ = (
        Index('idx_member_email', 'email'),
    )

    def __init__(self, id, email, encrypted_passwd, is_verified=False, is_google_user=False, accepted_tac_version=-1, profile_picture=None, profile_picture_source='none'):
        self.id = id
        self.email = email
        self.encrypted_passwd = encrypted_passwd
        self.verified = is_verified
        self.is_google_user = is_google_user
        self.accepted_tac_version = accepted_tac_version
        self.profile_picture = profile_picture
        self.profile_picture_source = profile_picture_source