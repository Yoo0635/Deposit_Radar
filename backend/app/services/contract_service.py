from fastapi import HTTPException
from sqlalchemy.orm import Session
from backend.app.models.contract_orm import ContractORM
from backend.app.schema.contract_schema import ContractCreate, ContractResponse
from backend.app.database.crud.contract_crud import create_contract, get_contract, get_contracts

def create_contract_service(db: Session, dto: ContractCreate) -> ContractResponse:
    obj: ContractORM = create_contract(db, dto)
    return ContractResponse.model_validate(obj)

def get_contract_service(db: Session, contract_id: int) -> ContractResponse:
    obj = get_contract(db, contract_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Contract not found")

    return ContractResponse.model_validate(obj)

def get_contracts_service(db: Session) -> list[ContractResponse]:
    objs = get_contracts(db)
    return [ContractResponse.model_validate(obj) for obj in objs]