from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional

class ContractBase(BaseModel):
    nickname: Optional[str] = None
    address: str
    deposit: int
    move_in_date: Optional[date] = None
    fixed_date: Optional[date] = Field(default=None, alias="confirmation_date")

class ContractCreate(ContractBase):
    class Config:
        populate_by_name = True

class ContractResponse(ContractBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True
