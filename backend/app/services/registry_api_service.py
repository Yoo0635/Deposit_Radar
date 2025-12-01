# backend/app/services/registry_api_service.py

import os
import requests
from fastapi import HTTPException

def fetch_registry_data(address: str) -> dict:
    """
    주소를 기준으로 미리 만들어둔 가상의 등기부 데이터를 반환한다.
    """

    # 시나리오 A: 최초 상태 (갑구만 존재)
    if "101" in address:
        return {
            "viewed_at": "2025-11-01",
            "gabu": [
                {
                    "rank": 1,
                    "purpose": "소유권이전",
                    "owner_name": "홍길동",
                    "receipt": {"receipt_no": "R-10001", "receipt_date": "2024-02-01"}
                }
            ],
            "eulgu": []
        }

    # 시나리오 B: 을구에 근저당 새로 생김
    if "102" in address:
        return {
            "viewed_at": "2025-11-10",
            "gabu": [
                {
                    "rank": 1,
                    "purpose": "소유권이전",
                    "owner_name": "홍길동",
                    "receipt": {"receipt_no": "R-10001", "receipt_date": "2024-02-01"}
                }
            ],
            "eulgu": [
                {
                    "rank": 1,
                    "purpose": "근저당권설정",
                    "status": "유효",
                    "max_claim_amount": 200000000,
                    "receipt": {"receipt_no": "R-20001", "receipt_date": "2025-01-15"}
                }
            ]
        }

    # 시나리오 C: 아무 변화 없음
    return {
        "viewed_at": "2025-11-15",
        "gabu": [],
        "eulgu": []
    }
