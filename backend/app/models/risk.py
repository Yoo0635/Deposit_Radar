"""RiskInput / RiskResult Pydantic 모델 스켈레톤 파일.

위험도 분석 입력·결과 구조를 정의할 예정입니다.
"""

from pydantic import BaseModel
from backend.app.models.registry import RegistrySnapshot
from backend.app.models.contract import ContractInfo

class RiskInput(BaseModel):
    contract: ContractInfo
    previous_snapshot: RegistrySnapshot
    current_snapshot: RegistrySnapshot
    market_price: int   # 시세 (LTV 계산 위함)