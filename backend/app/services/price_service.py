# backend/app/services/price_service.py

import requests
import os
from dotenv import load_dotenv
from typing import Optional, List
import xmltodict
import re

load_dotenv()

# -----------------------------
# 🔑 환경변수
# -----------------------------
MLT_KEY = os.getenv("MLT_PRICE_KEY")  # 국토부 실거래가 API 키
JUSO_KEY = os.getenv("JUSO_KEY")      # 행안부 주소 API 키

# -----------------------------
# 📌 API URL
# -----------------------------
JUSO_URL = "https://business.juso.go.kr/addrlink/addrLinkApi.do"
RENT_URL = "https://apis.data.go.kr/1613000/RTMSDataSvcRHRent/getRTMSDataSvcRHRent"


# ============================================================================
# 1) 주소 전처리: '동 + 지번'만 추출 (MVP)
# ============================================================================
def extract_jibun_base(addr: str) -> str:
    """
    전체 주소에서 '동 + 지번'만 추출 (빌라명/호수 제거)
    예:
      '서울 강남구 개포동 1211-7 더블루하우스 202호'
        → '개포동 1211-7'
    """
    # 동 + 숫자
    match = re.search(r"([가-힣A-Za-z0-9]+동)\s+(\d+-?\d*)", addr)
    if match:
        dong = match.group(1)
        jibun = match.group(2)
        return f"{dong} {jibun}"

    # fallback: 구 + 동 + 지번
    match2 = re.search(r"(.*?구\s+[가-힣A-Za-z0-9]+동?\s+\d+-?\d*)", addr)
    if match2:
        return match2.group(1).strip()

    # 최후 fallback
    return addr.strip()


# ============================================================================
# 2) 행안부 주소검색 → 법정동코드(admCd)
# ============================================================================
def get_beopjeongdong_code(jibun_addr: str) -> Optional[str]:
    print(f"📌 행안부 주소검색: '{jibun_addr}'")

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
        print("❌ ERROR: 행안부 API JSON 파싱 실패")
        return None

    juso_list = data.get("results", {}).get("juso", [])
    if not juso_list:
        print("❌ 행안부 API 결과 없음")
        return None

    adm_cd = juso_list[0].get("admCd")
    print("➡️ admCd =", adm_cd)
    return adm_cd


# ============================================================================
# 3) 연립·다가구 전월세 실거래가 조회 → 보증금 리스트 반환
# ============================================================================
def fetch_rent_prices(lawd_cd: str) -> List[int]:
    print(f"📌 국토부 전월세 조회: LAWD_CD={lawd_cd}")

    params = {
        "serviceKey": MLT_KEY,
        "LAWD_CD": lawd_cd,
        "DEAL_YMD": "202310",   # MVP: 최근월 하드코딩
    }

    res = requests.get(RENT_URL, params=params)

    try:
        parsed = xmltodict.parse(res.text)
    except:
        print("❌ ERROR: XML 파싱 실패")
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
            try:
                value = int(deposit.replace(",", "").strip())
                if value > 0:
                    prices.append(value)
            except:
                continue

    print(f"➡️ 전월세 보증금 {len(prices)}개 추출됨")
    return prices


# ============================================================================
# 4) 최종 시세 계산 (전세 평균)
# ============================================================================
def fetch_market_price_by_jibun(jibun_addr: str) -> Optional[int]:
    print("\n===============================")
    print("🔥 시세 조회 시작")
    print("입력 주소 =", jibun_addr)

    # 1) 주소 정제
    base_addr = extract_jibun_base(jibun_addr)
    print("➡️ 정제된 지번주소 =", base_addr)

    # 2) 법정동 코드 조회
    adm_cd = get_beopjeongdong_code(base_addr)
    if not adm_cd:
        print("❌ ERROR: 법정동 코드 없음 → 시세 계산 실패")
        print("===============================\n")
        return None

    lawd_cd = adm_cd[:5]
    print("➡️ LAWD_CD =", lawd_cd)

    # 3) 실거래가 조회
    rent_prices = fetch_rent_prices(lawd_cd)
    if not rent_prices:
        print("❌ ERROR: 전월세 데이터 없음")
        print("===============================\n")
        return None

    # 4) 평균 계산
    avg_price = sum(rent_prices) // len(rent_prices)

    print("📌 최종 전세 시세(평균) =", avg_price)
    print("===============================\n")

    return avg_price
