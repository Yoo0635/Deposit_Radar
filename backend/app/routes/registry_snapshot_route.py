from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.database.crud.registry_snapshot_crud import create_snapshot
from backend.app.schema.registry_snapshot_schema import (
    RegistrySnapshotCreate,
    RegistrySnapshotResponse,
)

from backend.app.services.snapshot_service import get_latest_two_snapshots

router = APIRouter(prefix="/snapshot", tags=["snapshot"])



@router.get("/{contract_id}")
def get_two_snapshots(contract_id: int, db: Session = Depends(get_db)):
    """
    최신 스냅샷 2개 반환
    """
    old, new = get_latest_two_snapshots(contract_id, db)

    return {
        "old": old,
        "new": new
    }

@router.post("/")
def create_snapshot_route(payload: RegistrySnapshotCreate, db: Session = Depends(get_db)):
    return create_snapshot(
        db=db,
        contract_id=payload.contract_id,
        viewed_at=payload.viewed_at,
        gabu=payload.gabu,
        eulgu=payload.eulgu
    )

