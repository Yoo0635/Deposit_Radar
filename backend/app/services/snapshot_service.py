from backend.app.database.crud.registry_snapshot_crud import (
    get_snapshot_by_contract_id,
    get_snapshot_by_id,
)
from backend.app.database.crud.contract_crud import get_contract_by_id

from backend.app.services.diff_engine import compare_snapshots
from backend.app.services.risk_engine import evaluate_risk, calculate_total_liens
from backend.app.services.ltv_service import compute_ltv, classify_ltv_risk, get_ltv_color

from backend.app.schema.tenant_risk_schema import TenantRiskProfile



# ----------------------------------------------
# ⭐ 시세 하드코딩 (MVP)
# ----------------------------------------------
HARD_CODED_MARKET_PRICE = 120_000_000   # 1억 2천


# 스냅샷 ORM -> dict 변환
def snapshot_to_dict(snapshot):
    return {
        "viewed_at": str(snapshot.viewed_at),
        "gabu": snapshot.gabu,
        "eulgu": snapshot.eulgu,
    }


# 최신 2개 스냅샷 가져오기
def get_latest_two_snapshots(contract_id: int, db):
    snapshots = get_snapshot_by_contract_id(db, contract_id)
    if len(snapshots) < 2:
        return None, None
    return snapshots[-2], snapshots[-1]


# 최종 Risk Profile 생성
def build_tenant_risk_profile(contract, diff, risk_basic, market_price):
    deposit = contract.deposit

    total_liens = calculate_total_liens(
        diff.get("eulgu", {}).get("added", []) +
        diff.get("eulgu", {}).get("updated", [])
    )

    ltv = compute_ltv(deposit, total_liens, market_price)
    ltv_risk = classify_ltv_risk(ltv)
    ltv_color = get_ltv_color(ltv_risk)

    final_level = risk_basic["level"]

    return TenantRiskProfile(
        contract_id=contract.id,
        risk_level=final_level,
        events=risk_basic["events"],
        deposit_amount=deposit,
        total_liens=total_liens,
        market_price=market_price,
        ltv=ltv,
        ltv_risk=ltv_risk,
        ltv_color=ltv_color,
    )


# 최신 스냅샷 비교
def compare_latest_snapshots(contract_id: int, db):
    old, new = get_latest_two_snapshots(contract_id, db)
    if not old or not new:
        return {"error": "스냅샷이 2개 이상 필요합니다."}

    diff = compare_snapshots(snapshot_to_dict(old), snapshot_to_dict(new))
    risk_basic = evaluate_risk(diff)

    contract = get_contract_by_id(db, contract_id)

    # ⭐ 무조건 하드코딩된 시세 사용
    market_price = HARD_CODED_MARKET_PRICE

    profile = build_tenant_risk_profile(contract, diff, risk_basic, market_price)

    return {"old_id": old.id, "new_id": new.id, "diff": diff, "risk": profile}


# 특정 스냅샷 비교
def compare_two_snapshots(old_id: int, new_id: int, db):
    old = get_snapshot_by_id(db, old_id)
    new = get_snapshot_by_id(db, new_id)

    if not old or not new:
        return {"error": "스냅샷을 찾을 수 없습니다."}

    diff = compare_snapshots(snapshot_to_dict(old), snapshot_to_dict(new))
    risk_basic = evaluate_risk(diff)

    contract = get_contract_by_id(db, old.contract_id)

    # ⭐ 하드코딩
    market_price = HARD_CODED_MARKET_PRICE

    profile = build_tenant_risk_profile(contract, diff, risk_basic, market_price)

    return {"old_id": old.id, "new_id": new.id, "diff": diff, "risk": profile}


# 실시간 비교
def compare_live_with_snapshot(contract_id: int, live_data: dict, db):
    snapshots = get_snapshot_by_contract_id(db, contract_id)
    if not snapshots:
        return {"error": "저장된 스냅샷이 없습니다."}

    latest = snapshots[-1]

    diff = compare_snapshots(snapshot_to_dict(latest), live_data)
    risk_basic = evaluate_risk(diff)

    contract = get_contract_by_id(db, contract_id)

    # ⭐ 하드코딩
    market_price = HARD_CODED_MARKET_PRICE

    profile = build_tenant_risk_profile(contract, diff, risk_basic, market_price)

    return {"snapshot_id": latest.id, "diff": diff, "risk": profile}
