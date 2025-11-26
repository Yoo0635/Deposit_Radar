# Deposit Radar (보증금 레이더)

전세 사기를 막기 위해 **등기부 변동을 자동 감지하고, 위험도를 계산해서 알려주는 서비스**입니다.

- 은행/카드사 "등기 변동" 알림을 브릿지 트리거로 사용
- 등기부 PDF/이미지를 OCR로 읽어서 JSON으로 변환
- 이전 등기부와 비교(Diff)해서 **무슨 일이 생겼는지 + 얼마나 위험한지** 계산

이 레포는 위 아이디어를 구현하기 위한 **MVP 뼈대 프로젝트**입니다.

---

## 1. 구조 한눈에 보기

```bash
Deposit_Radar/
├─ backend/                  # FastAPI 백엔드 (실제 로직이 들어갈 곳)
│  ├─ app/
│  │  ├─ main.py             # FastAPI 시작점
│  │  ├─ routes/             # API 엔드포인트 (URL)
│  │  ├─ models/             # 등기부/위험도 Pydantic 모델
│  │  └─ services/           # OCR, Diff, Risk 엔진 자리
│  └─ requirements.txt       # 백엔드 Python 라이브러리 목록
│
├─ mobile/
│  └─ tenant-app/            # 임차인용 React Native 앱 (미구현, 자리만)
│
├─ android-bridge/
│  └─ notification-listener/ # 은행/카드 알림 캡처용 Android 서비스 (자리만)
│
├─ docs/                     # 기타 문서
├─ .env.example              # 환경 변수 예시
├─ .gitignore                # Git에 올리지 않을 파일 설정
└─ README.md
```

지금은 대부분 **빈 뼈대(Stub)**입니다. 앞으로 여기에 기능을 채워 넣는 구조라고 보면 됩니다.

---

## 2. 데이터 흐름 (아주 간단 버전)

1. **브릿지 트리거** (Android)
   - 은행/카드사 알림에서 "등기", "근저당" 같은 키워드를 가진 메시지만 골라서
   - 백엔드로 JSON 전송

2. **등기부 업로드** (모바일 앱 → 백엔드)
   - 사용자가 등기부 PDF/이미지를 업로드 (`/registry/upload`)
   - 백엔드에서 파일 저장 → OCR → "등기부 JSON" 생성

3. **분석** (백엔드)
   - 이전 스냅샷과 비교해서 **어떤 권리가 새로 생겼는지 / 금액이 얼마나 늘었는지** 계산
   - 임차인 전입일·확정일자·보증금·시세를 조합해서 **GREEN / AMBER / RED** 등급 산출

4. **알림 + 가이드** (모바일 앱)
   - "위험도가 올라갔습니다" 푸시
   - 체크리스트, 임대인에게 보낼 문안, 내용증명/배당요구 등 문서(PDF)를 보여줌

---

## 3. 백엔드 빠른 시작

백엔드는 FastAPI로 되어 있습니다.

```bash
cd backend

# 1) 가상환경 만들기
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate

# 2) 라이브러리 설치
pip install -r requirements.txt

# 3) 서버 실행
uvicorn app.main:app --reload
```

이제 브라우저에서 `http://127.0.0.1:8000/health` 에 접속하면

- `{ "status": "ok" }` 응답이 보이면 **백엔드 뼈대가 잘 뜬 것**입니다.

업로드 엔드포인트는 `POST /registry/upload` 로 정의되어 있고,
추후 여기에 **파일 저장 → OCR → Diff → Risk 계산** 로직이 들어갑니다.

---

## 4. 주요 폴더/파일 간단 설명

- `backend/app/main.py`
  - FastAPI 앱을 생성하고, 라우터(health, registry)를 연결하는 진입점입니다.

- `backend/app/routes/health.py`
  - `GET /health` 헬스 체크 엔드포인트.

- `backend/app/routes/registry.py`
  - `POST /registry/upload` 등기부 PDF/이미지 업로드용 엔드포인트.
  - 현재는 파일 이름만 돌려주는 **빈 껍데기**이고, 여기에 실제 로직을 붙이면 됩니다.

- `backend/app/models/registry.py`
  - 등기부 스냅샷 JSON과 Risk 결과를 표현하는 Pydantic 모델이 들어 있습니다.
  - 예: `RegistrySnapshot`, `GabuItem`, `EulguItem`, `RiskResult` 등.

- `backend/app/services/*.py`
  - `ocr_service.py`: PDF/이미지 → 텍스트 → JSON 변환 예정
  - `diff_service.py`: 이전/현재 JSON 비교 예정
  - `risk_engine.py`: GREEN/AMBER/RED 계산 예정

- `mobile/tenant-app/`
  - 임차인용 앱 자리. 나중에 React Native 코드가 들어갈 폴더입니다.

- `android-bridge/notification-listener/`
  - 안드로이드 Notification Listener Service 코드가 들어갈 자리입니다.

---

## 5. 환경 변수(.env) 간단 설명

루트에 `.env.example` 파일이 있습니다.

사용 방법은 다음과 같습니다.

1. `.env.example`를 복사해서 `.env`로 만들기
2. DB 정보, 시크릿 키 등을 실제 값으로 수정
3. FastAPI 설정 코드에서 `python-dotenv`로 `.env`를 읽어 사용

핵심 변수 예시:

- `APP_HOST`, `APP_PORT` : 서버 주소/포트
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` : PostgreSQL 접속 정보
- `FILE_STORAGE_DIR` : 업로드 파일 저장 위치
- `OCR_ENGINE` : 사용할 OCR 엔진(easyocr 등)

---

## 6. 어떻게 확장해 나가면 될까?

1. `registry.py`에 **파일 저장 + OCR 호출** 코드 추가
2. `ocr_service.py`에 PDF/이미지 → `RegistrySnapshot` 변환 로직 구현
3. `diff_service.py`에서 이전/현재 스냅샷 비교
4. `risk_engine.py`에서 규칙 기반으로 GREEN/AMBER/RED 계산
5. 모바일 앱과 안드로이드 브릿지에서 이 API들을 호출하도록 연결

이 README는 **최대한 단순하게 전체 흐름만 잡아주는 용도**입니다.
자세한 로직은 각 `services/*.py`와 `models/*.py` 파일 안에 채워 넣으면 됩니다.
