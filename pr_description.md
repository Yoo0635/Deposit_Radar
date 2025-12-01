# Develop → Main Pull Request

## 📋 변경 사항 요약

이번 PR은 Recovery Engine 제거 및 PDF 생성 시스템 개선, UI/UX 개선을 포함합니다.

## ✨ 주요 변경사항

### 1. Recovery Engine 완전 제거
- `recovery_engine.py` 파일 삭제
- Recovery Engine 관련 코드 전체 제거
- PDF 템플릿 원상복구
- LLM 엔진 프롬프트 원상복귀

### 2. PDF 생성 시스템 개선
- **PDF 파일명에 타임스탬프와 등급 추가**: 브라우저 캐시 문제 해결
  - 기존: `Deposit_Radar_{nickname}_Guidebook.pdf`
  - 변경: `Deposit_Radar_{nickname}_{등급}_{타임스탬프}.pdf`
- **LLM 엔진에 등급 정보 명시적 전달**: 올바른 등급으로 PDF 생성 보장
- **등급 정보 강조**: `combined_info`에 위험 등급 명시

### 3. LTV 기반 위험 등급 자동 조정
- 보증금 1억 기준 RED 등급 자동 조정 로직 추가
- PDF 생성 시점에서 동적으로 LTV 재계산
- 보증금 변경에 따라 자동으로 위험 등급 업데이트

### 4. UI/UX 개선
- **날짜 입력 필드 키보드 가림 문제 해결**
  - `KeyboardAvoidingView` 추가
  - `ScrollView`에 `keyboardShouldPersistTaps` 및 `paddingBottom` 추가
- **확정일자 입력 필드 자동 스크롤**: 포커스 시 자동으로 하단으로 스크롤

### 5. 성능 최적화
- 불필요한 주소 보정 API 호출 제거 (시세 하드코딩 사용)
- 행안부 API 오류 해결

## 🔧 기술적 변경사항

### Backend
- `backend/app/main.py`: PDF 생성 로직 개선, 시세 조정 로직 추가
- `backend/app/services/llm_engine.py`: 등급 정보 명시적 전달 파라미터 추가
- `backend/app/templates/report.html`: Recovery Engine 관련 코드 제거
- `backend/app/routes/upload_route.py`: 첫 번째 스냅샷 생성 시 시세 조정 로직

### Frontend
- `mobile_app/app/modal/index.tsx`: 키보드 가림 문제 해결, 자동 스크롤 추가

## 📊 통계
- **변경된 파일**: 44개
- **추가된 줄**: 4,989줄
- **삭제된 줄**: 534줄

## 🧪 테스트 방법

1. **PDF 생성 테스트**
   - 보증금 1억으로 주택 등록
   - 분석 실행 → RED 등급 PDF 생성 확인
   - PDF 파일명에 타임스탬프와 등급 포함 확인

2. **UI 테스트**
   - 새 주택 등록 화면에서 전입일/확정일자 입력
   - 키보드가 입력 필드를 가리지 않는지 확인
   - 확정일자 입력 시 자동 스크롤 동작 확인

## ⚠️ 주의사항

- **자동 머지 불가**: 브랜치 간 충돌 가능성 있음
- **서버 재시작 필요**: 변경사항 반영을 위해 서버 재시작 필요
- **기존 PDF 캐시**: 이전 PDF는 캐시되어 있을 수 있으므로 새로 생성 필요

## 📝 관련 이슈

- Recovery Engine 제거 요청
- PDF 캐시 문제 해결
- 날짜 입력 필드 키보드 가림 문제 해결

