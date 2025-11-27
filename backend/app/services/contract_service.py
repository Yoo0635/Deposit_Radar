from sqlalchemy.orm import Session
from schema.contract_schema import ContractCreate, ContractResponse
from models.contract_orm import ContractORM
from database.crud.contract_crud import create_contract, get_contract


def create_contract_service(db: Session, dto: ContractCreate) -> ContractResponse:
    """
    계약 정보를 저장하는 서비스 계층
    1) DTO가 이미 FastAPI에서 검증됨
    2) CRUD에게 DB 저장 요청
    3) ORM → Response DTO로 변환해 Router로 전달
    """

    obj: ContractORM = create_contract(db, dto)
    response = ContractResponse.model_validate(obj)
    return response


def get_contract_service(db: Session, contract_id: int) -> ContractResponse:
    """
    단일 계약 조회 서비스
    """
    obj = get_contract(db, contract_id)
    if not obj:
        return None
    return ContractResponse.model_validate(obj)
