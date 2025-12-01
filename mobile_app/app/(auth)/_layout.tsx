// app/(auth)/_layout.tsx
// 인증 화면 그룹 레이아웃 - 로그인/회원가입 화면의 공통 레이아웃 설정 (헤더 숨김)
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login/index" />
      <Stack.Screen name="signup/index" />
    </Stack>
  );
}
