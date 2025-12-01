from sqlalchemy.orm import Session
from backend.app.models.contract_orm import ContractORM
from backend.app.schema.contract_schema import ContractCreate

def create_contract(db: Session, dto: ContractCreate):
    print("🔥 dto.fixed_date =", dto.fixed_date)
    print("🔥 dto =", dto)
    obj = ContractORM(
        nickname=dto.nickname,
        address=dto.address,
        deposit=dto.deposit,
        move_in_date=dto.move_in_date,
        confirmation_date=dto.fixed_date,  # ★ 중요
    )

    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_contract(db: Session, contract_id: int):
    return db.query(ContractORM).filter(ContractORM.id == contract_id).first()

def get_contracts(db: Session):
    return db.query(ContractORM).all()