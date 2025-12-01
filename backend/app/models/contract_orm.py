from datetime import datetime
from sqlalchemy import Column, Integer, String, BigInteger, Date, DateTime, Float
from sqlalchemy.orm import relationship
from backend.app.database.config import Base

class ContractORM(Base):
    __tablename__ = "contract_info"

    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String, nullable=True)

    address = Column(String, nullable=False)
    address_jibun = Column(String, nullable=True)

    deposit = Column(BigInteger, nullable=False)
    move_in_date = Column(Date, nullable=True)  # 선택 필드로 변경
    confirmation_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # ⭐ MVP: 시세 직접 저장
    market_price = Column(BigInteger, nullable=True)

    # 초기 LTV 계산 결과 저장 (첫 번째 스냅샷 생성 시)
    initial_ltv = Column(Float, nullable=True)
    initial_ltv_risk = Column(String, nullable=True)  # "GREEN", "AMBER", "RED"
    initial_total_liens = Column(BigInteger, nullable=True)
    initial_market_price = Column(BigInteger, nullable=True)

    snapshots = relationship("RegistrySnapshotORM", back_populates="contract")
