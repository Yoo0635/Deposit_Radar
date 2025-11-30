# backend/app/services/risk_engine.py

"""
등기부 diff 결과를 기반으로 위험 이벤트/위험도 수준을 계산하는 엔진 (MVP 버전).
근저당 신규 추가는 위험 이벤트에서 제외하고
가압류/압류, 경매, 근저당 증액만 이벤트로 처리한다.
"""

from typing import Dict, Any, List

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
    diff 결과를 받아 위험 이벤트 목록 및 최종 위험 수준을 계산.
    근저당 신규 추가는 위험이 아니므로 이벤트에서 제외.
    """
    events: List[Dict[str, Any]] = []

    # 1) 을구 added → 가압류 / 경매 탐지
    for item in diff.get("eulgu", {}).get("added", []):
        purpose = item.get("purpose", "")
        rank = item.get("rank")

        # 가압류/압류
        if purpose in SEIZURE_PURPOSES:
            events.append({
                "type": "seizure",
                "level": "HIGH",
                "message": f"가압류/압류 등 ({purpose}) 등기 발생",
                "rank": rank,
            })

        # 경매개시/경매
        if purpose in AUCTION_PURPOSES:
            events.append({
                "type": "auction",
                "level": "CRITICAL",
                "message": f"경매 관련 등기 ({purpose}) 발생",
                "rank": rank,
            })

    # 2) 근저당 증액 탐지
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

    # 최종 위험 수준 계산
    overall_level = _max_level([e["level"] for e in events])

    return {
        "level": overall_level,
        "events": events,
    }

# -------------------------------------------
# 🔥 근저당 담보총액 계산 함수 (LTV 계산용)
# -------------------------------------------
def calculate_total_liens(records):
    """
    records: diff["eulgu"]["added"] + diff["eulgu"]["updated"]
    → max_claim_amount 합산
    """
    total = 0

    for item in records:
        amt = item.get("max_claim_amount")
        if isinstance(amt, (int, float)):
            total += amt

    return total
