"""RegistrySnapshot 변환 스켈레톤 파일.

파싱된 텍스트/레이아웃 정보를 RegistrySnapshot JSON 구조로 변환합니다.
"""

from datetime import datetime

def convert_to_registry_snapshot(parsed_data: dict) -> dict:

    if not parsed_data:
        return {"status": "error", "message": "데이터 없음"}

    owner = parsed_data.get("owner", "미확인")
    amount = parsed_data.get("amount", 0)
    real_date = parsed_data.get("date", datetime.now().strftime("%Y-%m-%d"))
    real_no = parsed_data.get("no", "제00000호")

    # 1. 갑구 (소유권)
    gabu_list = []
    if owner != "미확인":
        gabu_list.append({
            "rank": 1,
            "purpose": "소유권이전",
            "receipt": {
                "receipt_date": real_date,
                "receipt_no": real_no
            },
            "owner_name": owner
        })

    # 2. 을구 (근저당)
    eulgu_list = []
    if amount > 0:
        eulgu_list.append({
            "rank": 1,
            "purpose": "근저당권설정",
            "receipt": {
                "receipt_date": real_date,
                "receipt_no": "별도확인"
            },
            "max_claim_amount": amount,
            "status": "유효"
        })

    return {
        "viewed_at": datetime.now().strftime("%Y-%m-%d"),
        "gabu": gabu_list,
        "eulgu": eulgu_list
    }