// notificationListener.ts
// Headless JS 태스크 - 앱이 백그라운드일 때도 알림 감지
// Android NotificationListenerService를 통해 시스템 알림을 감지하고 처리

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { API_ENDPOINTS } from "./constants/api";

/**
 * 알림 제목에 "등기부등본"이 포함되어 있는지 확인
 * 제목만 확인하여 하나의 알림을 하나의 이벤트로 처리
 */
const isRegistryNotification = (title: string): boolean => {
  if (!title) return false;
  return title.includes("등기부등본");
};

/**
 * [수정] 알림 ID 생성: 시간을 포함하여 다른 알림으로 인식
 * - 5초 단위로 반올림하여 같은 5초 내 알림은 같은 ID (중복 방지)
 * - 5초가 지나면 다른 ID (새로운 알림으로 인식)
 * - DB에 기록이 쌓이지만 삭제할 필요 없음
 */
const generateNotificationId = (notificationData: any): string => {
  const appName = notificationData.app || "";
  const title = notificationData.title || "";
  const text = notificationData.text || "";

  // 현재 시간을 5초 단위로 반올림 (밀리초 제거)
  const now = Date.now();
  const timeInSeconds = Math.floor(now / 1000);
  const roundedTime = Math.floor(timeInSeconds / 5) * 5; // 5초 단위로 반올림

  // 시간을 포함하여 ID 생성 (5초 단위)
  return `${appName}_${title}_${text}_${roundedTime}`;
};

/**
 * Headless JS 태스크 - 백그라운드에서 알림을 감지하고 처리
 * 이 함수는 앱이 백그라운드나 종료 상태에서도 실행됩니다.
 *
 * Android NotificationListenerService의 onNotificationPosted가 호출될 때마다
 * 이 함수가 실행됩니다.
 *
 * @param notification - 알림 데이터 (JSON 문자열 또는 객체)
 */
export const headlessNotificationListener = async ({ notification }: any) => {
  if (!notification) return Promise.resolve();

  try {
    const notificationData =
      typeof notification === "string"
        ? JSON.parse(notification)
        : notification;

    const appName = notificationData.app || "";

    // 내 앱 무시
    if (
      appName.includes("depositradar") ||
      appName.includes("com.mokwon.depositradar")
    ) {
      return Promise.resolve();
    }

    const title = notificationData.title || "";

    if (!isRegistryNotification(title)) {
      return Promise.resolve();
    }

    // 1. ID 생성 (내용 기반 + 시간 포함)
    const notificationId = generateNotificationId(notificationData);

    // 2. [핵심] 클라이언트 사이드 빠른 중복 체크 (백엔드 호출 전)
    const processedKey = `processed_${notificationId}`;
    const lastProcessedTimeKey = `time_${notificationId}`;

    // 즉시 처리 마커 확인 (가장 먼저 - 가장 빠른 체크)
    const alreadyProcessed = await AsyncStorage.getItem(processedKey);
    if (alreadyProcessed === "true") {
      console.log(`🚫 이미 처리된 알림 (처리 마커 확인): ${notificationId}`);
      return Promise.resolve();
    }

    // 쿨다운 체크
    const lastProcessedTimeStr = await AsyncStorage.getItem(
      lastProcessedTimeKey
    );
    const now = Date.now();

    if (lastProcessedTimeStr) {
      const lastTime = parseInt(lastProcessedTimeStr, 10);
      const timeDiff = now - lastTime;
      // 5초 이내에 같은 알림이 또 왔다? -> 즉시 무시 (백엔드 호출 전)
      if (timeDiff < 5000) {
        console.log(
          `🚫 클라이언트 중복 감지 (5초 내 재호출): ${notificationId}`
        );
        return Promise.resolve();
      }
    }

    // 처리 마커 즉시 설정 (다른 프로세스가 처리하지 않도록)
    await AsyncStorage.setItem(processedKey, "true");

    // 처리 마커 확인 (race condition 방지)
    const verifyProcessed = await AsyncStorage.getItem(processedKey);
    if (verifyProcessed !== "true") {
      console.log(`🚫 처리 마커 설정 실패 - 이미 처리됨: ${notificationId}`);
      return Promise.resolve();
    }

    // 3. [핵심] 백엔드에서 중복 체크
    try {
      const checkResponse = await fetch(API_ENDPOINTS.CHECK_NOTIFICATION, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notification_id: notificationId,
        }),
      });

      if (!checkResponse.ok) {
        console.log("백엔드 중복 체크 실패:", checkResponse.status);
        // 백엔드 실패 시에도 처리 마커는 이미 설정되어 있음
        // 쿨다운 시간만 저장
        await AsyncStorage.setItem(lastProcessedTimeKey, now.toString());
      } else {
        const checkResult = await checkResponse.json();

        // 중복이면 무시
        if (!checkResult.should_show) {
          console.log(
            `🚫 백엔드 중복 감지: ${notificationId} - ${checkResult.message}`
          );
          // 처리 마커는 이미 설정되어 있음
          return Promise.resolve();
        }

        console.log(
          `✅ 백엔드 확인 완료: ${notificationId} - ${checkResult.message}`
        );
        // 백엔드 확인 완료 시 쿨다운 시간 저장 (처리 마커는 이미 설정됨)
        await AsyncStorage.setItem(lastProcessedTimeKey, now.toString());
      }
    } catch (error) {
      console.log("백엔드 중복 체크 오류:", error);
      // 백엔드 오류 시에도 처리 마커는 이미 설정되어 있음
      // 쿨다운 시간만 저장
      await AsyncStorage.setItem(lastProcessedTimeKey, now.toString());
    }

    // ---------------------------------------------------------
    // 알림 실행 확정 전 최종 중복 체크
    // ---------------------------------------------------------
    // 알림 표시 직전에 한 번 더 확인 (race condition 방지)
    const finalCheck = await AsyncStorage.getItem(processedKey);
    if (finalCheck !== "true") {
      // 다른 프로세스가 이미 처리했을 수 있음
      console.log(`🚫 최종 체크 실패 - 이미 처리됨: ${notificationId}`);
      return Promise.resolve();
    }

    // 처리 마커 재확인 (이중 체크)
    const doubleCheck = await AsyncStorage.getItem(processedKey);
    if (doubleCheck !== "true") {
      console.log(`🚫 이중 체크 실패 - 이미 처리됨: ${notificationId}`);
      return Promise.resolve();
    }

    console.log("✅ 등기부등본 변경 알림 처리 시작:", notificationId);

    // 데이터 매핑
    const dataToSave = {
      id: notificationId,
      address: notificationData.address || "주소 정보 없음",
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

    // 알림 데이터 저장
    await AsyncStorage.setItem(
      "pendingNotification",
      JSON.stringify(dataToSave)
    );

    // 로컬 알림 표시
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "등기부등본 변경 알림",
        body: "등기부등본 변경 사항이 감지되었습니다. 앱을 실행하시겠습니까?",
        data: dataToSave as any,
      },
      trigger: null,
    });

    console.log("✅ 알림 표시 완료:", notificationId);

    // 알림 표시 직후 즉시 백엔드에서 삭제하지 않음
    // 클라이언트 사이드 쿨다운(5초)으로 중복 방지하고,
    // 나중에 같은 내용의 새로운 알림이 와도 처리 가능하도록 DB는 유지
    // (DB는 수동으로 삭제하거나 주기적으로 정리)
  } catch (error) {
    console.log("알림 처리 중 오류:", error);
  }

  return Promise.resolve();
};
