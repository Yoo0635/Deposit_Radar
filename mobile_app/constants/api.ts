/**
 * API 설정
 * 
 * 로컬 네트워크에서 서버에 접근하려면 컴퓨터의 로컬 IP 주소를 사용합니다.
 * 안드로이드 에뮬레이터의 경우: 10.0.2.2 또는 localhost
 * 실제 안드로이드 기기의 경우: 컴퓨터의 로컬 네트워크 IP (예: 192.168.x.x 또는 10.50.1.37)
 */

// 컴퓨터의 로컬 네트워크 IP 주소 (ifconfig 또는 ipconfig로 확인)
const LOCAL_IP = "10.50.1.37";

// 개발 환경 API Base URL
export const API_BASE_URL = `http://${LOCAL_IP}:8000`;

// API 엔드포인트
export const API_ENDPOINTS = {
  // 계약 관련
  CONTRACTS: `${API_BASE_URL}/contracts`,
  CONTRACT_BY_ID: (id: number) => `${API_BASE_URL}/contracts/${id}`,
  
  // 스냅샷 관련
  SNAPSHOTS: `${API_BASE_URL}/snapshot`,
  SNAPSHOT_BY_CONTRACT: (contractId: number) => `${API_BASE_URL}/snapshot/${contractId}`,
  AUTO_SECOND_SNAPSHOT: (contractId: number) => `${API_BASE_URL}/snapshot/${contractId}/auto-second`,
  
  // 비교 관련
  COMPARE_LATEST: (contractId: number) => `${API_BASE_URL}/compare/latest/${contractId}`,
  COMPARE_SPECIFIC: (oldId: number, newId: number) => `${API_BASE_URL}/compare/${oldId}/${newId}`,
  COMPARE_LIVE: (contractId: number) => `${API_BASE_URL}/compare/live/${contractId}`,
  
  // 리포트 생성
  GENERATE_REPORT: `${API_BASE_URL}/generate-report`,
  
  // 주소 검색
  SEARCH_ADDRESS: `${API_BASE_URL}/address/search`,
  
  // 파일 업로드 (OCR)
  UPLOAD: `${API_BASE_URL}/upload`,
  
  // 닉네임 업데이트
  UPDATE_NICKNAME: (id: number) => `${API_BASE_URL}/contracts/${id}/nickname`,
  
  // 주택 삭제
  DELETE_CONTRACT: (id: number) => `${API_BASE_URL}/contracts/${id}`,
  
  // 계약 정보 업데이트
  UPDATE_CONTRACT: (id: number) => `${API_BASE_URL}/contracts/${id}`,
  
  // 알림 중복 체크
  CHECK_NOTIFICATION: `${API_BASE_URL}/notifications/check`,
  DELETE_NOTIFICATION: (notificationId: string) => `${API_BASE_URL}/notifications/${notificationId}`,
  
  // 테스트
  TEST_MLT: `${API_BASE_URL}/test-mlt`,
} as const;

