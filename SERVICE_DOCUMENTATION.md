# Deposit Radar (보증금 레이더) 서비스 문서

---

## 1. 서비스 개요 (Service)

### 서비스명 (Service Name)

**Deposit Radar (보증금 레이더)**

### 서비스 한줄 소개 (One-line Service Introduction)

전세 사기를 사전에 방지하기 위해 등기부등본 변동을 자동 감지하고, AI 기반 위험도 분석을 통해 임차인에게 실시간으로 위험 정보와 대응 가이드북을 제공하는 모바일 서비스입니다.

### 개발 목표 (Development Goal)

전세 사기 피해를 예방하기 위해 개발되었습니다. 전세 계약 시 임차인이 등기부등본의 변동사항(근저당 증액, 가압류, 경매 등)을 실시간으로 모니터링하지 못해 보증금을 잃는 사례가 빈번하게 발생하고 있습니다. Deposit Radar는 Android 시스템 알림을 통해 등기부 변동을 자동으로 감지하고, OCR 기술로 등기부등본을 분석하여 위험도를 계산하며, LLM 기반 대응 가이드북을 자동 생성하여 임차인에게 제공합니다.

### 타겟 사용자 (Target User)

- 전세 계약을 체결한 임차인
- 보증금 보호가 필요한 전세 거주자
- 등기부등본 모니터링이 필요한 부동산 거래 참여자

### 기대 효과 (Expected Effects)

- **사전 위험 감지**: 등기부 변동을 실시간으로 감지하여 전세 사기 피해를 사전에 예방
- **자동화된 분석**: OCR과 AI를 활용한 자동 위험도 분석으로 사용자의 전문 지식 없이도 위험 상황 파악 가능
- **실행 가능한 대응 방안**: LLM 기반 맞춤형 대응 가이드북 제공으로 즉각적인 법적 대응 가능
- **사용자 편의성**: 모바일 앱을 통한 간편한 등기부등본 업로드 및 결과 확인

---

## 2. 시스템 구성도 (Architecture)

### 전체 시스템 구조

```
[Android 시스템 알림]
        ↓
[Android Notification Listener] → 등기부 변동 알림 감지
        ↓
[모바일 앱 (React Native/Expo)]
        ↓
[백엔드 API (FastAPI)]
        ├──→ [OCR 엔진] → PDF/이미지 → 텍스트 추출 → JSON 변환
        ├──→ [PostgreSQL 데이터베이스] → 스냅샷 저장 (JSONB)
        ├──→ [Diff 엔진] → 스냅샷 비교 → 변경사항 추출
        ├──→ [Risk 엔진] → 위험도 계산 (HIGH/MEDIUM/LOW) → RED/AMBER/GREEN 변환
        ├──→ [LTV 계산] → 보증금, 담보총액, 시세 기반 위험도 평가
        └──→ [LLM 엔진 (OpenAI GPT)] → 대응 가이드북 생성
        ↓
[PDF 생성 엔진 (WeasyPrint)] → 가이드북 PDF 생성
        ↓
[모바일 앱] → PDF 다운로드 및 표시
```

### 각 구성 요소의 역할

1. **Android Notification Listener**

   - 시스템 알림을 모니터링하여 등기부 변동 관련 알림 자동 감지
   - 백그라운드에서 동작하는 Headless JS 태스크로 구현
   - 감지된 알림을 모바일 앱으로 전달

2. **모바일 앱 (React Native/Expo)**

   - 주택 등록 및 관리 (주소, 보증금, 전입일, 확정일자)
   - 등기부등본 이미지/PDF 업로드
   - 분석 결과 및 위험도 표시 (RED/AMBER/GREEN 배지)
   - PDF 가이드북 다운로드 및 열기
   - 분석 기록 관리

3. **백엔드 API (FastAPI)**

   - RESTful API 제공
   - CORS 설정으로 모바일 앱과 통신
   - 계약(주택) 정보 CRUD 관리
   - 스냅샷 생성 및 비교
   - 위험도 분석 및 PDF 생성

4. **OCR 엔진**

   - PDF/이미지 파일을 입력받아 텍스트 추출
   - 네이버 Clova OCR API 활용
   - 정규표현식 기반 파싱으로 등기부 데이터 구조화
   - RegistrySnapshot JSON 형식으로 변환

5. **PostgreSQL 데이터베이스**

   - 계약 정보 저장 (주소, 보증금, 날짜 등)
   - 등기부 스냅샷 저장 (JSONB 형식)
   - 스냅샷 간 비교를 위한 이력 관리

6. **Diff 엔진**

   - 두 스냅샷 간 비교 (갑구/을구 변경사항)
   - 근저당 증액, 가압류/압류 추가, 경매 개시 등 감지
   - 변경사항을 구조화된 JSON으로 반환

7. **Risk 엔진**

   - Diff 결과를 기반으로 위험 이벤트 계산
   - 위험 수준 산출 (CRITICAL/HIGH/MEDIUM/LOW)
   - RED/AMBER/GREEN 등급 변환

8. **LTV 계산 서비스**

   - Loan-to-Value 비율 계산 (보증금, 담보총액, 시세 기반)
   - LTV 기반 위험도 분류
   - 시세 조회 (국토부 API 연동)

9. **LLM 엔진 (OpenAI GPT)**

   - 위험도 등급에 맞춘 맞춤형 대응 가이드북 생성
   - 체크리스트, Q&A, 법률 용어 설명 자동 생성
   - 임대인 문의문 템플릿 생성

10. **PDF 생성 엔진 (WeasyPrint)**
    - LLM 결과를 HTML 템플릿으로 렌더링
    - PDF 파일로 변환
    - 정적 파일 서빙을 통한 다운로드 제공

---

## 3. 핵심 기능 명세 (Feature Specification)

| 기능명 (Feature Name)      | 기능 설명 (Feature Description)                                          | 입력/출력 데이터 (Input/Output Data)                                             | 관련 기술 및 알고리즘 (Related Technologies & Algorithms) | 구현 여부 (O/X) |
| -------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------- |
| 등기부등본 OCR 인식        | PDF/이미지 파일에서 등기부등본 텍스트를 추출하고 구조화된 데이터로 변환  | PDF/이미지 파일 → RegistrySnapshot JSON (갑구/을구 정보)                         | 네이버 Clova OCR API, PyMuPDF, OpenCV, 정규표현식 파싱    | O               |
| 등기부 변동 자동 감지      | Android 시스템 알림을 통해 등기부 변동 관련 알림을 자동으로 감지         | 시스템 알림 → 알림 데이터 (주소, 메시지)                                         | Android Notification Listener, Headless JS, AsyncStorage  | O               |
| 스냅샷 비교 (Diff 엔진)    | 이전 등기부 스냅샷과 현재 스냅샷을 비교하여 변경사항 추출                | 두 개의 RegistrySnapshot JSON → Diff JSON (추가/삭제/변경)                       | 딕셔너리 비교 알고리즘, JSON 구조 분석                    | O               |
| 위험도 평가 (Risk 엔진)    | 등기부 변경사항을 분석하여 위험 수준 계산 및 등급 산출                   | Diff JSON → Risk Level (CRITICAL/HIGH/MEDIUM/LOW) → Risk Grade (RED/AMBER/GREEN) | 규칙 기반 위험도 계산, 이벤트 기반 평가                   | O               |
| LTV 계산                   | 보증금, 담보총액, 시세를 기반으로 Loan-to-Value 비율 계산 및 위험도 분류 | 보증금, 담보총액, 시세 → LTV 값, LTV 위험도                                      | 수학적 계산, 국토부 시세 API, 위험도 분류 알고리즘        | O               |
| AI 기반 대응 가이드북 생성 | 위험도 등급에 맞춘 맞춤형 대응 가이드북을 LLM으로 자동 생성              | 위험도 정보, 계약 정보, Diff 결과 → 가이드북 JSON (체크리스트, Q&A, 용어 설명)   | OpenAI GPT-4o-mini, 프롬프트 엔지니어링, JSON 구조화      | O               |
| PDF 가이드북 생성          | LLM 결과를 PDF 파일로 변환하여 다운로드 제공                             | 가이드북 JSON → HTML 템플릿 → PDF 파일                                           | WeasyPrint, Jinja2 템플릿 엔진, HTML/CSS                  | O               |
| 주택 등록 및 관리          | 주택 정보(주소, 보증금, 전입일, 확정일자) 등록 및 조회/수정/삭제         | 주택 정보 JSON → DB 저장/조회/수정/삭제                                          | FastAPI, SQLAlchemy, PostgreSQL, RESTful API              | O               |
| 분석 기록 관리             | 위험도 분석 결과를 기록으로 저장하고 이력 조회                           | 분석 결과 → 분석 기록 저장 → 기록 목록 조회                                      | React Native, AsyncStorage, 상태 관리 (Context API)       | O               |
| 위험도 시각화              | 위험도 등급을 색상 배지로 표시 (RED/AMBER/GREEN)                         | 위험도 등급 → 색상 배지 UI                                                       | React Native, 컴포넌트 스타일링                           | O               |

---

## 4. 주요 기능 흐름도 (Flow)

### 4.1 주택 등록 및 등기부등본 업로드 흐름

```
1. 사용자가 모바일 앱에서 주택 등록
   - 주소, 보증금, 전입일, 확정일자 입력
   ↓
2. 백엔드 API 호출 (POST /contracts)
   - 계약 정보를 PostgreSQL에 저장
   - contract_id 반환
   ↓
3. 등기부등본 업로드 화면으로 이동
   - 이미지 2장 또는 PDF 1개 선택
   ↓
4. 파일 업로드 (POST /upload)
   - contract_id와 함께 파일 전송
   ↓
5. OCR 엔진 처리
   - PDF/이미지 → 텍스트 추출 (네이버 Clova OCR)
   - 텍스트 파싱 → RegistrySnapshot JSON 변환
   ↓
6. 스냅샷 저장
   - PostgreSQL에 JSONB 형식으로 저장
   - 첫 번째 스냅샷 생성 완료
```

### 4.2 등기부 변동 감지 및 분석 흐름

```
1. Android 시스템에서 등기부 변동 알림 발생
   - 은행/카드사 앱에서 등기부 변동 관련 알림 발송
   ↓
2. Android Notification Listener 감지
   - 백그라운드 Headless JS 태스크 실행
   - 알림 텍스트 파싱 (주소, 메시지 추출)
   ↓
3. 모바일 앱으로 알림 데이터 전달
   - NotificationContext에 pendingNotification 저장
   - AsyncStorage에 알림 ID 저장 (중복 방지)
   ↓
4. 분석 탭에서 모달 표시
   - "분석하시겠습니까?" 모달 자동 표시
   ↓
5. 사용자가 "예" 클릭
   - 백엔드 API 호출 (POST /generate-report)
   - contract_id 전달
   ↓
6. 백엔드에서 자동 처리
   - 최신 스냅샷 2개 비교 (Diff 엔진)
   - 위험도 계산 (Risk 엔진)
   - LTV 계산
   - 위험 등급 변환 (RED/AMBER/GREEN)
   ↓
7. LLM 기반 가이드북 생성
   - 위험도 등급에 맞춘 프롬프트 생성
   - OpenAI GPT 호출
   - 체크리스트, Q&A, 용어 설명 생성
   ↓
8. PDF 생성 및 반환
   - HTML 템플릿 렌더링
   - PDF 파일 생성
   - JSON 응답 반환 (download_url, risk_grade)
   ↓
9. 모바일 앱에서 결과 표시
   - 분석 기록에 추가 (주소, 날짜, 위험도, PDF URL)
   - 위험도 배지 표시 (RED/AMBER/GREEN)
   - PDF 미리보기 모달 표시
```

### 4.3 시연용 자동 스냅샷 생성 흐름

```
1. 첫 번째 스냅샷 생성 (수동 또는 OCR 업로드)
   - 등기부등본 데이터 저장
   ↓
2. 자동 두 번째 스냅샷 생성 (POST /snapshot/{contract_id}/auto-second)
   - 첫 번째 스냅샷의 근저당 금액 확인
   - 근저당 금액을 2배로 증가
   - 보증금 자동 조정 (근저당의 70%로 낮춤)
   - 두 번째 스냅샷 생성
   ↓
3. Diff 엔진 실행 (GET /compare/latest/{contract_id})
   - 두 스냅샷 비교
   - 근저당 증액 감지
   - 위험도 HIGH 계산
   ↓
4. Risk 엔진 실행 (POST /risk/{contract_id})
   - 위험 이벤트 계산
   - LTV 계산
   - 최종 위험도 산출
   ↓
5. PDF 생성 (POST /generate-report)
   - 위험도 RED로 변환
   - 가이드북 생성 및 다운로드
```

---

## 5. 향후 발전 방향 (Future Work)

### 5.1 개선 예정 기능 및 추가 데이터 확보 계획

1. **실시간 등기부 조회 API 연동**

   - 현재는 수동 업로드 방식
   - 향후 공공데이터포털 등기부등본 조회 API 연동
   - 자동으로 주기적 등기부 조회 및 변동 감지

2. **다중 주택 관리 기능 강화**

   - 여러 주택을 등록한 사용자를 위한 대시보드 개선
   - 주택별 위험도 비교 기능
   - 알림 설정 개인화 (특정 주택만 모니터링)

3. **법률 상담 연결 서비스**

   - 위험도가 RED인 경우 변호사 상담 연결
   - 법률 상담소 API 연동
   - 온라인 상담 예약 기능

4. **알림 정확도 향상**

   - 알림 텍스트 파싱 정확도 개선
   - 오탐지 방지를 위한 필터링 로직 강화
   - 사용자 피드백 기반 학습

5. **OCR 정확도 향상**

   - 다양한 등기부등본 형식 지원
   - 레이아웃 분석 알고리즘 개선
   - 다중 OCR 엔진 앙상블 (Clova OCR + Tesseract)

6. **시세 데이터 정확도 향상**
   - 국토부 API 외 추가 시세 데이터 소스 확보
   - 지역별 시세 데이터베이스 구축
   - 실거래가 기반 시세 계산

### 5.2 모델 고도화 또는 서비스 확장 아이디어

1. **AI 기반 위험도 예측 모델**

   - 현재는 규칙 기반 위험도 계산
   - 머신러닝 모델 도입으로 위험도 예측 정확도 향상
   - 과거 사기 사례 데이터 학습

2. **자동 대응 액션 추천**

   - 위험도에 따른 자동 대응 액션 추천
   - 법원 방문 일정 자동 생성
   - 배당요구신청서 자동 작성

3. **커뮤니티 기능**

   - 사용자 간 경험 공유
   - 위험 상황 사례 공유
   - 전문가 Q&A 게시판

4. **웹 대시보드 제공**

   - 모바일 앱 외 웹 인터페이스 제공
   - 상세 분석 리포트 다운로드
   - 데이터 시각화 (차트, 그래프)

5. **부동산 중개사 연동**

   - 중개사용 대시보드 제공
   - 고객 주택 위험도 모니터링
   - 자동 알림 발송 기능

6. **보험사 연동**

   - 전세 보증금 보험 가입 안내
   - 위험도 기반 보험료 계산
   - 보험 청구 자동화

7. **블록체인 기반 등기부 검증**
   - 등기부등본 위변조 방지
   - 블록체인 기반 검증 시스템
   - 분산 원장 기술 활용

---

## 6. 부록 (Appendix)

### 6.1 참고자료 (논문, 데이터셋 출처 등)

#### 기술 스택 및 라이브러리

- **프론트엔드**

  - React Native (Expo)
  - Expo Router (파일 기반 라우팅)
  - React Context API (상태 관리)
  - AsyncStorage (로컬 저장소)

- **백엔드**

  - FastAPI (Python 웹 프레임워크)
  - SQLAlchemy (ORM)
  - PostgreSQL (데이터베이스)
  - Pydantic (데이터 검증)

- **OCR**

  - 네이버 Clova OCR API
  - PyMuPDF (PDF 처리)
  - OpenCV (이미지 처리)

- **AI/LLM**

  - OpenAI GPT-4o-mini
  - 프롬프트 엔지니어링

- **PDF 생성**

  - WeasyPrint (HTML to PDF)
  - Jinja2 (템플릿 엔진)

- **시세 조회**
  - 국토부 부동산 거래 정보 API

#### 데이터 소스

- **등기부등본 데이터**: 사용자 업로드 (PDF/이미지)
- **시세 데이터**: 국토부 부동산 거래 정보 API
- **주소 데이터**: 사용자 입력 또는 주소 검색 API

#### API 문서

- Swagger UI: `http://localhost:8000/docs`
- API 엔드포인트 목록:
  - `POST /contracts` - 주택 등록
  - `GET /contracts` - 주택 목록 조회
  - `PATCH /contracts/{contract_id}` - 주택 정보 수정
  - `DELETE /contracts/{contract_id}` - 주택 삭제
  - `POST /upload` - 등기부등본 업로드 및 OCR 처리
  - `POST /snapshot/` - 스냅샷 수동 생성
  - `POST /snapshot/{contract_id}/auto-second` - 자동 두 번째 스냅샷 생성
  - `GET /snapshot/{contract_id}` - 스냅샷 조회
  - `GET /compare/latest/{contract_id}` - Diff 엔진 실행
  - `POST /risk/{contract_id}` - Risk 엔진 실행
  - `POST /generate-report` - PDF 가이드북 생성

#### 테스트 가이드

- 상세한 테스트 절차는 `TEST_GUIDE.md` 파일 참조
- Swagger UI를 통한 단계별 테스트 가능

#### 프로젝트 구조

```
Deposit_Radar_Remote/
├── backend/              # FastAPI 백엔드
│   ├── app/
│   │   ├── main.py      # FastAPI 앱 엔트리포인트
│   │   ├── routes/      # API 엔드포인트
│   │   ├── services/    # 비즈니스 로직
│   │   ├── database/    # DB 설정 및 ORM
│   │   └── models/      # Pydantic 모델
│   └── requirements.txt
├── mobile_app/          # React Native 모바일 앱
│   ├── app/             # Expo Router 기반 화면
│   ├── contexts/        # 전역 상태 관리
│   ├── api/             # 백엔드 API 호출
│   └── components/      # 재사용 컴포넌트
├── ocr_engine/          # OCR 처리 엔진
│   ├── entry.py         # OCR 파이프라인
│   ├── clova/           # 네이버 Clova OCR 클라이언트
│   └── normalize/       # 텍스트 파싱 및 정규화
└── TEST_GUIDE.md        # 테스트 가이드 문서
```

---

## 문서 작성 일자

2025년 12월 1일

---

## 작성자

Deposit Radar 개발팀
