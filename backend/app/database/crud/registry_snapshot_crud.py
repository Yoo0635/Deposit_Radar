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

def get_last_two_snapshots(db: Session, contract_id: int):
    snapshots = (
        db.query(RegistrySnapshotORM)
          .filter(RegistrySnapshotORM.contract_id == contract_id)
          .order_by(RegistrySnapshotORM.created_at.desc())
          .limit(2)
          .all()
    )

    if len(snapshots) < 2:
        return None, None

    # 최신 스냅샷
    new_snapshot = {
        "gabu": snapshots[0].gabu,
        "eulgu": snapshots[0].eulgu,
    }

    # 그 이전 스냅샷
    old_snapshot = {
        "gabu": snapshots[1].gabu,
        "eulgu": snapshots[1].eulgu,
    }

    return old_snapshot, new_snapshot

