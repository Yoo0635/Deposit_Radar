# Deposit Radar (보증금 레이더)

전세 사기를 막기 위해 **등기부 변동을 자동 감지하고, 위험도를 계산해서 알려주는 서비스**입니다.

- 은행/카드사 "등기 변동" 알림을 브릿지 트리거로 사용
- 등기부 PDF/이미지를 OCR로 읽어서 JSON으로 변환
- 이전 등기부와 비교(Diff)해서 **무슨 일이 생겼는지 + 얼마나 위험한지** 계산

이 레포는 위 아이디어를 구현하기 위한 **MVP 뼈대 프로젝트(코드는 팀이 직접 구현)** 입니다.

---

## 1. 구조 한눈에 보기

```bash
Deposit_Radar/
├─ backend/                  # FastAPI 백엔드 (실제 로직이 들어갈 곳)
│  ├─ app/
│  │  ├─ main.py             # FastAPI 엔트리 포인트로 쓸 파일
│  │  ├─ routes/             # API 엔드포인트 (URL) 모음
│  │  ├─ models/             # 등기부/위험도 Pydantic 모델
│  │  └─ services/           # OCR, Diff, Risk 엔진 로직
│  └─ requirements.txt       # 백엔드 Python 라이브러리 목록 (버전 고정, Python 3.11 기준)
│
├─ mobile/
│  └─ tenant-app/            # 임차인용 React Native 앱 (자리만 있음)
│
├─ android-bridge/
│  └─ notification-listener/ # 은행/카드 알림 캡처용 Android 서비스 (자리만 있음)
│
├─ docs/                     # 기타 문서
├─ .env.example              # 환경 변수 예시
├─ .gitignore                # Git에 올리지 않을 파일 설정
└─ README.md
```

> 현재는 **파일/폴더 구조만 있는 상태**이고, 함수·클래스 등 실제 코드는 팀원이 직접 채워 넣어야 합니다.

---

## 2. 데이터 흐름 (목표 설계)

아직 구현 전이지만, 최종적으로는 아래 흐름을 목표로 합니다.

1. **브릿지 트리거 (Android)**
   - 은행/카드사 알림에서 "등기", "근저당" 같은 키워드를 가진 메시지만 골라서
   - 백엔드로 JSON 전송

2. **등기부 업로드 (모바일 앱 → 백엔드)**
   - 사용자가 등기부 PDF/이미지를 업로드 (예: `POST /registry/upload`)
   - 백엔드에서 파일 저장 → OCR → "등기부 JSON" 생성

3. **분석 (백엔드)**
   - 이전 스냅샷과 비교해서 **어떤 권리가 새로 생겼는지 / 금액이 얼마나 늘었는지** 계산
   - 임차인 전입일·확정일자·보증금·시세를 조합해서 **GREEN / AMBER / RED** 등급 산출

4. **알림 + 가이드 (모바일 앱)**
   - "위험도가 올라갔습니다" 푸시
   - 체크리스트, 임대인에게 보낼 문안, 내용증명/배당요구 등 문서(PDF)를 보여줌

---

## 3. 백엔드 개발 시작 (Python 3.11 기준)

`backend/requirements.txt` 안의 버전들은 **Python 3.11 환경에서 검증하기 위한 조합**입니다.
가능하면 팀 전원이 Python 3.11로 맞춰 사용하는 것을 권장합니다.

```bash
cd backend

# 1) Python 3.11 가상환경 만들기
python3.11 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

# 2) 라이브러리 설치
pip install -r requirements.txt

# 3) (팀이 FastAPI 앱을 구현한 뒤) 서버 실행 예시
uvicorn app.main:app --reload
```

> 주의: 현재 `app/main.py`, `routes/*`, `models/*`, `services/*` 안에는 **구현 코드가 없습니다.**
> FastAPI 앱 생성, 라우터 등록, 엔드포인트 함수, OCR/분석 로직 등은 모두 팀이 직접 작성해야 합니다.

---

## 4. 주요 폴더/파일 역할

- `backend/app/main.py`
  - FastAPI 앱 엔트리 포인트로 사용할 파일입니다.
  - 예) `app = FastAPI()` 생성, `include_router` 호출 등.

- `backend/app/routes/health.py`
  - 헬스 체크용 엔드포인트를 넣을 자리입니다. (예: `GET /health`)

- `backend/app/routes/registry.py`
  - 등기부 업로드/분석 관련 엔드포인트를 넣을 자리입니다. (예: `POST /registry/upload`)

- `backend/app/models/registry.py`
  - 등기부 스냅샷 JSON과 위험도 결과를 표현할 Pydantic 모델을 정의하는 파일입니다.
  - 예시 구조(팀이 직접 구현):
    - `RegistrySnapshot` : `viewed_at`, `gabu`, `eulgu`
    - `GabuItem`, `EulguItem` : 갑구/을구 항목
    - `RiskResult` : GREEN/AMBER/RED, 이유, LTV 등

- `backend/app/services/ocr_service.py`
  - PDF/이미지 → 텍스트 → `RegistrySnapshot` JSON 변환 로직을 구현할 자리입니다.

- `backend/app/services/diff_service.py`
  - 이전/현재 등기부 스냅샷을 비교(Diff)하는 로직을 구현할 자리입니다.

- `backend/app/services/risk_engine.py`
  - 임차인 기준 위험도(GREEN/AMBER/RED)를 계산하는 규칙을 구현할 자리입니다.

- `mobile/tenant-app/`
  - 임차인용 React Native 앱이 들어갈 폴더입니다.

- `android-bridge/notification-listener/`
  - 안드로이드 Notification Listener Service 코드가 들어갈 폴더입니다.

---

## 5. 환경 변수(.env) 사용

루트에 `.env.example` 파일이 있습니다.

사용 방법:

1. `.env.example`를 복사해서 `.env`로 만들기
2. DB 정보, 시크릿 키 등을 실제 값으로 수정
3. FastAPI 설정 코드에서 `python-dotenv`로 `.env`를 읽어 사용

핵심 변수 예시:

- `APP_HOST`, `APP_PORT` : 서버 주소/포트
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` : PostgreSQL 접속 정보
- `FILE_STORAGE_DIR` : 업로드 파일 저장 위치
- `OCR_ENGINE` : 사용할 OCR 엔진(easyocr 등)

---

## 6. 개발 순서 제안 (팀 구현용 TODO)

1. `backend/app/main.py`에 FastAPI 앱 생성 / 라우터 등록 코드 작성
2. `routes/health.py`에 간단한 `GET /health` 엔드포인트 구현
3. `routes/registry.py`에 `POST /registry/upload` 등기부 업로드 엔드포인트 구현
4. `models/registry.py`에 등기부 스냅샷 및 Risk 모델 정의
5. `ocr_service.py`에 OCR 파이프라인(PDF/이미지 → 텍스트 → JSON) 구현
6. `diff_service.py`에 이전/현재 스냅샷 비교 로직 구현
7. `risk_engine.py`에 GREEN/AMBER/RED 계산 규칙 구현
8. 모바일 앱과 안드로이드 브릿지에서 이 API들을 순차적으로 연동

이 README는 **구조와 흐름만 잡아주는 안내서**입니다.
실제 로직은 팀이 자유롭게 설계/구현하면서 채워 넣으면 됩니다.

