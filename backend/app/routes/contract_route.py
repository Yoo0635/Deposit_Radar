from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.schema.contract_schema import ContractCreate, ContractResponse
from backend.app.services.contract_service import create_contract_service, get_contract_service
from backend.app.database.database import get_db

router = APIRouter()

@router.post("/contracts", response_model=ContractResponse)
def create_contract(dto: ContractCreate, db: Session = Depends(get_db)):
    return create_contract_service(db, dto)

@router.get("/contracts/{contract_id}", response_model=ContractResponse)
def get_contract(contract_id: int, db: Session = Depends(get_db)):
    return get_contract_service(db, contract_id)
