import re
from datetime import datetime

def parse_registry_data(full_text: str) -> dict:
    "등기부 등본 텍스트에서 핵심 데이터(소유자, 채권최고액 등) 추출"
    if not full_text:
        return None

    # 1. 텍스트 정리
    clean_text = re.sub(r'\s+', ' ', full_text).strip()

    # 소유자(Owner) 찾기
    owner = "미확인"
    
    # 주민번호 패턴 우선 검색
    jumin_matches = re.finditer(r"([가-힣]{2,4})\s*[\d]{6}[-~][\d\*]{6,8}", clean_text)
    blacklist = ["소유자", "권리자", "채무자", "등록", "번호", "경기", "서울", "부산", "대구", "인천", "수원", "오산", "화성", "주식회사", "은행", "금융", "신탁", "공사", "금고", "신한", "국민", "우리", "농협"]

    for match in jumin_matches:
        candidate = match.group(1)
        if not any(bad in candidate for bad in blacklist):
            owner = candidate
            break
            
    # 백업: 소유자 키워드 검색
    if owner == "미확인":
        start_idx = clean_text.find("소유자")
        if start_idx != -1:
            tokens = clean_text[start_idx:start_idx+50].split()
            for token in tokens:
                if re.match(r"^[가-힣]{2,4}$", token) and not any(bad in token for bad in blacklist):
                    owner = token; break

    # 상세 정보 (접수일, 접수번호)
    date_match = re.search(r"(\d{4}년\s*\d{1,2}월\s*\d{1,2}일)", clean_text)
    real_date = datetime.now().strftime("%Y-%m-%d")
    if date_match:
        try:
            raw_date = date_match.group(1).replace(" ", "")
            real_date = datetime.strptime(raw_date, "%Y년%m월%d일").strftime("%Y-%m-%d")
        except: pass

    no_match = re.search(r"(제\s*\d+\s*호)", clean_text)
    real_no = "제00000호"
    if no_match:
        real_no = no_match.group(1).replace(" ", "")

    # 채권최고액 (Amount)
    amount = 0
    money_matches = re.findall(r"채권최고액.*?금\s*([0-9,]+)\s*원", clean_text)
    if money_matches:
        max_amount = 0
        for m in money_matches:
            try:
                val = int(m.replace(",", ""))
                if val > max_amount: max_amount = val
            except: continue
        amount = max_amount
        
    return {
        "owner": owner,
        "amount": amount,
        "date": real_date,
        "no": real_no
    }