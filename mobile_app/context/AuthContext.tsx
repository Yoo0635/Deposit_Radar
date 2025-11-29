// context/AuthContext.tsx
// 인증 상태 관리 Context (백그라운드 상태에서만 사용 - AsyncStorage 제거)
import React, { createContext, useContext, useState } from "react";

// AuthContext 생성
const AuthContext = createContext<{
  isAuthenticated: boolean;
  login: (rememberLogin?: boolean) => void;
  logout: () => void;
  isLoading: boolean;
} | null>(null);

// useAuth 훅 생성
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// AuthProvider 컴포넌트
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading] = useState(false); // 로딩 체크 불필요

  // 로그인 함수
  const login = (rememberLogin: boolean = false) => {
    setIsAuthenticated(true);
  };

  // 로그아웃 함수
  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

