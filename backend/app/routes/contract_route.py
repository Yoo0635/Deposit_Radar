from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.schema.contract_schema import ContractCreate, ContractResponse, ContractUpdate
from backend.app.services.contract_service import create_contract_service, get_contract_service, get_contracts_service, update_contract_nickname_service, delete_contract_service, update_contract_service
from backend.app.database.database import get_db

router = APIRouter()

class NicknameUpdate(BaseModel):
    nickname: str

@router.post("/contracts", response_model=ContractResponse)
def create_contract(dto: ContractCreate, db: Session = Depends(get_db)):
    print(f"📝 [주택 등록 요청] 주소: {dto.address}, 보증금: {dto.deposit}, 전입일: {dto.move_in_date}, 확정일: {dto.fixed_date}")
    result = create_contract_service(db, dto)
    print(f"✅ [주택 등록 성공] ID: {result.id}, 닉네임: {result.nickname or '(없음)'}")
    return result

@router.get("/contracts/{contract_id}", response_model=ContractResponse)
def get_contract(contract_id: int, db: Session = Depends(get_db)):
    return get_contract_service(db, contract_id)

@router.get("/contracts", response_model=list[ContractResponse])
def list_contracts(db: Session = Depends(get_db)):
    contracts = get_contracts_service(db)
    print(f"📋 [주택 목록 조회] 총 {len(contracts)}개 주택 조회됨")
    return contracts

@router.patch("/contracts/{contract_id}/nickname", response_model=ContractResponse)
def update_nickname(contract_id: int, nickname_update: NicknameUpdate, db: Session = Depends(get_db)):
    """
    계약의 닉네임 업데이트
    """
    print(f"✏️ [닉네임 업데이트 요청] Contract ID: {contract_id}, 닉네임: {nickname_update.nickname}")
    result = update_contract_nickname_service(db, contract_id, nickname_update.nickname)
    print(f"✅ [닉네임 업데이트 성공] ID: {result.id}, 닉네임: {result.nickname}")
    return result

@router.delete("/contracts/{contract_id}")
def delete_contract(contract_id: int, db: Session = Depends(get_db)):
    """
    계약 삭제
    """
    print(f"🗑️ [주택 삭제 요청] Contract ID: {contract_id}")
    success = delete_contract_service(db, contract_id)
    if not success:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Contract not found")
    print(f"✅ [주택 삭제 성공] ID: {contract_id}")
    return {"message": "Contract deleted successfully", "id": contract_id}

@router.patch("/contracts/{contract_id}", response_model=ContractResponse)
def update_contract(contract_id: int, updates: ContractUpdate, db: Session = Depends(get_db)):
    """
    계약 정보 업데이트 (시연용 - Swagger UI에서 테스트)
    - 보증금, 전입일, 확정일자, 시세 등을 수동으로 변경 가능
    """
    print(f"🔄 [계약 정보 업데이트 요청] Contract ID: {contract_id}")
    print(f"   업데이트 내용: {updates.model_dump(exclude_unset=True)}")
    
    updates_dict = updates.model_dump(exclude_unset=True)
    result = update_contract_service(db, contract_id, updates_dict)
    
    print(f"✅ [계약 정보 업데이트 성공] ID: {result.id}")
    return result    