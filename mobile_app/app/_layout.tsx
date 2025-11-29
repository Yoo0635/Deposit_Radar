// app/_layout.tsx
// 루트 레이아웃 파일 - 인증 상태에 따른 화면 전환 및 알림 감지
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { AppRegistry, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import RNAndroidNotificationListener, {
  RNAndroidNotificationListenerHeadlessJsName,
} from "react-native-android-notification-listener";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { headlessNotificationListener } from "../notificationListener";

// 알림 핸들러 설정 (iOS/Android 모두 지원)
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (error) {
  console.log("알림 핸들러 설정 실패:", error);
}

// Headless JS 태스크 등록 (앱이 백그라운드일 때도 알림 감지)
// 이는 앱이 시작될 때 한 번만 등록되어야 하므로 컴포넌트 외부에서 실행
if (Platform.OS === "android") {
  AppRegistry.registerHeadlessTask(
    RNAndroidNotificationListenerHeadlessJsName,
    () => headlessNotificationListener
  );
}

// 1. 인증 상태에 따라 화면을 전환하는 내부 컴포넌트
function RootLayoutNav() {
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    setIsNavigationReady(true);
  }, []);

  // 등기부등본 변경 시 자동 처리 함수 - 분석 탭으로 이동
  const handleRegistrationChange = React.useCallback(() => {
    console.log("등기부등본 변경 알림 감지 - 분석 탭으로 이동");

    // 분석 탭으로 이동
    if (isNavigationReady && isAuthenticated) {
      router.push("/(tabs)/analysis" as any);
    } else if (isNavigationReady) {
      // 로그인되지 않은 경우 로그인 화면으로 이동
      router.push("/(auth)/login" as any);
    }
  }, [isNavigationReady, isAuthenticated, router]);

  // Android 시스템 알림 감지 설정 (Android만 지원)
  useEffect(() => {
    if (Platform.OS === "android") {
      const checkAndRequestPermission = async () => {
        try {
          const status =
            await RNAndroidNotificationListener.getPermissionStatus();
          console.log("Android 알림 접근 권한 상태:", status);

          if (status !== "authorized") {
            RNAndroidNotificationListener.requestPermission();
          }
        } catch (error) {
          console.log("Android 알림 권한 확인 실패:", error);
        }
      };

      checkAndRequestPermission();
    }
  }, []);

  // iOS/Android 푸시 알림 감지 설정 (백엔드에서 보낸 알림)
  useEffect(() => {
    // 포그라운드에서 알림을 받았을 때 (앱이 실행 중일 때)
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("푸시 알림 수신:", notification);

        const title = notification.request.content.title || "";
        const body = notification.request.content.body || "";

        // "등기부등본 변경" 또는 "등본 변경" 등의 키워드 확인
        if (
          title.includes("등기부등본") ||
          title.includes("등본") ||
          body.includes("등기부등본") ||
          body.includes("등본")
        ) {
          console.log("등기부등본 변경 알림 감지 - 분석 탭으로 이동");
          handleRegistrationChange();
        }
      });

    // 사용자가 알림을 탭했을 때 (앱이 백그라운드나 종료 상태에서)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("푸시 알림 탭됨:", response);

        const title = response.notification.request.content.title || "";
        const body = response.notification.request.content.body || "";

        if (
          title.includes("등기부등본") ||
          title.includes("등본") ||
          body.includes("등기부등본") ||
          body.includes("등본")
        ) {
          console.log("등기부등본 변경 알림 탭 - 분석 탭으로 이동");
          handleRegistrationChange();
        }
      });

    // 알림 권한 요청
    const requestPermissions = async () => {
      try {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus === "granted") {
          console.log("푸시 알림 권한 허용됨");
          // 푸시 토큰 가져오기 (백엔드에 등록할 때 사용)
          try {
            const token = await Notifications.getExpoPushTokenAsync({
              projectId: undefined,
            });
            console.log("푸시 토큰:", token.data);
            // TODO: 백엔드에 토큰 전송
          } catch (error) {
            console.log("푸시 토큰 가져오기 실패:", error);
          }
        }
      } catch (error) {
        console.log("알림 권한 요청 실패:", error);
      }
    };

    requestPermissions();

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [handleRegistrationChange]);

  useEffect(() => {
    //
    // 👇👇👇
    //
    //    [최종 수정]
    //    Linter 경고를 피하기 위해 .length 대신 !segments[0]으로 변경
    //    (배열이 비어있으면 segments[0]은 undefined가 되어 'falsy'로 취급됨)
    //
    if (!isNavigationReady || !segments[0]) {
      return;
    }
    //
    // 👆👆👆
    //

    const inAuthGroup = segments[0] === "(auth)";

    if (isAuthenticated && inAuthGroup) {
      // 로그인 O, (auth) 화면 O -> 메인으로 이동
      router.replace("/(tabs)/" as any);
    } else if (!isAuthenticated && !inAuthGroup) {
      // 로그인 X, (auth) 화면 X -> 로그인으로 이동
      router.replace("/(auth)/login" as any);
    }
  }, [isAuthenticated, segments, router, isNavigationReady]);

  // 스택 레이아웃 정의 (모든 화면 등록)
  return (
    <Stack
      screenOptions={{
        headerTitleStyle: {
          fontWeight: "700",
        },
        headerBackTitle: "",
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false, title: "" }} />
      <Stack.Screen
        name="modal"
        options={{
          title: "새 주택 등록",
          presentation: "modal",
          headerTitle: "새 주택 등록",
          headerBackTitle: "",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="upload/index"
        options={{
          title: "등기부등본 업로드",
          headerTitle: "등기부등본 업로드",
          headerBackTitle: "",
        }}
      />
    </Stack>
  );
}

// 2. AuthProvider와 PropertyProvider로 앱 전체를 감싸줍니다.
import { PropertyProvider } from "../contexts/PropertyContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <PropertyProvider>
        <RootLayoutNav />
      </PropertyProvider>
    </AuthProvider>
  );
}
