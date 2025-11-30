OCR 엔진 모듈 폴더입니다.

부동산 등기부등본(PDF/Image)을 분석하여 **소유자(Owner)**와 **채권최고액(Mortgage Amount)**을 추출하는 OCR 엔진입니다.
Naver Clova OCR API를 사용하여 텍스트를 인식하고, 정규표현식(Regex) 기반 파싱을 통해 핵심 데이터를 구조화합니다.

## ✨ 주요 기능 (Features)

1.  **다중 페이지 PDF 지원**: `PyMuPDF`를 사용하여 수십 장의 등기부등본도 페이지별로 순회하며 분석합니다.
2.  **이미지 전처리**: 해상도 확대(Zoom x2) 및 OpenCV 포맷 변환을 통해 인식률을 극대화했습니다.
3.  **지능형 파싱 (Smart Parsing)**:
    * **소유자 추출**: `주민등록번호 패턴` 및 `블랙리스트 필터링`을 적용하여, 주소(경기도, 수원시)나 법인(신한은행)을 거르고 **실제 집주인**만 찾아냅니다.
    * **채권최고액 추출**: 문서 내 모든 근저당 금액을 탐색하여 가장 큰 금액(Risk)을 산출합니다.
4.  **백엔드 스키마 호환**: Backend API가 요구하는 `gabu`(갑구), `eulgu`(을구) JSON 구조로 자동 변환합니다.

---

## 📂 디렉토리 구조 (Directory Structure)

```bash
ocr_engine/
├── clova/
│   └── client.py          # Naver Clova OCR API 통신 클라이언트ㄴ
├── normalize/
│   ├── parser.py          # 텍스트에서 소유자/금액을 추출하는 정규식 엔진
│   └── to_registry.py     # 추출된 데이터를 백엔드 JSON 규격으로 변환
├── entry.py               # [메인] 외부에서 호출하는 진입점 (Pipeline)
├── requirements.txt       # 의존성 라이브러리 목록
└── README.md              # 설명서
--------------------------------------------------------------------------------------------
## .env 파일 오류로 clinet.py에 하드코딩 방식 적용 주석 확인
# .env 파일 예시
CLOVA_OCR_URL="Your_Invoke_URL"
CLOVA_OCR_KEY="Your_Secret_Key"
--------------------------------------------------------------------------------------------
1. 의존성 설치
pip install -r ocr_engine/requirements.txt
--------------------------------------------------------------------------------------------
2. 사용 예시 (Python Code)

백엔드나 다른 모듈에서 아래와 같이 호출하여 사용합니다.

from ocr_engine.entry import run_ocr
# PDF 파일 경로 입력
file_path = "sample_data/my_home.pdf"
# OCR 분석 실행
result = run_ocr(file_path)
print(result)
--------------------------------------------------------------------------------------------
📊 결과 데이터 예시 (Output Schema)

"viewed_at": "2025-11-29",
  "gabu": [
    {
      "rank": 1,
      "purpose": "소유권이전",
      "receipt": {
        "receipt_date": "2019-02-01",
        "receipt_no": "제26015호"
      },
      "owner_name": "김경숙"
    }
  ],
  "eulgu": [
    {
      "rank": 1,
      "purpose": "근저당권설정",
      "receipt": {
        "receipt_date": "2019-02-01",
        "receipt_no": "별도확인"
      },
      "max_claim_amount": 1080000000,
      "status": "유효"
    }
  ]
}

--------------------------------------------------------------------------------
주의사항 (Notes)
데이터(Dummy Data): rank, purpose, 을구의 receipt_no 등 위험도 분석에 치명적이지 않은 일부 필드는 파싱 복잡도를 낮추기 위해 표준값(Dummy) 또는 '별도확인'으로 처리

유효성 판단: OCR 기술의 한계로 말소사항(취소선)을 완벽히 구분하기 어려움
-> 발견된 모든 채권액은 유효한 위험 요소로 간주하여 보수적으로 처리