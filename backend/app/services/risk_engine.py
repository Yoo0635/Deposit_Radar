# backend/app/services/risk_engine.py

"""
등기부 diff 결과를 기반으로 위험 이벤트/위험도 수준을 계산하는 엔진.

입력 형식 (diff 예시):

{
  "gabu": { "added": [], "removed": [], "updated": [] },
  "eulgu": {
    "added": [ { ... } ],
    "removed": [],
    "updated": [ { "old": {...}, "new": {...} } ]
  }
}
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
