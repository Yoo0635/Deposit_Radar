# backend/app/services/liens_service.py

"""
을구(EULGU) 항목에서 담보 총액(total_liens)을 계산하는 모듈.

담보(total liens)에 포함되는 항목:
 - 근저당권설정  → max_claim_amount 사용
 - 가압류 → max_claim_amount(없으면 0)
 - 압류 → max_claim_amount(없으면 0)
 - 담보권 → max_claim_amount
 - 공동담보 → max_claim_amount

담보(total liens)에 포함되지 않는 항목:
 - 경매개시결정 (담보권 아님)
 - 말소된 등기(status="말소")
"""

from typing import List, Dict


def extract_total_liens(eulgu_entries: List[Dict]) -> int:
    """
    eulgu_entries는 RegistryEntry 또는 dict 형태 둘 다 들어올 수 있음.
    → 내부에서 .get(), getattr 두 가지 방식 모두 지원.

    반환: 담보 총액 (int)
    """

    def get(attr, default=None):
        """RegistryEntry 객체와 dict 모두 대응하도록 안전하게 값 읽기."""
        if isinstance(entry, dict):
            return entry.get(attr, default)
        return getattr(entry, attr, default)

    total = 0

    for entry in eulgu_entries:
        purpose = get("purpose", "")
        status = get("status", "")
        amount = get("max_claim_amount", 0)

        # 1) 말소된 등기는 계산 제외
        if status == "말소":
            continue

        # 2) 근저당 담보
        if "근저당" in purpose:
            total += amount or 0
            continue

        # 3) 가압류 / 압류 → max_claim_amount 없으면 0
        if "가압류" in purpose or "압류" in purpose:
            total += amount or 0
            continue

        # 4) 공동담보/담보권
        if "담보" in purpose:
            total += amount or 0
            continue

        # 5) 경매 개시는 담보 아님
        if "경매" in purpose:
            continue

    return total
