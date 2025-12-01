# backend/app/routes/risk_route.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.models.contract_orm import ContractORM

from backend.app.services.snapshot_service import get_latest_two_snapshots
from backend.app.services.diff_engine import compare_snapshots
from backend.app.services.risk_engine import evaluate_risk
from backend.app.services.liens_service import extract_total_liens
from backend.app.services.ltv_service import calculate_ltv, classify_ltv_risk, get_ltv_color

from backend.app.services.address_service import search_address
from backend.app.services.price_service import fetch_market_price_by_jibun


from backend.app.schema.tenant_risk_schema import TenantRiskProfile


router = APIRouter(
    prefix="/risk",
    tags=["risk"]
)


@router.post("/{contract_id}", response_model=TenantRiskProfile)
def evaluate_contract_risk(
    contract_id: int,
    db: Session = Depends(get_db)
):
    """
    /risk/{contract_id}
    - 자동 시세 조회
    - 최신 스냅샷 비교
    - 위험 이벤트 계산
    - 담보 총액 계산
    - LTV 계산
    """

    # 1) 계약 정보 조회
    contract = db.query(ContractORM).filter(ContractORM.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="계약을 찾을 수 없습니다.")

    raw_address = contract.address
    deposit_amount = contract.deposit

    # 2) 주소 보정 → 지번 찾기
    corrected = search_address(raw_address)
    if not corrected or corrected.get("jibunAddr") is None:
        raise HTTPException(status_code=502, detail="주소 보정에 실패했습니다.")

    jibun_addr = corrected["jibunAddr"]

    # 3) 국토부 기준 시세 조회
    market_price = fetch_market_price_by_jibun(jibun_addr)
    if market_price is None:
        raise HTTPException(status_code=502, detail="시세 조회에 실패했습니다.")

    # 4) 최신 스냅샷 2개 가져오기
    old, new = get_latest_two_snapshots(contract_id, db)
    if not old or not new:
        raise HTTPException(status_code=404, detail="스냅샷 2개가 필요합니다.")

    diff = compare_snapshots(old.to_dict(), new.to_dict())

    # 5) 위험 이벤트 계산
    risk_result = evaluate_risk(diff)

    # 6) 담보총액 계산
    total_liens = extract_total_liens(new.eulgu)

    # 7) LTV 계산 - 보증금 변경 시 자동으로 재계산됨
    # ⚠️ 중요: deposit_amount는 contract.deposit에서 가져온 최신 값이므로,
    #          보증금이 변경되면 자동으로 새 보증금으로 LTV 계산됨
    #          LTV = (보증금 + 선순위 합계) / 시세 × 100 (동적 계산, 고정값 아님!)
    
    # DB에서 최신 계약 정보 다시 조회 (보증금 변경 반영)
    db.refresh(contract)
    deposit_amount = contract.deposit  # 최신 보증금 사용
    
    ltv_value = calculate_ltv(deposit_amount, total_liens, market_price)
    ltv_risk = classify_ltv_risk(ltv_value)
    ltv_color = get_ltv_color(ltv_risk)
    
    print(f"💡 [LTV 계산] 보증금: {deposit_amount:,}원, 선순위 합계: {total_liens:,}원, 시세: {market_price:,}원")
    print(f"📊 [LTV 결과] {ltv_value:.1f}% → {ltv_risk} 등급")
    
    # 8) 초기 LTV와 비교
    initial_ltv = contract.initial_ltv
    initial_ltv_risk = contract.initial_ltv_risk
    ltv_change = None
    if initial_ltv is not None:
        ltv_change = round(ltv_value - initial_ltv, 2)

    return TenantRiskProfile(
        contract_id=contract_id,
        risk_level=risk_result["level"],
        events=risk_result["events"],
        total_liens=total_liens,
        deposit_amount=deposit_amount,
        market_price=market_price,
        ltv=ltv_value,
        ltv_risk=ltv_risk,
        ltv_color=ltv_color,
        initial_ltv=initial_ltv,
        initial_ltv_risk=initial_ltv_risk,
        ltv_change=ltv_change,
    )