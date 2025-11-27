# backend/app/routes/contract_route.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.repository import get_db
from schema.contract_schema import ContractCreate, ContractResponse
from services.contract_service import (
    create_contract_service,
    get_contract_service,
)

router = APIRouter()

@router.post("/contracts", response_model=ContractResponse)
def create_contract(dto: ContractCreate, db: Session = Depends(get_db)):
    """
    계약정보 등록
    1) DTO 자동 검증
    2) Service 호출 → CRUD → DB 저장
    3) Response DTO로 변환되어 반환
    """
    return create_contract_service(db, dto)


@router.get("/contracts/{contract_id}", response_model=ContractResponse)
def get_contract(contract_id: int, db: Session = Depends(get_db)):
    """
    계약정보 단일 조회
    """
    result = get_contract_service(db, contract_id)
    return result
