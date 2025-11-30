from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.services.snapshot_service import get_latest_two_snapshots
from backend.app.services.diff_engine import compare_snapshots
from backend.app.services.risk_engine import evaluate_risk
from backend.app.services.liens_service import extract_total_liens
from backend.app.services.ltv_service import (
    compute_ltv,
    classify_ltv_risk,
    get_ltv_color,
)
from backend.app.schema.tenant_risk_schema import TenantRiskProfile


# 🔥 risk 전용 그룹 생성
router = APIRouter(
    prefix="/risk",
    tags=["risk"]
)


@router.post("/{contract_id}", response_model=TenantRiskProfile)
def evaluate_contract_risk(
    contract_id: int,
    body: dict,
    db: Session = Depends(get_db)
):
    """
    계약 ID 기준으로 최신 스냅샷 2개 diff → 위험 이벤트 + 총 담보 → LTV → 종합 위험도 계산
    """

    # 1) 요청 body 파싱
    try:
        deposit_amount = body["deposit_amount"]
        market_price = body["market_price"]
    except KeyError:
        raise HTTPException(status_code=400, detail="deposit_amount, market_price 모두 필요합니다.")

    # 2) 최신 스냅샷 2개 가져오기
    old, new = get_latest_two_snapshots(contract_id, db)
    if not old or not new:
        raise HTTPException(status_code=404, detail="스냅샷이 2개 이상 필요합니다.")

    # 3) diff 엔진으로 가·을구 변화 계산
    diff = compare_snapshots(old.to_dict(), new.to_dict())

    # 4) 위험 이벤트 분석
    risk_events = evaluate_risk(diff)

    # 5) 을구에서 담보 역할 금액만 합산
    total_liens = extract_total_liens(new.eulgu)

    # 6) LTV 계산 (🔥 compute_ltv로 통일)
    ltv = compute_ltv(
        deposit_amount=deposit_amount,
        total_liens=total_liens,
        market_price=market_price,
    )

    # 7) LTV 위험 등급 + LTV 색상
    ltv_risk = classify_ltv_risk(ltv)
    ltv_color = get_ltv_color(ltv_risk)

    # 8) 최종 통합 위험 프로필 반환
    return TenantRiskProfile(
        contract_id=contract_id,
        risk_level=risk_events["level"],
        events=risk_events["events"],
        total_liens=total_liens,
        deposit_amount=deposit_amount,
        market_price=market_price,
        ltv=ltv,
        ltv_risk=ltv_risk,
        ltv_color=ltv_color,
    )
