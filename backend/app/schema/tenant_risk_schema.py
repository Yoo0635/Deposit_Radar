# backend/app/schema/tenant_risk_schema.py

from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class RiskEvent(BaseModel):
    type: str
    level: str
    message: str
    rank: Optional[int] = None


class TenantRiskProfile(BaseModel):
    contract_id: int
    risk_level: str
    events: List[RiskEvent]

    # 재정 정보
    total_liens: int
    deposit_amount: int
    market_price: int
    ltv: float
