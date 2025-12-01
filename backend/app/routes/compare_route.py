# backend/app/routes/compare_route.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.services.snapshot_service import (
    compare_latest_snapshots,
    compare_two_snapshots,
    compare_live_with_snapshot,
)

router = APIRouter(prefix="/compare", tags=["Compare"])


@router.get("/latest/{contract_id}")
def compare_latest(contract_id: int, db: Session = Depends(get_db)):
    """
    특정 계약(contract_id)에 대해, 저장된 스냅샷 중
    최신 2개를 비교해서 diff + risk 를 반환.
    
    시연용: Swagger UI에서 이 엔드포인트를 호출하면
    Diff 엔진과 Risk 엔진이 작동하여 결과를 반환합니다.
    """
    print(f"🔍 [Diff/Risk 분석 요청] Contract ID: {contract_id}")
    result = compare_latest_snapshots(contract_id, db)
    print(f"✅ [Diff/Risk 분석 완료] Contract ID: {contract_id}")
    risk_obj = result.get('risk')
    if risk_obj:
        print(f"   위험도: {risk_obj.risk_level}")
    else:
        print(f"   위험도: N/A")
    return result


@router.get("/{old_id}/{new_id}")
def compare_specific(old_id: int, new_id: int, db: Session = Depends(get_db)):
    """
    스냅샷 id 두 개를 직접 지정해서 diff + risk 를 비교.
    """
    return compare_two_snapshots(old_id, new_id, db)


@router.post("/live/{contract_id}")
def compare_live(contract_id: int, live_data: dict, db: Session = Depends(get_db)):
    """
    실시간 조회(live_data)와 마지막 스냅샷을 비교.
    """
    return compare_live_with_snapshot(contract_id, live_data, db)
