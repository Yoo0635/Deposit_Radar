# backend/app/services/risk_engine.py

"""
1) diff 기반 위험 탐지 (기존 너 코드 그대로 유지)
2) LTV + 선후순위(Priority) + diff 이벤트 결합한 최종 Risk Engine 추가
"""

from typing import Dict, Any, List
from backend.app.services.ltv_service import calculate_ltv, classify_ltv_risk
from backend.app.services.liens_service import extract_total_liens
from backend.app.schema.tenant_risk_schema import TenantRiskProfile


# ============================
# 🔷 1. 기존 너의 Risk Engine (diff 기반)
# ============================

SEIZURE_PURPOSES = [
    "가압류",
    "압류",
    "채권압류",
    "체납처분압류",
]

AUCTION_PURPOSES = [
    "경매",
    "경매개시결정",
    "강제경매개시결정",
    "임의경매개시결정",
    "임의경매",
]


def _max_level(levels: List[str]) -> str:
    order = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}
    if not levels:
        return "LOW"
    return max(levels, key=lambda lv: order.get(lv, 0))


def evaluate_risk(diff: Dict[str, Any]) -> Dict[str, Any]:
    """
    diff 결과를 받아서
    - 근저당 증액
    - 가압류(압류 계열)
    - 경매 개시
    를 찾아내고, 이벤트 목록과 전체 위험 레벨을 반환.
    """
    events: List[Dict[str, Any]] = []

    # 1) 을구 added → 가압류 / 경매 탐지
    for item in diff.get("eulgu", {}).get("added", []):
        purpose = item.get("purpose", "")
        rank = item.get("rank")

        if purpose in SEIZURE_PURPOSES:
            events.append({
                "type": "seizure",
                "level": "HIGH",
                "message": f"가압류/압류 등 ({purpose}) 등기 발생",
                "rank": rank,
            })

        if purpose in AUCTION_PURPOSES:
            events.append({
                "type": "auction",
                "level": "CRITICAL",
                "message": f"경매 관련 등기 ({purpose}) 발생",
                "rank": rank,
            })

    # 2) 을구 updated → 근저당 증액 탐지
    for change in diff.get("eulgu", {}).get("updated", []):
        old = change.get("old", {})
        new = change.get("new", {})

        if old.get("purpose") == "근저당권설정":
            old_amt = old.get("max_claim_amount") or 0
            new_amt = new.get("max_claim_amount") or 0

            if new_amt > old_amt:
                events.append({
                    "type": "mortgage_increase",
                    "level": "HIGH",
                    "message": f"근저당 채권최고액 증액 ({old_amt} → {new_amt})",
                    "rank": old.get("rank"),
                })

    overall_level = _max_level([e["level"] for e in events])

    return {
        "level": overall_level,
        "events": events,
    }


# ============================
# 🔶 2. 확장 Risk Engine (diff + LTV + Priority 결합)
# ============================

def evaluate_diff_risk(diff: Dict[str, Any]) -> Dict[str, Any]:
    """
    diff 기반 위험 이벤트를 정규화하여 확장 엔진에서 사용 가능하게 변환.
    """
    base = evaluate_risk(diff)  # 기존 엔진 그대로 활용
    return {
        "level": base["level"],
        "events": base["events"]
    }


def evaluate_priority(tenant: TenantRiskProfile, snapshot: Dict[str, Any]) -> str:
    """
    매우 단순한 MVP Priority 계산:
      - 전입일이 모든 을구 등기 접수일보다 빠르면 선순위(PRIORITY)
      - 늦으면 후순위(SUBORDINATE)
    """

    tenant_date = tenant.tenant_move_in_date
    eulgu_dates = [
        entry["receipt"]["receipt_date"]
        for entry in snapshot.get("eulgu", [])
    ]

    if not eulgu_dates:
        return "PRIORITY"

    earliest = min(eulgu_dates)

    return "PRIORITY" if tenant_date < earliest else "SUBORDINATE"


def evaluate_final_risk(
    diff: Dict[str, Any],
    tenant: TenantRiskProfile,
    snapshot: Dict[str, Any]
):
    """
    최종 위험도 평가:
     - diff 위험도
     - LTV 위험도
     - Priority(선순위/후순위)
     조합하여 최종 Risk Level 생성
    """

    # 1) diff risk
    diff_risk = evaluate_diff_risk(diff)
    diff_level = diff_risk["level"]

    # 2) 총 담보금액 계산
    total_liens = extract_total_liens(snapshot.get("eulgu", []))

    # 3) LTV 계산
    ltv_value = calculate_ltv(
        deposit_amount=tenant.deposit_amount,
        total_liens=total_liens,
        market_price=tenant.market_price
    )
    ltv_level = classify_ltv_risk(ltv_value)

    # 4) Priority 계산
    priority = evaluate_priority(tenant, snapshot)

    # ------------------------
    # 5) 최종 위험도 결정
    # ------------------------
    final_level = "GREEN"

    # 경매 발생 = 무조건 CRITICAL
    if diff_level == "CRITICAL":
        final_level = "CRITICAL"
    else:
        # diff HIGH
        if diff_level == "HIGH":
            final_level = "HIGH"

        # LTV 위험도 반영
        if ltv_level == "RED":
            final_level = "CRITICAL"
        elif ltv_level == "AMBER" and final_level == "GREEN":
            final_level = "AMBER"

        # 후순위일수록 위험 증가
        if priority == "SUBORDINATE":
            if final_level == "GREEN":
                final_level = "AMBER"

    return {
        "final_level": final_level,
        "ltv": ltv_value,
        "ltv_level": ltv_level,
        "priority": priority,
        "diff_risk": diff_risk
    }
