// contexts/NotificationContext.tsx
// 알림 데이터 전역 상태 관리 Context
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export interface NotificationData {
  id: string;
  address: string;
  deposit: number;
  amount?: number;
  market_price?: number;
  ltv?: number;
  riskLevel?: string;
  seniorDebtType?: string;
  changeType?: string;
  requestDate?: string;
}

interface NotificationContextType {
  pendingNotification: NotificationData | null;
  setPendingNotification: (data: NotificationData | null) => void;
  clearPendingNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

const NOTIFICATION_STORAGE_KEY = "pendingNotification";

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [pendingNotification, setPendingNotification] =
    useState<NotificationData | null>(null);

  // 앱 시작 시 AsyncStorage에서 저장된 알림 데이터 로드
  useEffect(() => {
    const loadPendingNotification = async () => {
      try {
        const stored = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          console.log("저장된 알림 데이터 로드:", data);
          setPendingNotification(data);
        }
      } catch (error) {
        console.log("알림 데이터 로드 실패:", error);
      }
    };

    loadPendingNotification();
  }, []);

  // pendingNotification이 변경될 때마다 AsyncStorage에 저장
  const handleSetPendingNotification = async (
    data: NotificationData | null
  ) => {
    setPendingNotification(data);
    try {
      if (data) {
        await AsyncStorage.setItem(
          NOTIFICATION_STORAGE_KEY,
          JSON.stringify(data)
        );
        console.log("알림 데이터 저장:", data);
      } else {
        await AsyncStorage.removeItem(NOTIFICATION_STORAGE_KEY);
        console.log("알림 데이터 삭제");
      }
    } catch (error) {
      console.log("알림 데이터 저장 실패:", error);
    }
  };

  const clearPendingNotification = async () => {
    setPendingNotification(null);
    try {
      await AsyncStorage.removeItem(NOTIFICATION_STORAGE_KEY);
      console.log("알림 데이터 삭제");
    } catch (error) {
      console.log("알림 데이터 삭제 실패:", error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        pendingNotification,
        setPendingNotification: handleSetPendingNotification,
        clearPendingNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
}
