from datetime import datetime
from sqlalchemy import Column, Integer, String, BigInteger, Date, DateTime
from sqlalchemy.orm import relationship
from backend.app.database.config import Base

class ContractORM(Base):
    __tablename__ = "contract_info"

    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String, nullable=True)

    address = Column(String, nullable=False)
    address_jibun = Column(String, nullable=True)

    deposit = Column(BigInteger, nullable=False)
    move_in_date = Column(Date, nullable=False)
    confirmation_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # ⭐ MVP: 시세 직접 저장
    market_price = Column(BigInteger, nullable=True)

    snapshots = relationship("RegistrySnapshotORM", back_populates="contract")
