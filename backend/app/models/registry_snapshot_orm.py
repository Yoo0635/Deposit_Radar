# backend/app/models/registry_snapshot_orm.py

from sqlalchemy import Column, Integer, ForeignKey, Date, DateTime
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from datetime import datetime

# 🔥 Base는 database.py가 아니라 models.py에 있음!
from backend.app.database.config import Base

class RegistrySnapshotORM(Base):
    __tablename__ = "registry_snapshot"

    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contract_info.id"))
    viewed_at = Column(Date)
    gabu = Column(JSON)   # 갑구 JSON
    eulgu = Column(JSON)  # 을구 JSON
    created_at = Column(DateTime, default=datetime.utcnow)

    contract = relationship("ContractORM", back_populates="snapshots")

    # diff 엔진용 dict 변환기
    def to_dict(self):
        return {
            "gabu": self.gabu or [],
            "eulgu": self.eulgu or [],
            "viewed_at": str(self.viewed_at) if self.viewed_at else None,
        }
