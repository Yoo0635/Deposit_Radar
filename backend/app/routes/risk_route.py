from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.models.contract_orm import ContractORM
from backend.app.services.snapshot_service import get_latest_two_snapshots
from backend.app.services.diff_engine import compare_snapshots
from backend.app.services.risk_engine import evaluate_risk
from backend.app.services.liens_service import extract_total_liens
from backend.app.services.ltv_service import calculate_ltv, classify_ltv_risk, get_ltv_color
from backend.app.services.price_service import fetch_market_price
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
    1) contract_id 로 계약 정보 조회
    2) 주소 기반 시세 API 자동 호출
    3) 최신 스냅샷 2개 비교
    4) diff 기반 위험 이벤트 계산
    5) 을구 담보총액 계산
    6) LTV 자동 계산
    """

    # 1) 계약 정보 조회
    contract = db.query(ContractORM).filter(ContractORM.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="계약을 찾을 수 없습니다.")

    address = contract.address
    deposit_amount = contract.deposit

    # 2) 시세 자동 조회
    market_price = fetch_market_price(address)

    # 3) 최신 스냅샷 가져오기
    old, new = get_latest_two_snapshots(contract_id, db)
    if not old or not new:
        raise HTTPException(status_code=404, detail="스냅샷이 2개 이상 필요합니다.")

    diff = compare_snapshots(old.to_dict(), new.to_dict())

    # 4) 위험 이벤트 분석
    risk_events = evaluate_risk(diff)

    # 5) 담보총액 계산
    total_liens = extract_total_liens(new.eulgu)

    # 6) LTV 계산
    ltv_value = calculate_ltv(deposit_amount, total_liens, market_price)
    ltv_risk = classify_ltv_risk(ltv_value)
    ltv_color = get_ltv_color(ltv_risk)

    return TenantRiskProfile(
        contract_id=contract_id,
        risk_level=risk_events["level"],
        events=risk_events["events"],
        total_liens=total_liens,
        deposit_amount=deposit_amount,
        market_price=market_price,
        ltv=ltv_value,
        ltv_risk=ltv_risk,
        ltv_color=ltv_color,
    )
