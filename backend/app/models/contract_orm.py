from sqlalchemy import Column, Integer, String, BigInteger, Date
from app.database.config import Base

class ContractInfoORM(Base):
    __tablename__ = "contract_info"

    id = Column(Integer, primary_key=True, index=True)
    address = Column(String, nullable=False)

    deposit = Column(BigInteger, nullable=False)
    move_in_date = Column(Date, nullable=False)
    confirmation_date = Column(Date, nullable=True)