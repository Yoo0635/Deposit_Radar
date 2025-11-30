# services/address_service.py

import requests
import os
from dotenv import load_dotenv

load_dotenv()

JUSO_KEY = os.getenv("JUSO_API_KEY")
BASE_URL = "https://business.juso.go.kr/addrlink/addrLinkApi.do"


def get_corrected_address(keyword: str):
    params = {
        "confmKey": JUSO_KEY,
        "currentPage": 1,
        "countPerPage": 5,
        "keyword": keyword,
        "resultType": "json",
    }

    res = requests.get(BASE_URL, params=params)
    data = res.json()

    results = data.get("results", {})
    common = results.get("common", {})

    if common.get("errorCode") != "0":
        raise Exception(f"행안부 API 오류: {common.get('errorCode')} / {common.get('errorMessage')}")

    juso_list = results.get("juso", [])
    if not juso_list:
        return None

    first = juso_list[0]
    return {
        "roadAddr": first.get("roadAddr"),
        "jibunAddr": first.get("jibunAddr"),
        "zipNo": first.get("zipNo"),
        "bdNm": first.get("bdNm"),
    }


# ⭐ 여기 추가해야 함
def search_address(keyword: str):
    """
    FastAPI route에서 사용하는 함수.
    get_corrected_address 함수를 감싸서 반환.
    """
    return get_corrected_address(keyword)

print("==== DEBUG JUSO_KEY ====")
print("JUSO_KEY:", repr(JUSO_KEY))
print("========================")
