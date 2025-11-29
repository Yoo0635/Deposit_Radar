# ORM 모델 등록 파일 (Base는 config.py에서 가져옴)
from backend.app.database.config import Base

# 실제 ORM 클래스들을 import해야 SQLAlchemy registry에 등록됨
from backend.app.models.contract_orm import ContractORM
from backend.app.models.registry_snapshot_orm import RegistrySnapshotORM

__all__ = ["Base", "ContractORM", "RegistrySnapshotORM"]
