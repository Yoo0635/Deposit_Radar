# backend/app/services/registry_service.py

from sqlalchemy.orm import Session
from backend.app.schema.registry_schema import RegistryCreate, RegistryResponse
from backend.app.models.registry_orm import RegistrySnapshotORM
from backend.app.database.crud.registry_crud import create_registry_snapshot


def create_registry_snapshot_service(db: Session, dto: RegistryCreate) -> RegistryResponse:
    """
    등기부 스냅샷 저장 서비스 계층
    (MVP 기준: diff 계산 X, 단순 저장만)
    """

    obj: RegistrySnapshotORM = create_registry_snapshot(db, dto)
    response = RegistryResponse.model_validate(obj)
    return response
