from pydantic import BaseModel
from typing import Optional

class ContractInfo(BaseModel):
    address: str              # 사용자가 입력한 주소
    deposit: int              # 보증금 (숫자)
    move_in_date: Optional[str] = None   # 전입일 (YYYY-MM-DD 또는 YYYYMMDD)
    fixed_date: Optional[str] = None     # 확정일자 (YYYY-MM-DD 또는 YYYYMMDD)