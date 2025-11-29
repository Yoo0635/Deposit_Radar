# backend/app/schema/tenant_risk_schema.py

from pydantic import BaseModel
from typing import Optional


class TenantRiskProfile(BaseModel):
    """
    임차인 + 시세 정보를 Risk Engine에 넘기기 위한 입력 모델.

    - contract_id: 어떤 계약(집)에 대한 임차인 정보인지 식별
    - tenant_move_in_date: 전입일 (YYYY-MM-DD)
    - tenant_cert_date: 확정일자 (YYYY-MM-DD, 없을 수 있으므로 Optional)
    - deposit_amount: 보증금 (원 단위)
    - market_price: 주택 시세 (원 단위, 시세 API나 수기 입력으로 채움)
    """

    contract_id: int

    tenant_move_in_date: str          # 전입일
    tenant_cert_date: Optional[str] = None  # 확정일자 (없으면 None)

    deposit_amount: int              # 보증금
    market_price: int                # 시세
