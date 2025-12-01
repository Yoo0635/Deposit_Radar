from fastapi import HTTPException
from sqlalchemy.orm import Session
from backend.app.models.contract_orm import ContractORM
from backend.app.schema.contract_schema import ContractCreate, ContractResponse
from backend.app.database.crud.contract_crud import create_contract, get_contract, get_contracts

def create_contract_service(db: Session, dto: ContractCreate) -> ContractResponse:
    obj: ContractORM = create_contract(db, dto)
    try:
        contract_dict = {
            "id": obj.id,
            "nickname": obj.nickname,
            "address": obj.address,
            "deposit": obj.deposit,
            "move_in_date": obj.move_in_date if obj.move_in_date else None,
            "fixed_date": obj.confirmation_date if obj.confirmation_date else None,
            "created_at": obj.created_at,
            "initial_ltv": getattr(obj, 'initial_ltv', None),
            "initial_ltv_risk": getattr(obj, 'initial_ltv_risk', None),
            "market_price": getattr(obj, 'market_price', None),
        }
        return ContractResponse(**contract_dict)
    except Exception as e:
        import traceback
        print(f"❌ 계약 생성 후 변환 오류: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"계약 생성 후 변환 실패: {str(e)}")

def get_contract_service(db: Session, contract_id: int) -> ContractResponse:
    obj = get_contract(db, contract_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Contract not found")

    try:
        # 안전하게 모델 변환
        contract_dict = {
            "id": obj.id,
            "nickname": obj.nickname,
            "address": obj.address,
            "deposit": obj.deposit,
            "move_in_date": obj.move_in_date if obj.move_in_date else None,
            "fixed_date": obj.confirmation_date if obj.confirmation_date else None,
            "created_at": obj.created_at,
            "initial_ltv": getattr(obj, 'initial_ltv', None),
            "initial_ltv_risk": getattr(obj, 'initial_ltv_risk', None),
            "market_price": getattr(obj, 'market_price', None),
        }
        return ContractResponse(**contract_dict)
    except Exception as e:
        import traceback
        print(f"❌ 계약 정보 변환 오류 (ID: {contract_id}): {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"계약 정보 변환 실패: {str(e)}")

def get_contracts_service(db: Session) -> list[ContractResponse]:
    try:
        objs = get_contracts(db)
        result = []
        for obj in objs:
            try:
                # 안전하게 모델 변환 (날짜 필드 처리)
                contract_dict = {
                    "id": obj.id,
                    "nickname": obj.nickname,
                    "address": obj.address,
                    "deposit": obj.deposit,
                    "move_in_date": obj.move_in_date if obj.move_in_date else None,
                    "fixed_date": obj.confirmation_date if obj.confirmation_date else None,
                    "created_at": obj.created_at,
                    "initial_ltv": getattr(obj, 'initial_ltv', None),
                    "initial_ltv_risk": getattr(obj, 'initial_ltv_risk', None),
                    "market_price": getattr(obj, 'market_price', None),
                }
                result.append(ContractResponse(**contract_dict))
            except Exception as e:
                print(f"⚠️ 계약 변환 오류 (ID: {obj.id}): {e}")
                # 기본값으로 처리
                contract_dict = {
                    "id": obj.id,
                    "nickname": obj.nickname,
                    "address": obj.address,
                    "deposit": obj.deposit,
                    "move_in_date": None,
                    "fixed_date": None,
                    "created_at": obj.created_at,
                    "initial_ltv": None,
                    "initial_ltv_risk": None,
                    "market_price": None,
                }
                result.append(ContractResponse(**contract_dict))
        return result
    except Exception as e:
        import traceback
        print(f"❌ 주택 목록 조회 오류: {e}")
        print(traceback.format_exc())
        raise

def delete_contract_service(db: Session, contract_id: int) -> bool:
    from backend.app.database.crud.contract_crud import delete_contract
    return delete_contract(db, contract_id)

def update_contract_nickname_service(db: Session, contract_id: int, nickname: str) -> ContractResponse:
    from backend.app.database.crud.contract_crud import update_contract_nickname
    obj = update_contract_nickname(db, contract_id, nickname)
    if obj is None:
        raise HTTPException(status_code=404, detail="Contract not found")
    try:
        contract_dict = {
            "id": obj.id,
            "nickname": obj.nickname,
            "address": obj.address,
            "deposit": obj.deposit,
            "move_in_date": obj.move_in_date if obj.move_in_date else None,
            "fixed_date": obj.confirmation_date if obj.confirmation_date else None,
            "created_at": obj.created_at,
            "initial_ltv": getattr(obj, 'initial_ltv', None),
            "initial_ltv_risk": getattr(obj, 'initial_ltv_risk', None),
            "market_price": getattr(obj, 'market_price', None),
        }
        return ContractResponse(**contract_dict)
    except Exception as e:
        import traceback
        print(f"❌ 닉네임 업데이트 후 변환 오류: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"닉네임 업데이트 후 변환 실패: {str(e)}")

def update_contract_service(db: Session, contract_id: int, updates: dict) -> ContractResponse:
    """계약 정보 업데이트 (보증금, 날짜, 시세 등)"""
    from backend.app.database.crud.contract_crud import update_contract
    obj = update_contract(db, contract_id, updates)
    if obj is None:
        raise HTTPException(status_code=404, detail="Contract not found")
    try:
        contract_dict = {
            "id": obj.id,
            "nickname": obj.nickname,
            "address": obj.address,
            "deposit": obj.deposit,
            "move_in_date": obj.move_in_date if obj.move_in_date else None,
            "fixed_date": obj.confirmation_date if obj.confirmation_date else None,
            "created_at": obj.created_at,
            "initial_ltv": getattr(obj, 'initial_ltv', None),
            "initial_ltv_risk": getattr(obj, 'initial_ltv_risk', None),
            "market_price": getattr(obj, 'market_price', None),
        }
        return ContractResponse(**contract_dict)
    except Exception as e:
        import traceback
        print(f"❌ 계약 업데이트 후 변환 오류: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"계약 업데이트 후 변환 실패: {str(e)}")