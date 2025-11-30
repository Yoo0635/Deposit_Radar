// notificationListener.ts
// Headless JS 태스크 - 앱이 백그라운드일 때도 알림 감지

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

/**
 * Headless JS 태스크 - 백그라운드에서 알림을 감지하고 처리
 * 이 함수는 앱이 백그라운드나 종료 상태에서도 실행됩니다.
 * 
 * @param notification - 알림 데이터 (JSON 문자열 또는 객체)
 */
export const headlessNotificationListener = async ({ notification }: any) => {
  if (!notification) {
    return Promise.resolve();
  }

  try {
    // 알림 데이터 파싱 (JSON 문자열일 수 있음)
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

    // 모든 텍스트를 합쳐서 검색 (대소문자 구분 없이)
    const allText = `${title} ${text} ${bigText} ${subText} ${summaryText}`;

    console.log("Headless JS - 알림 텍스트 확인:", allText);

    // "등기부등본 변경" 또는 "등본 변경" 등의 키워드 확인
    if (
      allText.includes("등기부등본") ||
      allText.includes("등본") ||
      allText.includes("등기부")
    ) {
      console.log(
        "✅ 등기부등본 변경 알림 감지 (백그라운드):",
        notificationData
      );

      // 알림 데이터를 AsyncStorage에 저장 (앱이 포그라운드로 올 때 확인)
      const dataToSave = {
        id: Date.now().toString(),
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
        requestDate: notificationData.request_date || new Date().toISOString(),
      };

      // 알림 ID 기반 중복 체크 (같은 알림이 이미 처리되었는지 확인)
      const notificationId = dataToSave.id;
      const processedNotificationId = await AsyncStorage.getItem(
        "lastProcessedNotificationId"
      );

      // 이미 처리된 알림이면 스킵
      if (processedNotificationId === notificationId) {
        console.log(
          "중복 알림 감지 (Headless JS) - 이미 처리된 알림 ID:",
          notificationId
        );
        return Promise.resolve();
      }

      // 무한 알림 방지: 마지막 처리 시간 확인 (5초 쿨다운)
      try {
        const now = Date.now();
        const lastProcessTimeStr = await AsyncStorage.getItem(
          "lastNotificationProcessTime"
        );
        const lastProcessTime = lastProcessTimeStr
          ? Number(lastProcessTimeStr)
          : 0;
        const timeSinceLastProcess = now - lastProcessTime;
        const PROCESS_COOLDOWN = 5000; // 5초

        // 쿨다운 시간이 지났으면 새로운 알림으로 인식하고 표시
        if (timeSinceLastProcess >= PROCESS_COOLDOWN) {
          // 마지막 처리 시간과 알림 ID 저장
          await AsyncStorage.setItem(
            "lastNotificationProcessTime",
            now.toString()
          );
          await AsyncStorage.setItem(
            "lastProcessedNotificationId",
            notificationId
          );

          // 알림 데이터 저장
          await AsyncStorage.setItem(
            "pendingNotification",
            JSON.stringify(dataToSave)
          );

          console.log("알림 데이터 저장 완료 (Headless JS)");

          // 알림 표시 (하나만!)
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "등기부등본 변경 알림",
              body: "등기부등본 변경 사항이 감지되었습니다. 앱을 실행할까요?",
              data: dataToSave as any,
            },
            trigger: null, // 즉시 표시
          });
          console.log("등기부등본 변경 알림 표시 (Headless JS - 1개만)");
        } else {
          console.log(
            `중복 알림 감지 (Headless JS) - 스킵 (마지막 처리로부터 ${Math.floor(
              timeSinceLastProcess / 1000
            )}초 경과)`
          );
        }
      } catch (error) {
        console.log("알림 표시 중 오류 (Headless JS):", error);
      }
    }
  } catch (error) {
    console.log("알림 처리 중 오류:", error);
  }

  return Promise.resolve();
};
