# 시연 테스트 가이드

## 📋 확인 가능한 범위

- ✅ 주택 등록/조회/수정/삭제 (DB 저장)
- ✅ 등기부등본 업로드 및 OCR 처리 (DB 저장)
- ✅ 스냅샷 수동 생성 (Swagger UI)
- ✅ 보증금/시세 수동 수정 (Swagger UI)
- ✅ Diff 엔진 작동 (스냅샷 비교)
- ✅ Risk 엔진 작동 (위험도 계산)
- ✅ LTV 계산 (보증금, 담보총액, 시세 기반)

---

## 🎯 테스트 방법 선택

이 가이드는 두 가지 테스트 방법을 제공합니다:

1. **자동 처리 흐름 (실제 사용자 흐름)** - 모바일 앱 사용, OCR 자동 처리
2. **수동 처리 흐름 (Swagger UI)** - JSON 직접 입력, 빠른 테스트

---

# 📱 자동 처리 흐름 (실제 사용자 흐름)

## 🚀 1단계: 서버 재시작

### 현재 서버 중지

- 서버 실행 중인 터미널에서 `Ctrl + C`

### 서버 재시작 (네트워크 바인딩)

```bash
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

### 확인

- 터미널에 `Application startup complete.` 메시지 확인
- 브라우저에서 `http://127.0.0.1:8000/docs` 접속

---

## 📝 2단계: 모바일 앱에서 주택 등록

### 모바일 앱 실행

1. 모바일 앱 실행 (React Native/Expo)
2. 로그인 (필요시)

### 주택 등록

1. **"주택 추가"** 버튼 클릭
2. 주택 정보 입력:
   - **주소** (필수): 예) "서울시 강남구 테헤란로 123"
   - **보증금** (필수): 예) 50000000
   - **전입일** (선택): 예) 2025-01-01 (계약 후 입력 가능)
   - **확정일자** (선택): 예) 2025-01-15 (계약 후 입력 가능)
3. **"다음 (등본 업로드)"** 버튼 클릭
4. **응답 확인:**
   - 주택 등록 완료
   - `contract_id` 자동 생성 (예: 1)
   - 등기부등본 업로드 화면으로 자동 이동

---

## 📸 3단계: 등기부등본 업로드 (OCR 자동 처리)

### 모바일 앱에서 파일 업로드

1. **등기부등본 업로드 화면**에서 선택:

   - **옵션 1**: 카메라로 촬영 (이미지 2장까지)
   - **옵션 2**: 갤러리에서 선택 (이미지 2장까지)
   - **옵션 3**: PDF 파일 선택 (1개)

2. **"업로드"** 버튼 클릭

### 자동 처리 과정

```
1. 모바일 앱 → POST /upload (FormData로 파일 전송)
   ↓
2. 백엔드에서 파일 저장 (임시 디렉토리)
   ↓
3. OCR 엔진 자동 실행
   - PDF: run_ocr() → 텍스트 추출
   - 이미지: request_clova_ocr() → 텍스트 추출
   ↓
4. 텍스트 파싱 및 JSON 변환
   - parse_registry_data() → 구조화
   - convert_to_registry_snapshot() → JSON 생성
   ↓
5. 첫 번째 스냅샷 자동 저장 (PostgreSQL)
   ↓
6. 초기 LTV 계산 및 저장 ⭐ (새로 추가!)
   - 담보총액 계산 (extract_total_liens)
   - 시세 조회 (fetch_market_price_by_jibun)
   - LTV 계산 (calculate_ltv)
   - 위험도 분류 (classify_ltv_risk)
   - 계약 정보에 initial_ltv, initial_ltv_risk 저장
   ↓
7. 응답 반환 (RegistrySnapshotResponse JSON)
```

### 응답 확인

- 모바일 앱에서 업로드 완료 메시지 확인
- 서버 터미널 로그:
  ```
  파일 저장 완료: uploads/temp_xxx.pdf
  PDF OCR 처리 시작: uploads/temp_xxx.pdf
  📦 전체 텍스트 수집 완료 (총 XXX자)
  핵심 데이터 추출: {...}
  ✅ 스냅샷 저장 완료: ID 1
  ✅ 초기 LTV 계산 완료: 72.5% (AMBER)
  ```
- **대시보드 확인:**
  - 주택 목록에서 해당 주택의 LTV 값 확인
  - 배지 옆에 "LTV: 72.5%" 표시 (위험도에 따른 색상)

---

## 🔄 4단계: 자동 두 번째 스냅샷 생성 (위험도 RED 설정)

### Swagger UI 또는 API 호출

**방법 1: Swagger UI 사용**

1. 브라우저에서 `http://127.0.0.1:8000/docs` 접속
2. **"POST /snapshot/{contract_id}/auto-second"** 클릭 → **"Try it out"** 클릭
3. Path parameter:
   - `contract_id`: 2단계에서 얻은 ID (예: `1`) 입력
4. **"Execute"** 클릭

**방법 2: curl 명령어 사용**

```bash
curl -X POST "http://127.0.0.1:8000/snapshot/1/auto-second"
```

### 자동 처리 내용

- 첫 번째 스냅샷의 근저당 금액 확인
- 근저당 금액을 2배로 증가 (예: 5천만원 → 1억원)
- 보증금 자동 조정 (근저당의 70%로 낮춤 → 위험도 증가)
- 두 번째 스냅샷 자동 생성

### 응답 확인

- 서버 터미널 로그:
  ```
  🔄 [자동 두 번째 스냅샷 생성] Contract ID: 1
  📸 [첫 번째 스냅샷] ID: 1
  💰 [근저당 금액 변경] 50000000원 → 100000000원
  💰 [보증금 조정] 50000000원 → 70000000원
  ✅ [두 번째 스냅샷 생성 완료] ID: 2
  ```

---

## 👀 5단계: 스냅샷 및 LTV 확인

### Swagger UI에서: `GET /snapshot/{contract_id}`

1. **"GET /snapshot/{contract_id}"** 클릭 → **"Try it out"** 클릭
2. Path parameter:
   - `contract_id`: `1` 입력
3. **"Execute"** 클릭
4. **응답 확인:**
   - `old`: 첫 번째 스냅샷 (OCR로 자동 생성됨)
   - `new`: 두 번째 스냅샷 (자동 생성됨, 근저당 증가)

### Swagger UI에서: `GET /contracts/{contract_id}` (LTV 확인)

1. **"GET /contracts/{contract_id}"** 클릭 → **"Try it out"** 클릭
2. Path parameter:
   - `contract_id`: `1` 입력
3. **"Execute"** 클릭
4. **응답 확인:**
   ```json
   {
     "id": 1,
     "address": "서울시 강남구 테헤란로 123",
     "deposit": 50000000,
     "initial_ltv": 72.5,
     "initial_ltv_risk": "AMBER",
     "initial_total_liens": 50000000,
     "initial_market_price": 120000000
   }
   ```

---

## 🔍 6단계: Diff 엔진 작동 확인

### Swagger UI에서: `GET /compare/latest/{contract_id}`

1. **"Compare"** 섹션 확장
2. **"GET /compare/latest/{contract_id}"** 클릭 → **"Try it out"** 클릭
3. Path parameter:
   - `contract_id`: `1` 입력
4. **"Execute"** 클릭
5. **응답 확인:**
   - `diff.eulgu.updated`: 근저당 증액 감지
   - `old_id`: 1
   - `new_id`: 2
   - `risk.risk_level`: "HIGH" (→ RED로 변환됨)
6. **서버 터미널 로그:**
   ```
   🔍 [Diff/Risk 분석 요청] Contract ID: 1
   ✅ [Diff/Risk 분석 완료] Contract ID: 1
      위험도: HIGH
   ```

---

## ⚠️ 7단계: Risk 엔진 작동 확인

### Swagger UI에서: `POST /risk/{contract_id}`

1. **"risk"** 섹션 확장
2. **"POST /risk/{contract_id}"** 클릭 → **"Try it out"** 클릭
3. Path parameter:
   - `contract_id`: `1` 입력
4. **"Execute"** 클릭
5. **응답 확인:**
   - `risk_level`: "HIGH" 또는 "CRITICAL"
   - `events`: 위험 이벤트 목록
   - `ltv`: 현재 LTV 값
   - `ltv_risk`: 현재 LTV 위험도
   - `initial_ltv`: 초기 LTV 값 (첫 번째 스냅샷 생성 시 계산됨)
   - `initial_ltv_risk`: 초기 LTV 위험도
   - `ltv_change`: LTV 변화량 (current - initial)
   - `total_liens`: 담보 총액

---

## 📄 8단계: Playbook AI 및 PDF 생성

### 모바일 앱 또는 Swagger UI

**방법 1: 모바일 앱에서 (실제 사용자 흐름)**

1. 등기부 변동 알림 발생 (또는 수동으로 분석 요청)
2. **"분석하시겠습니까?"** 모달에서 **"예"** 클릭
3. 자동으로 PDF 생성 및 다운로드

**방법 2: Swagger UI에서**

1. **"POST /generate-report"** 클릭 → **"Try it out"** 클릭
2. Request body 입력:
   ```json
   {
     "contract_id": 1,
     "risk": null
   }
   ```
3. **"Execute"** 클릭

### 응답 확인

- JSON 응답:
  ```json
  {
    "status": "success",
    "message": "PDF 생성 완료",
    "risk_grade": "RED",
    "risk_level": "HIGH",
    "download_url": "http://127.0.0.1:8000/static/Deposit_Radar_닉네임_Guidebook.pdf",
    "filename": "Deposit_Radar_닉네임_Guidebook.pdf"
  }
  ```
- 서버 터미널 로그:
  ```
  📋 [PDF 생성 요청] Contract ID: 1
  🎯 [위험 등급] RED (HIGH)
  📊 [위험 이벤트 수] 1개
  🤖 [Playbook AI 호출] 대응 가이드북 생성 중...
  🖨️ [PDF 생성] 가이드북 PDF 생성 중...
  ✅ [PDF 생성 완료] static/Deposit_Radar_닉네임_Guidebook.pdf
  ```

---

## 📝 자동 처리 흐름 체크리스트

- [ ] 1단계: 서버 재시작 완료
- [ ] 2단계: 모바일 앱에서 주택 등록 완료 (contract_id 확인)
- [ ] 3단계: 모바일 앱에서 등기부등본 업로드 완료 (OCR 자동 처리, LTV 계산 확인)
- [ ] 3-1단계: 대시보드에서 LTV 값 표시 확인 (배지 옆에 색상별로 표시)
- [ ] 4단계: 자동 두 번째 스냅샷 생성 완료 (위험도 RED 설정)
- [ ] 5단계: 스냅샷 및 LTV 확인 완료 (old/new 확인, initial_ltv 확인)
- [ ] 6단계: Diff 엔진 작동 확인 완료 (위험도 HIGH 확인)
- [ ] 7단계: Risk 엔진 작동 확인 완료 (initial_ltv, ltv_change 확인)
- [ ] 8단계: PDF 생성 및 다운로드 완료 (위험도 RED 확인, 초기/현재 LTV 비교 포함)

---

# 🔧 수동 처리 흐름 (Swagger UI - 빠른 테스트)

---

## 🚀 1단계: 서버 재시작

### 현재 서버 중지

- 서버 실행 중인 터미널에서 `Ctrl + C`

### 서버 재시작 (네트워크 바인딩)

```bash
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

### 확인

- 터미널에 `Application startup complete.` 메시지 확인
- 브라우저에서 `http://127.0.0.1:8000/docs` 접속

---

## 📝 2단계: 주택 등록

### Swagger UI에서: `POST /contracts` (Create Contract)

1. **"POST /contracts"** 클릭 → **"Try it out"** 클릭
2. Request body 입력:

```json
{
  "nickname": null,
  "address": "서울시 강남구 테헤란로 123",
  "deposit": 50000000,
  "move_in_date": "2025-01-01",
  "confirmation_date": "2025-01-15"
}
```

3. **"Execute"** 클릭
4. **응답 확인:**
   - `id: 1` (이 ID를 다음 단계에서 사용)
   - 서버 터미널 로그:
     ```
     📝 [주택 등록 요청] 주소: 서울시 강남구 테헤란로 123, 보증금: 50000000
     ✅ [주택 등록 성공] ID: 1, 닉네임: (없음)
     ```

---

## 📸 3단계: 첫 번째 스냅샷 생성 (초기 등기부등본)

### Swagger UI에서: `POST /snapshot/` (Create Snapshot Route)

1. **"snapshot"** 섹션 확장
2. **"POST /snapshot/"** 클릭 → **"Try it out"** 클릭
3. Request body 입력:

```json
{
  "contract_id": 1,
  "viewed_at": "2025-01-01",
  "gabu": [
    {
      "rank": 1,
      "purpose": "소유권이전",
      "receipt": {
        "receipt_date": "2025-01-01",
        "receipt_no": "제12345호"
      },
      "owner_name": "홍길동"
    }
  ],
  "eulgu": [
    {
      "rank": 1,
      "purpose": "근저당권설정",
      "receipt": {
        "receipt_date": "2025-01-01",
        "receipt_no": "제12346호"
      },
      "max_claim_amount": 50000000,
      "status": "유효"
    }
  ]
}
```

4. **"Execute"** 클릭
5. **응답 확인:**
   - `id: 1` (첫 번째 스냅샷 ID)

---

## 🔄 4단계: 자동 두 번째 스냅샷 생성 (위험도 RED 설정)

### Swagger UI에서: `POST /snapshot/{contract_id}/auto-second` (Auto Generate Second Snapshot)

**목표:** 첫 번째 스냅샷을 기반으로 두 번째 스냅샷을 자동 생성하고, 보증금을 조정하여 위험도가 RED (HIGH)가 나오도록 설정합니다.

1. **"snapshot"** 섹션에서 **"POST /snapshot/{contract_id}/auto-second"** 클릭 → **"Try it out"** 클릭
2. Path parameter:
   - `contract_id`: 2단계에서 얻은 주택 등록 ID (예: `1`) 입력
3. **"Execute"** 클릭
4. **자동 처리 내용:**
   - 첫 번째 스냅샷의 근저당 금액 확인
   - 근저당 금액을 2배로 증가 (예: 10억 8천만원 → 21억 6천만원)
   - 보증금을 자동으로 조정 (근저당의 70%로 낮춤 → 위험도 증가)
   - 두 번째 스냅샷 자동 생성
5. **응답 확인:**
   - `id`: 두 번째 스냅샷 ID (예: `2`)
   - `eulgu[0].max_claim_amount`: 증가된 근저당 금액 확인
   - 서버 터미널 로그:
     ```
     🔄 [자동 두 번째 스냅샷 생성] Contract ID: 1
     📸 [첫 번째 스냅샷] ID: 1
     💰 [근저당 금액 변경] 1080000000원 → 2160000000원
     💰 [보증금 조정] 50000000원 → 1512000000원 (또는 조정된 금액)
     ✅ [두 번째 스냅샷 생성 완료] ID: 2
     ```

**참고:**

- 이 엔드포인트는 수동으로 보증금 수정 및 두 번째 스냅샷 생성을 자동화합니다
- 위험도가 **HIGH** → **RED**로 변환되도록 자동 설정됩니다

---

## 👀 5단계: 스냅샷 확인

### Swagger UI에서: `GET /snapshot/{contract_id}` (Get Two Snapshots)

1. **"GET /snapshot/{contract_id}"** 클릭 → **"Try it out"** 클릭
2. Path parameter:
   - `contract_id`: `1` 입력
3. **"Execute"** 클릭
4. **응답 확인:**
   - `old`: 첫 번째 스냅샷 (초기 근저당 금액)
   - `new`: 두 번째 스냅샷 (증가된 근저당 금액, 자동 생성됨)
   - `new.eulgu[0].max_claim_amount`: 첫 번째 스냅샷의 2배로 증가된 금액 확인

---

## 🔍 6단계: Diff 엔진 작동 확인

### Swagger UI에서: `GET /compare/latest/{contract_id}` (Compare Latest)

1. **"Compare"** 섹션 확장 (아직 안 보이면 스크롤)
2. **"GET /compare/latest/{contract_id}"** 클릭 → **"Try it out"** 클릭
3. Path parameter:
   - `contract_id`: `1` 입력
4. **"Execute"** 클릭
5. **응답 확인:**
   - `diff.eulgu.updated`: 근저당 증액 감지 (첫 번째 스냅샷의 2배로 증가)
   - `old_id`: 첫 번째 스냅샷 ID
   - `new_id`: 두 번째 스냅샷 ID (자동 생성됨)
   - `risk.risk_level`: "HIGH" (→ RED로 변환됨)
6. **서버 터미널 로그:**
   ```
   🔍 [Diff/Risk 분석 요청] Contract ID: 1
   ✅ [Diff/Risk 분석 완료] Contract ID: 1
      위험도: HIGH
   ```

---

## ⚠️ 7단계: Risk 엔진 작동 확인

### Swagger UI에서: `POST /risk/{contract_id}` (Evaluate Contract Risk)

1. **"risk"** 섹션 확장 (아직 안 보이면 스크롤)
2. **"POST /risk/{contract_id}"** 클릭 → **"Try it out"** 클릭
3. Path parameter:
   - `contract_id`: `1` 입력
4. **"Execute"** 클릭
5. **응답 확인:**
   - `risk_level`: "HIGH" 또는 "CRITICAL"
   - `events`: 위험 이벤트 목록
     - `type`: "mortgage_increase"
     - `level`: "HIGH"
     - `message`: "근저당 채권최고액 증액 (첫 번째 금액 → 두 번째 금액)"
   - `ltv`: LTV 값 (예: 0.53)
   - `ltv_risk`: LTV 위험도
   - `total_liens`: 담보 총액
   - `market_price`: 시세

---

## ✅ 확인 가능한 결과

### Diff 엔진 결과 (`GET /compare/latest/1`)

```json
{
  "old_id": 1,
  "new_id": 2,
  "diff": {
    "gabu": {"added": [], "removed": [], "updated": []},
    "eulgu": {
      "added": [],
      "removed": [],
      "updated": [
        {
          "old": {"max_claim_amount": 첫_번째_스냅샷_금액},
          "new": {"max_claim_amount": 두_번째_스냅샷_금액}
        }
      ]
    }
  },
  "risk": {
    "risk_level": "HIGH",
    "events": [...],
    "ltv": 0.53
  }
}
```

### Risk 엔진 결과 (`POST /risk/1`)

```json
{
  "contract_id": 1,
  "risk_level": "HIGH",
  "events": [
    {
      "type": "mortgage_increase",
      "level": "HIGH",
      "message": "근저당 채권최고액 증액 (첫_번째_금액 → 두_번째_금액)"
    }
  ],
  "ltv": 0.53,
  "ltv_risk": "MEDIUM",
  "total_liens": 80000000,
  "deposit_amount": 60000000,
  "market_price": 150000000
}
```

---

## 📄 8단계: Playbook AI 및 PDF 생성

### Swagger UI에서: `POST /generate-report` (Generate Report)

**목표:** Risk 엔진 결과를 기반으로 Playbook AI가 대응 가이드북을 생성하고 PDF로 다운로드합니다.

1. **Swagger UI에서 `POST /generate-report`** 엔드포인트를 찾아서 클릭합니다.
   - (만약 보이지 않으면 스크롤하여 찾거나, "default" 섹션을 확인합니다)
2. **"Try it out"** 버튼을 클릭합니다.
3. Request body 입력:
   - `contract_id`: 이전 단계에서 사용한 ID (예: `1`) 입력
   - `risk`: (선택적) 추가 위험 상황 설명 (비워두어도 됨)
4. **"Execute"** 버튼을 클릭합니다.
5. **응답 확인:**
   - JSON 응답 반환:
     ```json
     {
       "status": "success",
       "message": "PDF 생성 완료",
       "risk_grade": "RED",
       "risk_level": "HIGH",
       "download_url": "http://10.50.1.37:8000/static/Deposit_Radar_닉네임_Guidebook.pdf",
       "filename": "Deposit_Radar_닉네임_Guidebook.pdf"
     }
     ```
   - PDF 파일 다운로드 가능
   - PDF에는 다음 내용이 포함됩니다:
     - 위험 등급 (RED/AMBER/GREEN)
     - 상황 요약
     - 대응 체크리스트
     - 임대인에게 보낼 문자 내용
     - Q&A (5개)
     - 법률 용어 설명
6. **서버 터미널 로그:**
   ```
   📋 [PDF 생성 요청] Contract ID: 1
   🎯 [위험 등급] RED (HIGH)
   📊 [위험 이벤트 수] 1개
   🤖 [Playbook AI 호출] 대응 가이드북 생성 중...
   🤖 Calling Model: gpt-5-nano for RED grade analysis...
   🖨️ [PDF 생성] 가이드북 PDF 생성 중...
   📄 PDF 생성 완료: Deposit_Radar_자취방_Guidebook.pdf
   ✅ [PDF 생성 완료] /path/to/Deposit_Radar_자취방_Guidebook.pdf
   ```

**참고:**

- Risk 엔진의 `risk_level` (HIGH/CRITICAL/MEDIUM/LOW)이 자동으로 RED/AMBER/GREEN으로 변환됩니다:
  - `CRITICAL`, `HIGH` → `RED`
  - `MEDIUM` → `AMBER`
  - `LOW` → `GREEN`
- PDF는 서버의 현재 디렉토리에 생성되며, 다운로드됩니다.

---

## 📝 테스트 체크리스트

- [ ] 1단계: 서버 재시작 완료
- [ ] 2단계: `POST /contracts` - 주택 등록 완료 (ID 확인)
- [ ] 3단계: `POST /snapshot/` - 첫 번째 스냅샷 생성 완료
- [ ] 4단계: `POST /snapshot/{contract_id}/auto-second` - 자동 두 번째 스냅샷 생성 완료 (위험도 RED 설정)
- [ ] 5단계: `GET /snapshot/{contract_id}` - old/new 확인 완료
- [ ] 6단계: `GET /compare/latest/{contract_id}` - Diff 결과 확인 완료 (위험도 HIGH 확인)
- [ ] 7단계: `POST /risk/{contract_id}` - Risk 결과 확인 완료
- [ ] 8단계: `POST /generate-report` - PDF 생성 및 다운로드 완료 (위험도 RED 확인)

---

## 🔧 참고: 다른 유용한 엔드포인트

- **`GET /contracts`** - 주택 목록 조회
- **`GET /contracts/{contract_id}`** - 특정 주택 조회
- **`PATCH /contracts/{contract_id}/nickname`** - 닉네임만 업데이트
- **`DELETE /contracts/{contract_id}`** - 주택 삭제
- **`POST /upload`** - 이미지/PDF 업로드 및 OCR 처리
- **`POST /snapshot/{contract_id}/auto-second`** - 자동 두 번째 스냅샷 생성 (위험도 RED 설정, 보증금 자동 조정)
- **`POST /generate-report`** - PDF 생성 (contract_id 기반, 자동 위험도 분석)
- **`PATCH /contracts/{contract_id}`** - 보증금/시세 수동 수정 (자동 생성 대신 수동으로 하고 싶을 때)
