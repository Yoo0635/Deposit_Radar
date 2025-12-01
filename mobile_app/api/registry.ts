// api/registry.ts
// 주택 등록 및 관리 API 함수
import { API_ENDPOINTS } from "../constants/api";

export interface ContractCreate {
  nickname?: string | null;
  address: string;
  deposit: number;
  move_in_date?: string | null; // YYYY-MM-DD 형식 (선택 필드)
  confirmation_date?: string | null; // YYYY-MM-DD 형식
}

export interface ContractResponse {
  id: number;
  nickname?: string | null;
  address: string;
  deposit: number;
  move_in_date: string | null;
  confirmation_date?: string | null;
  created_at: string;
  initial_ltv?: number | null;
  initial_ltv_risk?: string | null;
  market_price?: number | null;
}

export interface ContractUpdate {
  deposit?: number;
  move_in_date?: string | null; // YYYY-MM-DD 형식
  confirmation_date?: string | null; // YYYY-MM-DD 형식
  market_price?: number;
}

export interface NicknameUpdate {
  nickname: string;
}

export interface RegistrySnapshotResponse {
  id: number;
  contract_id: number;
  viewed_at: string;
  gabu: {
    rank: number;
    purpose: string;
    receipt?: {
      receipt_date: string;
      receipt_no: string;
    };
    owner_name?: string;
    max_claim_amount?: number;
    status?: string;
  }[];
  eulgu: {
    rank: number;
    purpose: string;
    receipt?: {
      receipt_date: string;
      receipt_no: string;
    };
    owner_name?: string;
    max_claim_amount?: number;
    status?: string;
  }[];
}

/**
 * 주택 등록
 */
export async function registerProperty(
  data: ContractCreate
): Promise<ContractResponse> {
  const response = await fetch(API_ENDPOINTS.CONTRACTS, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "주택 등록 실패" }));
    throw new Error(error.detail || "주택 등록에 실패했습니다.");
  }

  return response.json();
}

/**
 * 주택 목록 조회
 */
export async function getProperties(): Promise<ContractResponse[]> {
  const response = await fetch(API_ENDPOINTS.CONTRACTS, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "주택 목록 조회 실패" }));
    throw new Error(error.detail || "주택 목록을 불러오는데 실패했습니다.");
  }

  return response.json();
}

/**
 * 주택 정보 조회 (ID로)
 */
export async function getPropertyById(id: number): Promise<ContractResponse> {
  const response = await fetch(API_ENDPOINTS.CONTRACT_BY_ID(id), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "주택 정보 조회 실패" }));
    throw new Error(error.detail || "주택 정보를 불러오는데 실패했습니다.");
  }

  return response.json();
}

/**
 * 닉네임 업데이트
 */
export async function updatePropertyNickname(
  id: number,
  data: NicknameUpdate
): Promise<ContractResponse> {
  const response = await fetch(API_ENDPOINTS.UPDATE_NICKNAME(id), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "닉네임 업데이트 실패" }));
    throw new Error(error.detail || "닉네임 업데이트에 실패했습니다.");
  }

  return response.json();
}

/**
 * 주택 삭제
 */
export async function deleteProperty(id: number): Promise<void> {
  const response = await fetch(API_ENDPOINTS.DELETE_CONTRACT(id), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "주택 삭제 실패" }));
    throw new Error(error.detail || "주택 삭제에 실패했습니다.");
  }
}

/**
 * 계약 정보 업데이트 (전입일, 확정일자 등)
 */
export async function updateContract(
  id: number,
  data: ContractUpdate
): Promise<ContractResponse> {
  const response = await fetch(API_ENDPOINTS.UPDATE_CONTRACT(id), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "계약 정보 업데이트 실패" }));
    throw new Error(error.detail || "계약 정보 업데이트에 실패했습니다.");
  }

  return response.json();
}

/**
 * 등기부등본 이미지/PDF 업로드 및 OCR 처리
 */
export async function uploadDocuments(
  contractId: number,
  images: string[],
  pdf?: { uri: string; name: string }
): Promise<RegistrySnapshotResponse> {
  // 재시도 로직 (최대 3번)
  let lastError: Error | null = null;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const formData = new FormData();

      // contract_id 추가
      formData.append("contract_id", contractId.toString());

      // 이미지 또는 PDF 추가
      if (pdf) {
        // PDF 파일 추가
        const fileUri = pdf.uri.startsWith("file://")
          ? pdf.uri
          : pdf.uri.startsWith("content://")
          ? pdf.uri
          : `file://${pdf.uri}`;
        formData.append("files", {
          uri: fileUri,
          name: pdf.name,
          type: "application/pdf",
        } as any);
      } else if (images.length > 0) {
        // 이미지 파일들 추가
        for (let i = 0; i < images.length; i++) {
          const imageUri = images[i];
          let fileUri = imageUri;

          // URI 형식 정규화
          if (
            !imageUri.startsWith("file://") &&
            !imageUri.startsWith("content://") &&
            !imageUri.startsWith("http")
          ) {
            fileUri = `file://${imageUri}`;
          }

          // 파일명 추출 (없으면 기본값)
          const fileName = imageUri.split("/").pop() || `image_${i + 1}.jpg`;

          formData.append("files", {
            uri: fileUri,
            name: fileName,
            type: "image/jpeg",
          } as any);
        }
      }

      const response = await fetch(API_ENDPOINTS.UPLOAD, {
        method: "POST",
        body: formData,
        // FormData 사용 시 Content-Type은 자동으로 설정됨 (multipart/form-data)
        headers: {},
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ detail: "파일 업로드 실패" }));
        throw new Error(error.detail || "파일 업로드에 실패했습니다.");
      }

      return response.json();
    } catch (error: any) {
      lastError = error;
      console.log(`업로드 시도 ${attempt}/${maxRetries} 실패:`, error.message);

      // 마지막 시도가 아니면 잠시 대기 후 재시도
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // 1초, 2초 대기
        continue;
      }
    }
  }

  // 모든 시도 실패
  throw lastError || new Error("파일 업로드에 실패했습니다.");
}
