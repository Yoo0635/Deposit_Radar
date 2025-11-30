# backend/app/services/price_service.py

import requests
import os
from dotenv import load_dotenv
from typing import Optional, List
import xmltodict

load_dotenv()

# 환경변수
MLT_KEY = os.getenv("MLT_PRICE_KEY")  # 국토부 실거래가 API 키
JUSO_KEY = os.getenv("JUSO_KEY")      # 행안부 주소 API 키

# API URL
JUSO_URL = "https://business.juso.go.kr/addrlink/addrLinkApi.do"

# 연립·다세대 전월세 실거래가 조회 URL
RENT_URL = "https://apis.data.go.kr/1613000/RTMSDataSvcRHRent/getRTMSDataSvcRHRent"


# ------------------------------------------------------
# 1) 행안부 주소 → 법정동 코드(admCd)
# ------------------------------------------------------
def get_beopjeongdong_code(jibun_addr: str) -> Optional[str]:
    params = {
        "confmKey": JUSO_KEY,
        "currentPage": 1,
        "countPerPage": 5,
        "keyword": jibun_addr,
        "resultType": "json",
    }

    res = requests.get(JUSO_URL, params=params)
    try:
        data = res.json()
    except:
        print("ERROR: 행안부 API JSON 파싱 실패")
        return None

    juso_list = data.get("results", {}).get("juso", [])
    if not juso_list:
        print("ERROR: 행안부 API 결과 없음")
        return None

    return juso_list[0].get("admCd")  # 법정동코드 10자리


# ------------------------------------------------------
# 2) 연립·다가구 전월세 실거래가 조회 (전세 보증금)
# ------------------------------------------------------
def fetch_rent_prices(lawd_cd: str) -> List[int]:
    params = {
        "serviceKey": MLT_KEY,
        "LAWD_CD": lawd_cd,
        "DEAL_YMD": "202310",   # 최근월 (나중에 자동화 가능)
    }

    res = requests.get(RENT_URL, params=params)

    print("\n=== DEBUG RENT RAW XML ===")
    print(res.text[:300])
    print("==========================\n")

    try:
        parsed = xmltodict.parse(res.text)
    except:
        print("ERROR: 전월세 XML 파싱 실패")
        return []

    items = (
        parsed
        .get("response", {})
        .get("body", {})
        .get("items", {})
        .get("item", [])
    )

    if isinstance(items, dict):
        items = [items]

    prices = []

    for item in items:
        deposit = item.get("deposit")
        if deposit:
            deposit_value = int(deposit.replace(",", "").strip())
            if deposit_value > 0:
                prices.append(deposit_value)

    print(f"DEBUG >>> 전월세 보증금 {len(prices)}개 추출됨")
    return prices


# ------------------------------------------------------
# 3) 최종 시세 계산 (전세 평균)
# ------------------------------------------------------
def fetch_market_price_by_jibun(jibun_addr: str) -> Optional[int]:
    print("DEBUG >>> 입력된 지번주소 =", jibun_addr)

    # 1) 주소 → 법정동 코드
    adm_cd = get_beopjeongdong_code(jibun_addr)
    print("DEBUG >>> admCd =", adm_cd)

    if adm_cd is None:
        print("ERROR: 법정동코드 없음 → 시세 계산 불가")
        return None

    lawd_cd = adm_cd[:5]  # 앞 5자리 지역 코드
    print("DEBUG >>> LAWD_CD =", lawd_cd)

    # 2) 전월세 실거래 가져오기
    rent_prices = fetch_rent_prices(lawd_cd)

    if not rent_prices:
        print("ERROR: 전월세 데이터 없음 → None 반환")
        return None

    # 평균값 산출
    avg_price = sum(rent_prices) // len(rent_prices)
    print("DEBUG >>> 최종 전월세 평균 시세 =", avg_price)

    return avg_price
