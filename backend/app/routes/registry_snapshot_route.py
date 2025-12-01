from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database.database import get_db
from backend.app.schema.registry_snapshot_schema import (
    RegistrySnapshotCreate,
    RegistrySnapshotResponse
)
from backend.app.database.crud.registry_snapshot_crud import (
    create_snapshot,
    get_snapshots_by_contract
)

router = APIRouter(prefix="/snapshots", tags=["Registry Snapshots"])

@router.post("/", response_model=RegistrySnapshotResponse)
def create_snapshot_api(dto: RegistrySnapshotCreate, db: Session = Depends(get_db)):
    return create_snapshot(db, dto)

@router.get("/{contract_id}", response_model=list[RegistrySnapshotResponse])
def list_snapshots_api(contract_id: int, db: Session = Depends(get_db)):
    return get_snapshots_by_contract(db, contract_id)
