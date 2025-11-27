"""등기부 스냅샷"""

from pydantic import BaseModel
from typing import Optional, List

# 접수 정보 (날짜 + 번호)
class Receipt(BaseModel):
    receipt_date: str    # 접수일자 (YYYY-MM-DD)
    receipt_no: str      # 접수번호(호)

# 갑구/을구 개별 항목
class RegistryEntry(BaseModel):
    rank: int                    # 순위번호
    purpose: str                 # 등기목적
    receipt: Optional[Receipt]   # 접수(일자, 번호)

    # 갑구 전용
    owner_name: Optional[str]

    # 을구 전용
    max_claim_amount: Optional[int]
    status: Optional[str]  # 등기 상태 (유효/말소 등)

# 전체 스냅샷
class RegistrySnapshot(BaseModel):
    viewed_at: str               # 열람일시
    gabu: List[RegistryEntry]    # 갑구
    eulgu: List[RegistryEntry]   # 을구