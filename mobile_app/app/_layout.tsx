// app/_layout.tsx
// 루트 레이아웃 파일 - 인증 상태에 따른 화면 전환 및 알림 감지
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { AppRegistry, AppState, NativeModules, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import RNAndroidNotificationListener, {
  RNAndroidNotificationListenerHeadlessJsName,
} from "react-native-android-notification-listener";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { PropertyProvider } from "../contexts/PropertyContext";
import {
  NotificationData,
  NotificationProvider,
  useNotification,
} from "../contexts/NotificationContext";
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
  const { isAuthenticated, login, isLoading: authLoading } = useAuth();
  const { setPendingNotification, pendingNotification } = useNotification();
  const segments = useSegments();
  const router = useRouter();

  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const lastNotificationTime = useRef<number>(0); // 알림 무한 방지

  useEffect(() => {
    setIsNavigationReady(true);
  }, []);

  // 자동 로그인이 활성화되어 있고 알림 데이터가 있으면 분석 화면으로 이동
  useEffect(() => {
    if (
      !authLoading &&
      isNavigationReady &&
      isAuthenticated &&
      pendingNotification
    ) {
      console.log("자동 로그인 + 알림 데이터 감지 - 분석 화면으로 이동");
      setTimeout(() => {
        router.replace("/(tabs)/analysis" as any);
      }, 300);
    }
  }, [
    authLoading,
    isNavigationReady,
    isAuthenticated,
    pendingNotification,
    router,
  ]);

  // 등기부등본 변경 시 자동 처리 함수 - 분석 탭으로 이동
  const handleRegistrationChange = React.useCallback(async () => {
    console.log("등기부등본 변경 알림 감지 - 분석 탭으로 이동");

    // 앱이 시작되는 중일 수 있으므로 약간의 지연
    await new Promise((resolve) => setTimeout(resolve, 800));

    // 알림을 탭했을 때는 인증 상태와 상관없이 바로 분석 화면으로 이동
    // 분석 화면에서 알림 데이터가 있으면 모달이 자동으로 표시됨
    if (isNavigationReady) {
      router.push("/(tabs)/analysis" as any);
    }
  }, [isNavigationReady, router]);

  // 시스템 알림 처리 함수 (포그라운드에서는 알림 표시하지 않음)
  const handleSystemNotification = React.useCallback(
    async (notification: any) => {
      console.log("시스템 알림 감지 (포그라운드):", notification);

      // 알림 데이터 파싱
      const notificationData =
        typeof notification === "string"
          ? JSON.parse(notification)
          : notification;

      // 알림 내용 추출
      const title = notificationData.title || "";
      const text = notificationData.text || "";
      const bigText = notificationData.bigText || "";
      const subText = notificationData.subText || "";
      const summaryText = notificationData.summaryText || "";

      // 모든 텍스트를 합쳐서 검색
      const allText = `${title} ${text} ${bigText} ${subText} ${summaryText}`;

      console.log("알림 텍스트 확인:", allText);

      // "등기부등본 변경" 또는 "등본 변경" 등의 키워드 확인
      if (
        allText.includes("등기부등본") ||
        allText.includes("등본") ||
        allText.includes("등기부")
      ) {
        console.log("✅ 등기부등본 변경 알림 감지 (포그라운드)");

        // 알림 데이터 준비
        const notificationId = Date.now().toString();
        const dataToSave: NotificationData = {
          id: notificationId,
          address:
            notificationData.address || "서울 강남구 테헤란로 123-45, 101호",
          deposit: notificationData.deposit
            ? Number(notificationData.deposit)
            : 200000000,
          amount: notificationData.amount
            ? Number(notificationData.amount)
            : 50000000,
          market_price: notificationData.market_price
            ? Number(notificationData.market_price)
            : 300000000,
          ltv: notificationData.ltv ? Number(notificationData.ltv) : 83.3,
          riskLevel: notificationData.risk_level || "AMBER",
          seniorDebtType: notificationData.senior_debt_type || "근저당권",
          changeType: notificationData.change_type || "신규 설정",
          requestDate:
            notificationData.request_date || new Date().toISOString(),
        };

        // 중복 체크: 이미 처리된 알림인지 확인
        try {
          const AsyncStorage = (
            await import("@react-native-async-storage/async-storage")
          ).default;
          const processedNotificationId = await AsyncStorage.getItem(
            "lastProcessedNotificationId"
          );

          if (processedNotificationId === notificationId) {
            console.log(
              "포그라운드: 이미 처리된 알림 - 스킵",
              notificationId
            );
            return;
          }

          // 알림 ID 저장 (중복 방지)
          await AsyncStorage.setItem(
            "lastProcessedNotificationId",
            notificationId
          );
        } catch (error) {
          console.log("중복 체크 실패:", error);
        }

        // 포그라운드에서는 알림을 표시하지 않음 (Headless JS에서만 표시)
        // 알림 데이터만 저장하고 화면 이동만 처리
        console.log(
          "포그라운드: 알림 데이터 저장 - 알림 표시는 하지 않음 (Headless JS에서만 표시)"
        );

        // 알림 데이터를 Context에 저장
        setPendingNotification(dataToSave);

        // 자동 로그인
        login();

        // 분석 화면으로 이동
        setTimeout(() => {
          router.replace("/(tabs)/analysis" as any);
        }, 500);
      }
    },
    [login, router, setPendingNotification]
  );

  // Android 시스템 알림 감지 설정 (Android만 지원)
  // 포그라운드 리스너는 비활성화 - Headless JS만 사용하여 중복 알림 방지
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

          // 포그라운드 리스너 비활성화 - Headless JS만 사용
          // 중복 알림 방지를 위해 포그라운드에서는 처리하지 않음
          console.log(
            "포그라운드 시스템 알림 리스너 비활성화 - Headless JS만 사용하여 중복 알림 방지"
          );
        } catch (error) {
          console.log("Android 알림 권한 확인 실패:", error);
        }
      };

      checkAndRequestPermission();
    }
  }, []);

  // 앱이 포그라운드로 올 때 AsyncStorage에서 알림 데이터 확인
  useEffect(() => {
    const checkPendingNotification = async () => {
      try {
        const AsyncStorage = (
          await import("@react-native-async-storage/async-storage")
        ).default;
        const stored = await AsyncStorage.getItem("pendingNotification");
        if (stored) {
          const data = JSON.parse(stored);
          console.log("앱 포그라운드 - 저장된 알림 데이터 확인:", data);
          // 알림 데이터가 있고, 현재 pendingNotification이 없으면 설정
          if (!pendingNotification) {
            setPendingNotification(data);
            // 자동 로그인
            login();
            // 분석 화면으로 이동
            setTimeout(() => {
              router.replace("/(tabs)/analysis" as any);
            }, 500);
          }
        }
      } catch (error) {
        console.log("알림 데이터 확인 실패:", error);
      }
    };

    // 앱이 포그라운드로 올 때 확인
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        console.log("앱이 포그라운드로 전환됨 - 알림 데이터 확인");
        checkPendingNotification();
      }
    });

    // 앱 시작 시에도 확인
    checkPendingNotification();

    return () => {
      subscription.remove();
    };
  }, [pendingNotification, setPendingNotification, login, router]);

  // iOS/Android 푸시 알림 감지 설정 (백엔드에서 보낸 알림)
  useEffect(() => {
    // 포그라운드에서 알림을 받았을 때 (앱이 실행 중일 때)
    // 알림은 표시되지만, 사용자가 알림을 탭했을 때만 화면 이동
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("푸시 알림 수신:", notification);
        // 알림은 표시만 하고, 탭했을 때 처리 (responseListener에서 처리)
      });

    // 사용자가 알림을 탭했을 때 (앱이 백그라운드나 종료 상태에서)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(
        async (response) => {
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

            // 1. 알림 데이터에서 분석 정보 추출
            const notificationData = response.notification.request.content.data;

            // 2. 알림 데이터를 즉시 저장 (인증 체크 전에 저장)
            const dataToSave: NotificationData = notificationData
              ? {
                  id: String(notificationData.property_id || Date.now()),
                  address: String(notificationData.address || ""),
                  deposit: Number(notificationData.deposit || 0),
                  amount: notificationData.amount
                    ? Number(notificationData.amount)
                    : undefined,
                  market_price: notificationData.market_price
                    ? Number(notificationData.market_price)
                    : undefined,
                  ltv: notificationData.ltv
                    ? Number(notificationData.ltv)
                    : undefined,
                  riskLevel: String(notificationData.risk_level || "AMBER"),
                  seniorDebtType: notificationData.senior_debt_type
                    ? String(notificationData.senior_debt_type)
                    : undefined,
                  changeType: notificationData.change_type
                    ? String(notificationData.change_type)
                    : undefined,
                  requestDate: notificationData.request_date
                    ? String(notificationData.request_date)
                    : undefined,
                }
              : {
                  id: Date.now().toString(),
                  address: "서울 강남구 테헤란로 123-45, 101호",
                  deposit: 200000000,
                  amount: 50000000,
                  market_price: 300000000,
                  ltv: 83.3,
                  riskLevel: "AMBER",
                  seniorDebtType: "근저당권",
                  changeType: "신규 설정",
                  requestDate: new Date().toISOString(),
                };

            // 3. 알림 데이터를 Context에 저장
            setPendingNotification(dataToSave);

            // 5. 즉시 자동 로그인 (알림을 탭했을 때는 무조건 로그인)
            login();

            // 6. 분석 화면으로 즉시 이동
            setTimeout(() => {
              router.replace("/(tabs)/analysis" as any);
            }, 300);
          }
        }
      );

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
  }, [handleRegistrationChange, login, router, setPendingNotification]);

  useEffect(() => {
    // 로딩 중이면 인증 체크하지 않음
    if (authLoading || !isNavigationReady || !segments[0]) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";
    const inAnalysisTab = (segments as string[]).some(
      (seg) => seg === "analysis" || seg.includes("analysis")
    );

    // 알림 데이터가 있으면 자동 로그인하고 분석 화면으로 이동
    if (pendingNotification) {
      if (!isAuthenticated) {
        // 자동 로그인
        login();
      }

      if (inAnalysisTab) {
        return; // 분석 화면에 머물도록 함
      }
      if (inTabsGroup) {
        return; // tabs 그룹에 있으면 허용 (분석 화면 접근 가능)
      }
      // 알림 데이터가 있으면 분석 화면으로 바로 이동
      router.replace("/(tabs)/analysis" as any);
      return;
    }

    // 알림 데이터가 있으면 분석 화면으로 바로 이동
    if (pendingNotification && isAuthenticated) {
      if (!inAnalysisTab) {
        router.replace("/(tabs)/analysis" as any);
      }
      return;
    }

    if (isAuthenticated && inAuthGroup) {
      // 로그인 O, (auth) 화면 O -> 메인으로 이동
      router.replace("/(tabs)/" as any);
    } else if (!isAuthenticated && !inAuthGroup) {
      // 알림 데이터가 있으면 로그인 화면으로 리다이렉트하지 않음 (이미 자동 로그인 처리됨)
      if (pendingNotification) {
        return;
      }
      // 로그인 X, (auth) 화면 X -> 로그인으로 이동
      router.replace("/(auth)/login" as any);
    }
  }, [
    isAuthenticated,
    segments,
    router,
    isNavigationReady,
    pendingNotification,
    login,
    authLoading,
  ]);

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
          headerStyle: {
            backgroundColor: "#ffffff",
            elevation: 3,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            borderBottomWidth: 0,
            height: Platform.OS === "ios" ? 180 : 100,
          } as any,
          headerTitleStyle: {
            fontSize: 22,
            fontWeight: "700",
            marginTop: Platform.OS === "android" ? 10 : 10,
            lineHeight: 28,
            includeFontPadding: false,
          } as any,
          headerTitleAlign: "center",
        }}
      />
      <Stack.Screen
        name="upload/index"
        options={{
          title: "등기부등본 업로드",
          headerTitle: "등기부등본 업로드",
          headerBackTitle: "",
          headerStyle: {
            backgroundColor: "#ffffff",
            elevation: 3,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            borderBottomWidth: 0,
            height: Platform.OS === "ios" ? 180 : 100,
          } as any,
          headerTitleStyle: {
            fontSize: 22,
            fontWeight: "700",
            marginTop: Platform.OS === "android" ? 10 : 10,
            lineHeight: 28,
            includeFontPadding: false,
          } as any,
          headerTitleAlign: "center",
        }}
      />
    </Stack>
  );
}

// 2. AuthProvider와 PropertyProvider로 앱 전체를 감싸줍니다.
export default function RootLayout() {
  return (
    <AuthProvider>
      <PropertyProvider>
        <NotificationProvider>
        <RootLayoutNav />
        </NotificationProvider>
      </PropertyProvider>
    </AuthProvider>
  );
}
