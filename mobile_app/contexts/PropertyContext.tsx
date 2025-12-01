// contexts/PropertyContext.tsx
// 주택 목록 전역 상태 관리 Context
import React, { createContext, ReactNode, useContext, useState } from "react";
import { getProperties, ContractResponse, deleteProperty as deletePropertyAPI } from "../api/registry";

export interface Property {
  id: number;
  nickname: string;
  address: string;
  deposit: number;
  move_in_date: string | null; // 전입일
  confirmation_date: string | null; // 확정일자
  initial_ltv?: number | null; // 초기 LTV
  initial_ltv_risk?: string | null; // 초기 LTV 위험도
  market_price?: number | null; // 시세
}

interface PropertyContextType {
  properties: Property[];
  addProperty: (property: Property) => void;
  updateProperty: (id: number, updates: Partial<Property>) => void;
  deleteProperty: (id: number) => void;
  loadPropertiesFromAPI: () => Promise<void>;
}

const PropertyContext = createContext<PropertyContextType | undefined>(
  undefined
);

// 백엔드 응답을 Property 형태로 변환
function convertToProperty(contract: ContractResponse): Property {
  return {
    id: contract.id,
    nickname: contract.nickname || "",
    address: contract.address,
    deposit: contract.deposit,
    move_in_date: contract.move_in_date || null,
    confirmation_date: contract.confirmation_date || null,
    initial_ltv: contract.initial_ltv ?? null,
    initial_ltv_risk: contract.initial_ltv_risk ?? null,
    market_price: contract.market_price ?? null,
  };
}

export function PropertyProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>([]);

  // 백엔드 API에서 주택 목록 로드
  const loadPropertiesFromAPI = async () => {
    try {
      const contracts = await getProperties();
      const convertedProperties = contracts.map(convertToProperty);
      setProperties(convertedProperties);
    } catch (error) {
      console.error('주택 목록 로드 실패:', error);
      throw error;
    }
  };

  const addProperty = (property: Property) => {
    setProperties((prev) => [...prev, property]);
  };

  const updateProperty = (id: number, updates: Partial<Property>) => {
    setProperties((prev) =>
      prev.map((prop) => (prop.id === id ? { ...prop, ...updates } : prop))
    );
  };

  const deleteProperty = async (id: number) => {
    try {
      // 임시 ID(음수)인 경우 백엔드 API 호출 없이 로컬에서만 삭제
      if (id < 0) {
        console.log('임시 주택 삭제 (로컬만):', id);
        setProperties((prev) => prev.filter((prop) => prop.id !== id));
        return;
      }
      
      // 실제 ID인 경우 백엔드 API로 삭제 요청
      await deletePropertyAPI(id);
      console.log('주택 삭제 성공:', id);
      
      // 로컬 상태에서도 삭제
      setProperties((prev) => prev.filter((prop) => prop.id !== id));
    } catch (error) {
      console.error('주택 삭제 실패:', error);
      throw error; // 에러를 상위로 전달하여 UI에서 처리할 수 있도록
    }
  };

  return (
    <PropertyContext.Provider
      value={{ properties, addProperty, updateProperty, deleteProperty, loadPropertiesFromAPI }}
    >
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperties() {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error("useProperties must be used within a PropertyProvider");
  }
  return context;
}
