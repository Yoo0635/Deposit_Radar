// notificationListener.ts
// Headless JS 태스크 - 앱이 백그라운드일 때도 알림 감지

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
      typeof notification === "string" ? JSON.parse(notification) : notification;

    // 알림 내용 추출
    const title = notificationData.title || "";
    const text = notificationData.text || "";
    const bigText = notificationData.bigText || "";
    const subText = notificationData.subText || "";
    const summaryText = notificationData.summaryText || "";

    // 모든 텍스트를 합쳐서 검색
    const allText = `${title} ${text} ${bigText} ${subText} ${summaryText}`.toLowerCase();

    // "등기부등본 변경" 또는 "등본 변경" 등의 키워드 확인
    if (
      allText.includes("등기부등본") ||
      allText.includes("등본") ||
      allText.includes("등기부")
    ) {
      console.log("등기부등본 변경 알림 감지 (백그라운드):", notificationData);

      // 여기서 필요한 작업 수행
      // 예: 백엔드 API 호출, 로컬 스토리지에 저장 등
      // 주의: Headless JS에서는 직접 네비게이션을 할 수 없으므로
      // Native Module을 통해 앱을 포그라운드로 가져와야 합니다
    }
  } catch (error) {
    console.log("알림 처리 중 오류:", error);
  }

  return Promise.resolve();
};

