
from sqlalchemy import Column, Integer, Date, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from backend.app.database.config import Base

class RegistrySnapshotORM(Base):
    __tablename__ = "registry_snapshot"

    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, nullable=False)

    viewed_at = Column(Date, nullable=False)
    gabu = Column(JSONB, nullable=False)
    eulgu = Column(JSONB, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

