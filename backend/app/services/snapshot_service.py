# backend/app/services/snapshot_service.py

from sqlalchemy.orm import Session
from app.models.registry_snapshot_orm import RegistrySnapshot
from fastapi import HTTPException


def fetch_last_two_snapshots(db: Session, contract_id: int):
    """
    같은 계약(contract_id)에 대해 최신 스냅샷 2개 조회
    """
    snapshots = (
        db.query(RegistrySnapshot)
          .filter(RegistrySnapshot.contract_id == contract_id)
          .order_by(RegistrySnapshot.created_at.desc())
          .limit(2)
          .all()
    )

    if len(snapshots) < 2:
        raise HTTPException(
            status_code=400,
            detail="스냅샷이 2개 이상 필요합니다. 최소 두 번 이상 열람해야 합니다."
        )

    new_snapshot = snapshots[0]
    old_snapshot = snapshots[1]

    return old_snapshot.data, new_snapshot.data
