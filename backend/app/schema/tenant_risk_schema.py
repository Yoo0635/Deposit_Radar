# backend/app/schema/tenant_risk_schema.py

from pydantic import BaseModel
from typing import List, Optional, Dict


class RiskEvent(BaseModel):
    type: str
    level: str
    message: str
    rank: Optional[int] = None


class TenantRiskProfile(BaseModel):
    contract_id: int
    risk_level: str
    events: List[RiskEvent]

    total_liens: int
    deposit_amount: int
    market_price: int
    ltv: float

    ltv_risk: str
    ltv_color: Dict[str, str]
    
    # 초기 LTV 정보 (비교용)
    initial_ltv: Optional[float] = None
    initial_ltv_risk: Optional[str] = None
    ltv_change: Optional[float] = None  # 변화량 (current - initial)