from pydantic import BaseModel
from datetime import date
from typing import Optional

class ContractInfo(BaseModel):
    nickname: Optional[str] = None
    address: str
    deposit: int
    move_in_date: Optional[date] = None
    fixed_date: Optional[date] = None
