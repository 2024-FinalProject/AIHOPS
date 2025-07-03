from sqlalchemy import Integer, Column, String

from Domain.src.Loggs.Response import Response, ResponseFailMsg, ResponseSuccessObj
from Service.config import Base


class DBFactors(Base):
    __tablename__ = 'factors'
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100))
    description = Column(String(500))
    owner = Column(String(100))
    scales_desc_0 = Column(String(500))
    scales_desc_1 = Column(String(500))
    scales_desc_2 = Column(String(500))
    scales_desc_3 = Column(String(500))
    scales_desc_4 = Column(String(500))
    scales_explanation_0 = Column(String(500))
    scales_explanation_1 = Column(String(500))
    scales_explanation_2 = Column(String(500))
    scales_explanation_3 = Column(String(500))
    scales_explanation_4 = Column(String(500))

    def __init__(self, name, description, factor_id, owner, scales_desc, scales_explanation):
        self.name = name
        self.description = description
        self.id = factor_id
        self.owner = owner
        for i in range(5):
            setattr(self, f'scales_desc_{i}', scales_desc[i])
            setattr(self, f'scales_explanation_{i}', scales_explanation[i])