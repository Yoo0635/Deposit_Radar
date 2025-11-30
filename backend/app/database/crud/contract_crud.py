from sqlalchemy.orm import Session
from backend.app.models.contract_orm import ContractORM
from backend.app.schema.contract_schema import ContractCreate
from backend.app.services.price_service import extract_jibun_base  # 주소정제

def create_contract(db: Session, dto: ContractCreate):
    obj = ContractORM(
        nickname=dto.nickname,
        address=dto.address,
        address_jibun=extract_jibun_base(dto.address),

        deposit=dto.deposit,
        move_in_date=dto.move_in_date,
        confirmation_date=dto.fixed_date,

        # ⭐⭐⭐ 시세 하드코딩 ⭐⭐⭐
        market_price=120_000_000,   # 1억 2천, 원하는 값으로 변경 가능
    )

    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def get_contract(db: Session, contract_id: int):
    return db.query(ContractORM).filter(ContractORM.id == contract_id).first()

def get_contracts(db: Session):
    return db.query(ContractORM).all()

def get_contract_by_id(db: Session, contract_id: int):
    return db.query(ContractORM).filter(ContractORM.id == contract_id).first()
