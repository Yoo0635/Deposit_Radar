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
        market_price=2_000_000_000,   # 20억원 (고정값)
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

def update_contract_nickname(db: Session, contract_id: int, nickname: str):
    """
    계약의 닉네임만 업데이트
    """
    contract = db.query(ContractORM).filter(ContractORM.id == contract_id).first()
    if not contract:
        return None
    
    contract.nickname = nickname
    db.commit()
    db.refresh(contract)
    return contract

def delete_contract(db: Session, contract_id: int):
    """
    계약 삭제 및 ID 시퀀스 리셋
    """
    contract = db.query(ContractORM).filter(ContractORM.id == contract_id).first()
    if not contract:
        return False
    
    db.delete(contract)
    db.commit()
    
    # ID 시퀀스를 1로 리셋 (다음 생성 시 ID가 1부터 시작)
    try:
        from sqlalchemy import text
        # 현재 테이블의 최대 ID 확인
        result = db.execute(text("SELECT MAX(id) FROM contract_info"))
        max_id = result.scalar()
        
        # 테이블이 비어있으면 시퀀스를 1로 리셋, 아니면 최대 ID + 1로 설정
        if max_id is None:
            db.execute(text("ALTER SEQUENCE contract_info_id_seq RESTART WITH 1"))
        else:
            db.execute(text(f"ALTER SEQUENCE contract_info_id_seq RESTART WITH {max_id + 1}"))
        
        db.commit()
        print(f"✅ ID 시퀀스 리셋 완료 (다음 ID: {max_id + 1 if max_id else 1})")
    except Exception as e:
        print(f"⚠️ ID 시퀀스 리셋 실패 (무시됨): {e}")
        db.rollback()
    
    return True

def update_contract(db: Session, contract_id: int, updates: dict):
    """
    계약 정보 업데이트 (보증금, 날짜, 시세, 초기 LTV 등)
    """
    contract = db.query(ContractORM).filter(ContractORM.id == contract_id).first()
    if not contract:
        return None
    
    if "deposit" in updates and updates["deposit"] is not None:
        contract.deposit = updates["deposit"]
    if "move_in_date" in updates and updates["move_in_date"] is not None:
        contract.move_in_date = updates["move_in_date"]
    if "confirmation_date" in updates and updates["confirmation_date"] is not None:
        contract.confirmation_date = updates["confirmation_date"]
    if "market_price" in updates and updates["market_price"] is not None:
        contract.market_price = updates["market_price"]
    
    # 초기 LTV 관련 필드 업데이트
    if "initial_ltv" in updates:
        contract.initial_ltv = updates["initial_ltv"]
    if "initial_ltv_risk" in updates:
        contract.initial_ltv_risk = updates["initial_ltv_risk"]
    if "initial_total_liens" in updates:
        contract.initial_total_liens = updates["initial_total_liens"]
    if "initial_market_price" in updates:
        contract.initial_market_price = updates["initial_market_price"]
    
    db.commit()
    db.refresh(contract)
    return contract
