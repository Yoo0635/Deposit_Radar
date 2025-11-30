// contexts/PropertyContext.tsx
// 주택 목록 전역 상태 관리 Context
import React, { createContext, ReactNode, useContext, useState } from "react";

export interface Property {
  id: number;
  nickname: string;
  address: string;
  deposit: number;
  move_in_date: string; // 전입일
  confirmation_date: string; // 확정일자
}

interface PropertyContextType {
  properties: Property[];
  addProperty: (property: Property) => void;
  updateProperty: (id: number, updates: Partial<Property>) => void;
  deleteProperty: (id: number) => void;
}

const PropertyContext = createContext<PropertyContextType | undefined>(
  undefined
);

export function PropertyProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>([]);

  const addProperty = (property: Property) => {
    setProperties((prev) => [...prev, property]);
  };

  const updateProperty = (id: number, updates: Partial<Property>) => {
    setProperties((prev) =>
      prev.map((prop) => (prop.id === id ? { ...prop, ...updates } : prop))
    );
  };

  const deleteProperty = (id: number) => {
    setProperties((prev) => prev.filter((prop) => prop.id !== id));
  };

  return (
    <PropertyContext.Provider
      value={{ properties, addProperty, updateProperty, deleteProperty }}
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
