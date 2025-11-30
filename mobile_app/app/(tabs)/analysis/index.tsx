// app/(tabs)/analysis/index.tsx
// 분석 화면 컴포넌트 - 등기부등본 분석 요청 및 결과 표시 (기록창 스타일)
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
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
import { styles } from "./analysisStyles";

export default function AnalysisScreen() {
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [lastShownNotificationId, setLastShownNotificationId] = useState<
    string | null
  >(null);
  const { pendingNotification, clearPendingNotification } = useNotification();
  const { properties } = useProperties();

  // 알림 데이터가 있으면 자동으로 분석 모달 표시
  useEffect(() => {
    console.log("분석 화면 - pendingNotification 확인:", pendingNotification);

    // 새로운 알림이 감지되면 모달 표시
    if (pendingNotification) {
      const currentNotificationId = pendingNotification.id;

      // 이전에 표시한 알림과 다른 알림이면 모달 표시
      // 모달이 이미 열려있으면 다시 열지 않음
      if (
        currentNotificationId !== lastShownNotificationId &&
        !showAnalysisModal
      ) {
        console.log("✅ 새로운 알림 데이터 감지 - 모달 표시");
        // 약간의 지연을 주어 화면이 완전히 렌더링된 후 모달 표시
        const timer = setTimeout(() => {
          setShowAnalysisModal(true);
          setLastShownNotificationId(currentNotificationId);
          console.log(
            "모달 표시 상태:",
            true,
            "알림 ID:",
            currentNotificationId
          );
        }, 500);

        return () => clearTimeout(timer);
      } else {
        console.log("❌ 이미 표시한 알림이거나 모달이 이미 열려있음");
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

    // PDF 생성 시뮬레이션
    setTimeout(async () => {
      // 백엔드에서 PDF 생성 시간 알림
      Alert.alert(
        "PDF 생성 중",
        "PDF 파일 생성 중입니다. 약 30초~1분 정도 소요됩니다.",
        [
          {
            text: "확인",
            onPress: async () => {
              // PropertyContext에서 등록한 주택 주소 가져오기 (가장 최근 등록한 주택)
              const registeredAddress =
                properties.length > 0
                  ? properties[properties.length - 1].address
                  : notificationData.address;

              // TODO: 백엔드 API 호출 (백엔드 연동 시 주석 해제)
              // const response = await fetch('/api/analyze', {
              //   method: 'POST',
              //   headers: { 'Content-Type': 'application/json' },
              //   body: JSON.stringify({ property_id: ... }),
              // });
              // const backendResponse = await response.json();
              // 백엔드 응답 구조: { status: "success", risk_grade: "RED", download_url: "http://127.0.0.1:8000/static/report_..." }

              // 임시 값 (백엔드 연동 전까지 사용)
              const riskGrade = "RED"; // 백엔드 연동 시: backendResponse.risk_grade
              const pdfUrl =
                "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"; // 백엔드 연동 시: backendResponse.download_url

              // 분석 기록에 추가 (PDF 생성 후에만 기록으로 추가)
              const newAnalysis = {
                ...notificationData,
                address: registeredAddress, // 등록한 주택 주소 사용
                analysisDate: new Date().toISOString(),
                pdfUrl: pdfUrl,
                riskLevel: riskGrade, // 백엔드 연동 시: backendResponse.risk_grade
              };

              setAnalysisHistory([newAnalysis, ...analysisHistory]);

              // PDF 미리보기 표시
              setPdfUrl(pdfUrl);
              setShowPdfPreview(true);
            },
          },
        ]
      );
    }, 1000);
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
                    법적 대응 요청서 양식 제공
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
    </ScrollView>
  );
}
