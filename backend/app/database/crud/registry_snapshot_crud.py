from sqlalchemy.orm import Session
from backend.app.models.registry_snapshot_orm import RegistrySnapshotORM
from backend.app.schema.registry_snapshot_schema import RegistrySnapshotCreate

def create_snapshot(db: Session, dto: RegistrySnapshotCreate):
    obj = RegistrySnapshotORM(**dto.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_snapshots_by_contract(db: Session, contract_id: int):
    return db.query(RegistrySnapshotORM).filter(
        RegistrySnapshotORM.contract_id == contract_id
    ).all()
