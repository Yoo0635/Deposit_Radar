# backend/app/routes/compare_route.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database.database import get_db

from backend.app.services.snapshot_service import (
    compare_latest_snapshots,
    compare_two_snapshots,
    compare_live_with_snapshot
)

router = APIRouter(prefix="/compare", tags=["Compare"])


@router.get("/latest/{contract_id}")
def compare_latest(contract_id: int, db: Session = Depends(get_db)):
    return compare_latest_snapshots(contract_id, db)


@router.get("/{old_id}/{new_id}")
def compare_specific(old_id: int, new_id: int, db: Session = Depends(get_db)):
    return compare_two_snapshots(old_id, new_id, db)


@router.post("/live/{contract_id}")
def compare_live(contract_id: int, payload: dict, db: Session = Depends(get_db)):
    return compare_live_with_snapshot(contract_id, payload, db)
