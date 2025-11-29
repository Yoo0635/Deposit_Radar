// context/AuthContext.tsx

// 1. useRouter와 useSegments를 import에서 삭제합니다.
import React, { createContext, useContext, useState } from "react";
// import { useRouter, useSegments } from 'expo-router'; // <--- 이 줄 삭제

// AuthContext 생성
const AuthContext = createContext<{
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
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

  // 2. 로그인/로그아웃 함수
  const login = () => {
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
