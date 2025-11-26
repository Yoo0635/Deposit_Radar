# Deposit Radar (보증금 레이더)

전세 사기를 막기 위해 **등기부 변동을 자동 감지하고, 위험도를 계산해서 알려주는 서비스**를 목표로 하는 모노레포입니다.

현재는 **디렉토리 구조와 설명용 주석/README만 있는 상태**이며,
실제 동작하는 코드(엔드포인트, 비즈니스 로직 등)는 팀이 직접 구현해야 합니다.

① 탐지 (Detection)
-------------------------------------
[소민섭] Android Notification Listener  
    ↓  
알림 텍스트를 백엔드로 전송 (/bridge/notify)
-------------------------------------
[목원주] 모바일 앱에서 PDF/이미지 업로드  
    ↓  
POST /registry/upload
-------------------------------------

② 분석 (Analysis)
-------------------------------------
[소민섭] OCR 엔진  
PDF → 이미지 변환 → 텍스트 추출 → 정규화(JSON)
-------------------------------------
[유인근] Snapshot Ingestor  
정규화된 RegistrySnapshot JSON 받아 PostgreSQL(JSONB)에 저장
-------------------------------------
[유인근] Diff Engine  
이전 Snapshot vs 현재 Snapshot 비교(DeepDiff+직접 로직)
-------------------------------------
[유인근] Risk Engine  
LTV · 선후순위 · 가중치 기반 → 위험등급(G/A/R) 산출
-------------------------------------

③ 대응 (Action)
-------------------------------------
[노진산] LLM 자동화 엔진  
RiskResult 기반 →  
문안 생성 / 체크리스트 / 보호자 요약문 생성
-------------------------------------
[노진산] PDF/ICS 생성 엔진  
임대인 문의문 / 체크리스트 / 일정 PDF 자동 생성
-------------------------------------
[목원주] 모바일 앱  
PDF 파일, 위험도 표시, 알림 서비스 제공
-------------------------------------

---

## 1. 모노레포 구조

아래 구조는 이 레포에서 합의한 기준 스켈레톤입니다.

```bash
Deposit_Radar/
├── backend/                       ← 유인근(백엔드)
│   ├── app/
│   │   ├── main.py                ← FastAPI 엔트리포인트
│   │   ├── models/                ← Pydantic 모델
│   │   │   ├── registry.py        ← RegistrySnapshot 구조
│   │   │   ├── risk.py            ← RiskInput, RiskResult
│   │   │   ├── diff.py            ← DiffResult 모델
│   │   │   └── user.py
│   │   ├── routes/                ← API 엔드포인트
│   │   │   ├── health.py
│   │   │   ├── registry.py        ← 업로드/스냅샷/비교/위험도
│   │   │   └── user.py
│   │   ├── services/              ← 비즈니스 로직
│   │   │   ├── diff_service.py    ← JSON 비교 엔진
│   │   │   ├── risk_engine.py     ← 위험도 엔진
│   │   │   ├── snapshot_service.py← Snapshot Ingestor
│   │   │   ├── price_service.py   ← 시세 API 조회
│   │   │   └── validation.py      ← 등기부 유효성 검사
│   │   ├── database/
│   │   │   ├── config.py          ← PostgreSQL 연결
│   │   │   ├── models.py          ← ORM 스키마(JSONB)
│   │   │   └── repository.py      ← Snapshot CRUD
│   │   └── utils/
│   │       └── logger.py
│   ├── requirements.txt
│   └── README.md
│
├── ocr_engine/                    ← 소민섭(OCR 엔지니어)
│   ├── ingest/                    ← PDF/이미지 입력
│   │   ├── pdf_to_images.py       ← PyMuPDF
│   │   └── preprocess.py          ← OpenCV 정제
│   ├── ocr/
│   │   ├── easyocr_wrapper.py     ← EasyOCR 모델
│   │   └── tesseract_wrapper.py
│   ├── normalize/
│   │   ├── text_parser.py         ← 정규표현식 기반 파싱
│   │   ├── layout_analyzer.py     ← (선택) 좌표 영역 분리
│   │   └── to_registry.py         ← RegistrySnapshot 생성
│   ├── output/
│   │   └── examples/              ← 결과 샘플(JSON)
│   └── README.md
│
├── playbook_engine/               ← 노진산(AI/LLM 자동화 엔지니어)
│   ├── prompts/
│   │   ├── landlord_letter.txt    ← 임대인 문의문 템플릿
│   │   ├── checklist.txt
│   │   └── summary.txt
│   ├── generator.py               ← LLM JSON 엔진
│   ├── llm_client.py              ← OpenAI/Gemini
│   ├── templates/                 ← HTML→PDF용 템플릿
│   │   ├── checklist.html
│   │   ├── landlord_letter.html
│   │   └── summary.html
│   ├── pdf/
│   │   └── pdf_service.py         ← WeasyPrint 사용
│   ├── ics/
│   │   └── ics_service.py
│   ├── output/
│   │   └── sample_outputs/
│   └── README.md
│
├── mobile_app/                    ← 목원주(앱 엔지니어)
│   ├── src/
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── RegistryUpload.tsx
│   │   │   ├── RiskResult.tsx
│   │   └── components/
│   ├── api/                       ← 백엔드와 연결
│   │   ├── registry.ts
│   │   └── auth.ts
│   ├── package.json
│   └── README.md
│
├── android_bridge/                ← 소민섭(브릿지 트리거)
│   ├── NotificationListener/      ← Android Service
│   ├── parser/                    ← 알림 텍스트→JSON 변환
│   ├── sender/                    ← 백엔드 API 전송
│   ├── config/
│   └── README.md
│
├── infra/
│   ├── docker/                    ← Dockerfile / compose
│   ├── nginx/
│   ├── supervisor/
│   └── README.md
│
├── .github/
│   └── workflows/
│       ├── backend_ci.yml
│       ├── ocr_ci.yml
│       ├── playbook_ci.yml
│       └── mobile_ci.yml
│
├── docs/
│   ├── architecture.drawio
│   ├── api_spec.md
│   ├── risk_engine_rules.md
│   ├── diff_engine_flow.md
│   └── ocr_flow.md
│
└── README.md
```

> 이 구조는 **작업 분담 + 책임 구분**을 위한 뼈대일 뿐이며,
> 현재 각 파일에는 주석/설명만 있고 실제 코드는 없습니다.

---

## 2. 각 모듈 역할 요약

- `backend/`  
  FastAPI 기반 메인 백엔드. 등기부 업로드·스냅샷 저장·Diff·위험도 계산·유저 관리 등 **핵심 API**가 들어갈 영역입니다.

- `ocr_engine/`  
  등기부 PDF/이미지를 입력 받아 OCR을 수행하고, 파싱/정규화해서 **RegistrySnapshot JSON**을 생성하는 파이프라인.

- `playbook_engine/`  
  LLM(OpenAI/Gemini 등)을 이용해 체크리스트, 임대인 문의문, 요약 리포트 등을 **JSON/HTML/PDF/ICS**로 만들어 주는 엔진.

- `mobile_app/`  
  임차인용 모바일 앱(React Native/Expo 예정). 업로드 화면, 위험도 결과 화면, 체크리스트/문서 보기 등을 담당.

- `android_bridge/`  
  은행/카드사 알림에서 "등기", "근저당" 관련 알림을 감지하고 백엔드로 전달하는 **Android Notification Listener 브릿지**.

- `infra/`  
  Docker, Nginx, Supervisor 등 **배포/운영 환경 구성** 관련 설정.

- `docs/`  
  API 스펙, 아키텍처 다이어그램, 위험도 규칙, Diff/OCR 플로우 등 **설계 문서**.

---

## 3. 현재 상태 (중요)

- 각 Python/TypeScript 파일에는 **실제 동작 코드가 없고, 설명용 주석/문자열만 있습니다.**
- README, `.md`, `.txt`, `.html` 파일도 **구조/의도 설명만 정리된 상태**입니다.
- 팀원들은 이 스켈레톤을 기준으로, 각자 담당 영역에 코드를 채워 넣으면 됩니다.

즉, 이 레포는 **폴더 구조 + 역할 정의만 정리된 초기 설계본**입니다.

---

## 4. 백엔드 개발 시작 예시 (Python)

백엔드는 `backend/` 폴더 안에서 FastAPI + SQLAlchemy를 사용하는 것을 전제로 합니다.
실제 엔드포인트/로직 구현은 팀이 직접 진행해야 합니다.

```bash
cd backend

# 1) (선택) Python 가상환경 생성
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 2) 필요 라이브러리 설치
pip install -r requirements.txt

# 3) 이후, app/main.py 등에 FastAPI 앱 구현 후 실행 예시
uvicorn app.main:app --reload
```

> 주의: `app/main.py`, `routes/*`, `models/*`, `services/*`, `database/*` 안에는
> 아직 함수/클래스 구현이 없습니다. FastAPI 앱 생성, 라우터 등록, DB 연동,
> Diff/Risk 엔진 로직 등을 직접 작성해야 합니다.

---

## 5. 개발 순서 예시 (팀 합의용)

1. **백엔드 기본 뼈대**
   - `backend/app/main.py`에서 FastAPI 앱 생성 및 헬스체크 라우터 연결
   - `routes/health.py`에 간단한 `GET /health` 구현

2. **등기부 업로드/스냅샷 API**
   - `routes/registry.py`에 업로드/조회/비교 엔드포인트 설계
   - `models/registry.py`에 RegistrySnapshot 관련 Pydantic 모델 정의
   - `database/models.py`, `repository.py`에 스냅샷 저장 구조 설계

3. **OCR 파이프라인 정리**
   - `ocr_engine/ingest`, `ocr`, `normalize` 안에 PDF→이미지→텍스트→JSON 흐름 구현
   - 필요한 부분만 백엔드 서비스로 래핑해 사용

4. **Diff / Risk 엔진**
   - `services/diff_service.py`에서 스냅샷 간 필드 비교 로직 구현
   - `services/risk_engine.py`에서 `docs/risk_engine_rules.md`에 맞게 등급 계산

5. **Playbook / 문서화**
   - `playbook_engine/` 안에서 체크리스트/임대인 문의문/요약 리포트 생성
   - `pdf_service.py`, `ics_service.py`로 PDF/ICS 아웃풋 정리

6. **모바일 앱 / Android 브릿지 연동**
   - `mobile_app/`에서 업로드/결과 화면을 백엔드 API와 연결
   - `android_bridge/`에서 특정 알림 감지 시 백엔드로 트리거 호출

위 순서는 제안일 뿐이며, 팀 상황에 맞게 자유롭게 조정 가능합니다.

