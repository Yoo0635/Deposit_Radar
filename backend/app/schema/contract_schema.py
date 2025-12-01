from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional

class ContractBase(BaseModel):
    nickname: Optional[str] = None
    address: str
    deposit: int  # 필수 필드 (계약 전에도 알 수 있음)
    move_in_date: Optional[date] = None  # 선택 필드 (계약 후 확정)
    fixed_date: Optional[date] = Field(default=None, alias="confirmation_date")  # 선택 필드 (계약 후 확정)

class ContractCreate(ContractBase):
    class Config:
        populate_by_name = True

class ContractUpdate(BaseModel):
    """계약 정보 업데이트 (시연용 - Swagger UI에서 테스트)"""
    deposit: Optional[int] = None
    move_in_date: Optional[date] = None
    confirmation_date: Optional[date] = None
    market_price: Optional[int] = None  # 시세 수동 설정

    class Config:
        populate_by_name = True

class ContractResponse(ContractBase):
    id: int
    created_at: datetime
    initial_ltv: Optional[float] = None
    initial_ltv_risk: Optional[str] = None
    market_price: Optional[int] = None

    class Config:
        from_attributes = True
        populate_by_name = True
