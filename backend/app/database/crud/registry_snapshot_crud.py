from sqlalchemy.orm import Session
from backend.app.models.registry_snapshot_orm import RegistrySnapshotORM

def create_snapshot(db: Session, contract_id: int, viewed_at: str, gabu: list, eulgu: list):

    # 🔥 Pydantic 모델 → dict 변환 (JSONB 저장 위해 필수)
    gabu_dict = [entry.dict() for entry in gabu]
    eulgu_dict = [entry.dict() for entry in eulgu]

    obj = RegistrySnapshotORM(
        contract_id=contract_id,
        viewed_at=viewed_at,
        gabu=gabu_dict,
        eulgu=eulgu_dict
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def get_snapshot_by_id(db: Session, snapshot_id: int):
    return db.query(RegistrySnapshotORM).filter(
        RegistrySnapshotORM.id == snapshot_id
    ).first()


def get_snapshot_by_contract_id(db: Session, contract_id: int):
    return db.query(RegistrySnapshotORM).filter(
        RegistrySnapshotORM.contract_id == contract_id
    ).order_by(RegistrySnapshotORM.id.asc()).all()
