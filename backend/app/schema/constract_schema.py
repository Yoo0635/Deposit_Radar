from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ContractBase(BaseModel):
    address: str
    deposit: int
    move_in_date: Optional[str] = None
    fixed_date: Optional[str] = None

class ContractResponse(ContractBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True