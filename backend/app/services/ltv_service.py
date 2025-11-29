# backend/app/services/ltv_service.py

"""
LTV (Loan-to-Value) 계산 모듈
- 임차인 보증금 + 등기부 을구(근저당·가압류 등) 담보 합산 금액으로 실제 부채 총액 계산
- 주택 시세 대비 비율을 계산해 위험도를 나누기 위해 사용됨
"""

def calculate_ltv(deposit_amount: int, total_liens: int, market_price: int) -> float:
    """
    LTV = (보증금 + 설정된 담보총액) / 시세 * 100
    """

    if market_price <= 0:
        return 999.9   # 시세 오류 → 위험도 최상위로 처리

    total_debt = deposit_amount + total_liens
    ltv = (total_debt / market_price) * 100

    return round(ltv, 2)


def classify_ltv_risk(ltv: float) -> str:
    """
    LTV 위험도 구간
    - 0% ~ 60%: GREEN
    - 60% ~ 80%: AMBER
    - 80% 이상: RED
    """

    if ltv < 60:
        return "GREEN"

    if ltv < 80:
        return "AMBER"

    return "RED"
