from sqlalchemy.orm import Session
from backend.app.models.registry_snapshot_orm import RegistrySnapshotORM
from backend.app.schema.registry_schema import RegistryCreate


def create_registry_snapshot(db: Session, dto: RegistryCreate):
    """
    등기부 변동사항 스냅샷 저장
    """
    obj = RegistrySnapshotORM(
        contract_id=dto.contract_id,
        change_type=dto.change_type,
        detail=dto.detail,
    )

    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj