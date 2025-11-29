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
 - 경매개시결정 (담보권 아님, 이미 채권자에 의해 실행 단계)
 - 말소된 등기(status="말소")
"""

from typing import List
from backend.app.schema.registry_snapshot_schema import EulguEntry


def extract_total_liens(eulgu_entries: List[EulguEntry]) -> int:
    """
    을구 목록에서 실제 담보 역할을 하는 금액만 합산하여 total_liens 계산
    """

    total = 0

    for entry in eulgu_entries:

        # 1) 말소된 등기는 건너뛴다
        if entry.status and entry.status == "말소":
            continue

        purpose = entry.purpose

        # 2) 근저당 → 가장 대표적인 담보권
        if "근저당" in purpose:
            total += entry.max_claim_amount or 0
            continue

        # 3) 가압류 / 압류 → max_claim_amount가 없으면 0 처리
        if "가압류" in purpose or "압류" in purpose:
            total += entry.max_claim_amount or 0
            continue

        # 4) 공동담보 또는 담보권 설정
        if "담보" in purpose:
            total += entry.max_claim_amount or 0
            continue

        # 5) 경매개시결정은 담보가 아니라 실행 단계 → 합산하지 않음
        if "경매" in purpose:
            continue

    return total
