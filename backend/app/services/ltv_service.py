# backend/app/services/ltv_service.py

"""
LTV 계산 서비스
"""

def calculate_ltv(deposit_amount: int, total_liens: int, market_price: int) -> float:
    """
    LTV = (보증금 + 설정된 담보총액) / 시세 * 100
    """
    if market_price <= 0:
        return 999.9

    total_debt = deposit_amount + total_liens
    ltv = (total_debt / market_price) * 100
    return round(ltv, 2)


def classify_ltv_risk(ltv: float) -> str:
    """
    LTV 위험도 구간
    """
    if ltv < 60:
        return "GREEN"
    if ltv < 80:
        return "AMBER"
    return "RED"
