import requests

def fetch_market_price(address: str) -> int:
    """
    주소 기반 시세 조회 (CodeF 또는 국토부 API)
    시연용: 실제 API 대신 테스트용 mock 데이터 반환
    """

    # TODO: 실제 API 붙일 때 여기에 작성
    # response = requests.get(...)
    # return response.json()["price"]

    # 🔥 임시: 시세 5억 반환 (MVP용)
    return 500000000
