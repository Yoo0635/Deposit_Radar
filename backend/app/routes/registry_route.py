# backend/app/routes/registry_route.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.repository import get_db
from schema.registry_schema import RegistryCreate, RegistryResponse
from services.registry_service import create_registry_snapshot_service

router = APIRouter()

@router.post("/registry", response_model=RegistryResponse)
def create_registry(dto: RegistryCreate, db: Session = Depends(get_db)):
    """
    등기부 변동 스냅샷 저장
    (MVP: diff, 위험도 계산 없이 단순 저장)
    """
    return create_registry_snapshot_service(db, dto)
