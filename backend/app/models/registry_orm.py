from sqlalchemy import Column, Integer, JSON
from app.database.config import Base

class RegistrySnapshotORM(Base):
    __tablename__ = "registry_snapshot"

    id = Column(Integer, primary_key=True, index=True)
    snapshot_json = Column(JSON, nullable=False)