from sqlalchemy.orm import Session
from models.contract_orm import ContractORM
from schema.contract_schema import ContractCreate

def create_contract(db: Session, dto: ContractCreate):
    obj = ContractORM(
        address=dto.address,
        deposit=dto.deposit,
        move_in_date=dto.move_in_date,
        fixed_date=dto.fixed_date,
    )

    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj