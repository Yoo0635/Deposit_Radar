// app/(tabs)/analysis/index.tsx
// 분석 화면 컴포넌트 - 등기부등본 분석 요청 및 결과 표시 (기록창 스타일)
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RiskBadge from "../../../components/riskBadge";
import { Colors, globalStyles } from "../../../constants/styles";
import { useNotification } from "../../../contexts/NotificationContext";
import { useProperties } from "../../../contexts/PropertyContext";
import { API_ENDPOINTS } from "../../../constants/api";
import { styles } from "./analysisStyles";

export default function AnalysisScreen() {
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [lastShownNotificationId, setLastShownNotificationId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const { pendingNotification, clearPendingNotification } = useNotification();
  const { properties } = useProperties();

  // 알림 데이터가 있으면 자동으로 분석 모달 표시
  useEffect(() => {
    // 새로운 알림이 감지되면 모달 표시
    if (pendingNotification) {
      const currentNotificationId = pendingNotification.id;

      // 이전에 표시한 알림과 다른 알림이면 모달 표시
      // 모달이 이미 열려있으면 다시 열지 않음
      if (
        currentNotificationId !== lastShownNotificationId &&
        !showAnalysisModal
      ) {
        // 약간의 지연을 주어 화면이 완전히 렌더링된 후 모달 표시
        const timer = setTimeout(() => {
          setShowAnalysisModal(true);
          setLastShownNotificationId(currentNotificationId);
        }, 500);

        return () => clearTimeout(timer);
      }
    } else {
      // pendingNotification이 없으면 모달도 닫기
      if (showAnalysisModal) {
        setShowAnalysisModal(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingNotification, lastShownNotificationId]);

  const handleConfirmAnalysis = async () => {
    if (!pendingNotification) {
      return;
    }

    // 알림 데이터를 먼저 저장 (clearPendingNotification 호출 전에)
    const notificationData = { ...pendingNotification };
    const notificationId = pendingNotification.id;

    // 같은 알림이 다시 열리지 않도록 ID 저장
    setLastShownNotificationId(notificationId);

    // 즉시 모달 닫기
    setShowAnalysisModal(false);

    // 알림 데이터 제거 (모달이 다시 열리지 않도록)
    clearPendingNotification();

    // PropertyContext에서 등록한 주택 주소 가져오기 (가장 최근 등록한 주택)
    const registeredAddress =
      properties.length > 0
        ? properties[properties.length - 1].address
        : notificationData.address;

    // 가장 최근 등록한 주택의 contract_id 가져오기
    const latestProperty =
      properties.length > 0 ? properties[properties.length - 1] : null;

    if (!latestProperty) {
      Alert.alert("오류", "등록된 주택이 없습니다. 먼저 주택을 등록해주세요.");
      return;
    }

    const contractId = latestProperty.id;
    console.log(`📋 [분석 시작] Contract ID: ${contractId}`);

    // ⚠️ 디버깅: AsyncStorage에 저장된 알림 데이터 확인
    try {
      const AsyncStorage = (
        await import("@react-native-async-storage/async-storage")
      ).default;
      const storedNotification = await AsyncStorage.getItem(
        "pendingNotification"
      );
      if (storedNotification) {
        const storedData = JSON.parse(storedNotification);
        console.log(`📦 [AsyncStorage 저장된 데이터]`, storedData);
        console.log(
          `   - deposit: ${storedData.deposit?.toLocaleString()}원 (이 값은 UI 표시용, 실제 계산은 백엔드 최신 값 사용)`
        );
      }
    } catch (e) {
      console.log(`⚠️ AsyncStorage 확인 실패:`, e);
    }

    try {
      // 0단계: 백엔드에서 최신 계약 정보 가져오기 (보증금 변경 반영)
      console.log(`🔄 [0단계] 최신 계약 정보 조회`);
      const contractResponse = await fetch(
        API_ENDPOINTS.CONTRACT_BY_ID(contractId),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (contractResponse.ok) {
        const contractData = await contractResponse.json();
        console.log(
          `✅ [백엔드 최신 계약 정보] 보증금: ${contractData.deposit?.toLocaleString()}원`
        );
        console.log(`   ⚠️ [중요] 이 값이 실제 LTV 계산에 사용됩니다!`);
        console.log(
          `   📦 AsyncStorage 저장값: ${notificationData.deposit?.toLocaleString()}원 (UI 표시용, 무시됨)`
        );
      } else {
        console.log(`⚠️ 계약 정보 조회 실패, 기존 데이터 사용`);
      }

      // 1단계: 두 번째 스냅샷 자동 생성 (로딩 없이 백그라운드에서 처리)
      console.log(`🔄 [1단계] 두 번째 스냅샷 생성 요청`);
      const snapshotResponse = await fetch(
        API_ENDPOINTS.AUTO_SECOND_SNAPSHOT(contractId),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!snapshotResponse.ok) {
        const errorText = await snapshotResponse.text();
        console.error("두 번째 스냅샷 생성 실패:", errorText);
        Alert.alert("오류", "스냅샷 생성에 실패했습니다. 다시 시도해주세요.");
        return;
      }

      console.log(`✅ [1단계 완료] 두 번째 스냅샷 생성 완료`);

      // 2단계: PDF 생성 (로딩 표시 시작)
      setIsLoading(true);
      setLoadingMessage("PDF 파일 생성 중...");
      console.log(`📄 [2단계] PDF 생성 요청`);

      const pdfResponse = await fetch(API_ENDPOINTS.GENERATE_REPORT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contract_id: contractId,
          risk: (notificationData as any).message || "등기부등본 변경사항 감지",
        }),
      });

      if (!pdfResponse.ok) {
        const errorText = await pdfResponse.text();
        console.error("PDF 생성 실패:", errorText);
        setIsLoading(false);
        Alert.alert("오류", "PDF 생성에 실패했습니다. 다시 시도해주세요.");
        return;
      }

      // 백엔드 JSON 응답 파싱
      const backendResponse = await pdfResponse.json();
      const pdfUrl = backendResponse.download_url;
      const riskGrade = backendResponse.risk_grade; // RED, AMBER, GREEN

      console.log(`✅ [2단계 완료] PDF 생성 완료: ${pdfUrl}`);
      console.log(`🎯 [위험 등급] ${riskGrade}`);

      // 로딩 종료
      setIsLoading(false);
      setLoadingMessage("");

      // 분석 기록에 추가 (PDF 생성 후에만 기록으로 추가)
      const newAnalysis = {
        ...notificationData,
        address: registeredAddress, // 등록한 주택 주소 사용
        analysisDate: new Date().toISOString(),
        pdfUrl: pdfUrl,
        riskLevel: riskGrade, // RED, AMBER, GREEN
      };

      setAnalysisHistory([newAnalysis, ...analysisHistory]);

      // 처리된 알림 ID 저장 (사용자가 "예"를 눌러 PDF 생성이 완료되었을 때만)
      try {
        const AsyncStorage = (
          await import("@react-native-async-storage/async-storage")
        ).default;
        await AsyncStorage.setItem("lastShownNotificationId", notificationId);
        // pendingNotification도 삭제
        await AsyncStorage.removeItem("pendingNotification");
        console.log("✅ 알림 처리 완료 - ID 저장:", notificationId);

        // PDF 생성 완료 후 백엔드 DB에서 알림 삭제
        try {
          const deleteResponse = await fetch(
            API_ENDPOINTS.DELETE_NOTIFICATION(notificationId),
            {
              method: "DELETE",
            }
          );
          if (deleteResponse.ok) {
            console.log("✅ 백엔드 알림 삭제 완료:", notificationId);
          } else {
            console.log("백엔드 알림 삭제 실패:", deleteResponse.status);
          }
        } catch (error) {
          console.log("백엔드 알림 삭제 오류:", error);
        }
      } catch (error) {
        console.log("알림 ID 저장 실패:", error);
      }

      // PDF 미리보기 표시
      setPdfUrl(pdfUrl);
      setShowPdfPreview(true);
    } catch (error) {
      console.error("분석 오류:", error);
      setIsLoading(false);
      setLoadingMessage("");
      Alert.alert("오류", "분석 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  const handleViewPDF = async (pdfUrl: string) => {
    try {
      // PDF URL이 있으면 브라우저나 PDF 뷰어로 열기
      const canOpen = await Linking.canOpenURL(pdfUrl);
      if (canOpen) {
        await WebBrowser.openBrowserAsync(pdfUrl, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        });
      } else {
        Alert.alert("오류", "PDF를 열 수 없습니다.");
      }
    } catch (error) {
      console.error("PDF 열기 오류:", error);
      Alert.alert("오류", "PDF를 열 수 없습니다.");
    }
  };

  const handleCancelAnalysis = () => {
    setShowAnalysisModal(false);
    // 알림 데이터 제거
    clearPendingNotification();
  };

  const handleDeleteAnalysis = (index: number) => {
    Alert.alert("분석 기록 삭제", "이 분석 기록을 삭제하시겠습니까?", [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          const newHistory = analysisHistory.filter((_, i) => i !== index);
          setAnalysisHistory(newHistory);
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={globalStyles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 분석 기록 목록 (메인) */}
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>분석 기록</Text>
          </View>

          {/* 분석 기록만 표시 (분석 대기 항목은 화면에 표시하지 않음) */}
          {analysisHistory.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Ionicons
                name="document-text-outline"
                size={60}
                color={Colors.textSecondary}
              />
              <Text style={styles.emptyHistoryText}>
                아직 분석 기록이 없습니다.
              </Text>
            </View>
          ) : (
            analysisHistory.map((item, index) => (
              <View key={index} style={styles.historyCard}>
                <TouchableOpacity
                  style={styles.historyCardContent}
                  onPress={() => {
                    if (item.pdfUrl) {
                      handleViewPDF(item.pdfUrl);
                    }
                  }}
                >
                  <View style={styles.historyHeader}>
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyAddress} numberOfLines={1}>
                        {item.address}
                      </Text>
                      <Text style={styles.historyDate}>
                        {(() => {
                          const date = new Date(item.analysisDate);
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(
                            2,
                            "0"
                          );
                          const day = String(date.getDate()).padStart(2, "0");
                          return `${year}. ${month}. ${day}.`;
                        })()}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={Colors.textSecondary}
                    />
                  </View>
                  <View style={styles.historyFooter}>
                    <RiskBadge level={item.riskLevel} />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteAnalysis(index)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={Colors.danger}
                  />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* 분석 확인 모달 */}
      <Modal
        visible={showAnalysisModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelAnalysis}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="analytics" size={32} color="#008080" />
              <Text style={styles.modalTitle}>분석하시겠습니까?</Text>
            </View>

            <ScrollView style={styles.modalBody}>
              {pendingNotification && (
                <View style={styles.notificationMessage}>
                  <Ionicons name="notifications" size={20} color="#008080" />
                  <Text style={styles.notificationText}>
                    등기부등본 변경사항이 감지되었습니다.
                  </Text>
                </View>
              )}
              <View style={styles.guideSection}>
                <Text style={styles.guideTitle}>분석 내용</Text>
                <View style={styles.guideItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={Colors.success}
                  />
                  <Text style={styles.guideText}>LTV 계산 및 위험도 평가</Text>
                </View>
                <View style={styles.guideItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={Colors.success}
                  />
                  <Text style={styles.guideText}>
                    선순위 채권 유형 변경 분석
                  </Text>
                </View>
                <View style={styles.guideItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={Colors.success}
                  />
                  <Text style={styles.guideText}>위험등급 재평가</Text>
                </View>
                <View style={styles.guideItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={Colors.success}
                  />
                  <Text style={styles.guideText}>
                    임대인에게 보낼 문자 초안 제공
                  </Text>
                </View>
                <View style={styles.guideItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={Colors.success}
                  />
                  <Text style={styles.guideText}>
                    회수 금액 산정 및 대응 가이드라인 제공
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelAnalysis}
              >
                <Text style={styles.cancelButtonText}>아니오</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirmAnalysis}
              >
                <Text style={styles.confirmButtonText}>예</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PDF 미리보기 모달 */}
      <Modal
        visible={showPdfPreview}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowPdfPreview(false)}
      >
        <SafeAreaView
          style={styles.pdfPreviewContainer}
          edges={["top", "bottom"]}
        >
          <View style={styles.pdfPreviewHeader}>
            <Text style={styles.pdfPreviewTitle}>분석 리포트</Text>
            <TouchableOpacity
              onPress={() => setShowPdfPreview(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.pdfPreviewContent}>
            {pdfUrl ? (
              <View style={styles.pdfPlaceholder}>
                <Ionicons
                  name="document-text"
                  size={80}
                  color={Colors.textSecondary}
                />
                <Text style={styles.pdfPlaceholderText}>
                  PDF 리포트가 생성되었습니다
                </Text>
                <Text style={styles.pdfNote}>
                  PDF를 열어서 상세 분석 결과를 확인하세요.
                </Text>
                <TouchableOpacity
                  style={styles.openPdfButton}
                  onPress={() => {
                    if (pdfUrl) {
                      handleViewPDF(pdfUrl);
                    }
                  }}
                >
                  <Ionicons name="open-outline" size={20} color="white" />
                  <Text style={styles.openPdfButtonText}>PDF 열기</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.pdfPlaceholder}>
                <Ionicons
                  name="hourglass-outline"
                  size={80}
                  color={Colors.textSecondary}
                />
                <Text style={styles.pdfPlaceholderText}>PDF 생성 중...</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* 로딩 오버레이 */}
      {isLoading && (
        <Modal visible={isLoading} transparent={true} animationType="fade">
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#008080" />
              <Text style={styles.loadingText}>{loadingMessage}</Text>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
