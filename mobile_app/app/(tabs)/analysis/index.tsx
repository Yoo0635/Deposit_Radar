// app/(tabs)/analysis/index.tsx
// 분석 화면 컴포넌트 - 등기부등본 분석 요청 및 결과 표시 (기록창 스타일)
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import RiskBadge from "../../../components/riskBadge";
import { Colors, globalStyles } from "../../../constants/styles";
import { styles } from "./analysisStyles";

export default function AnalysisScreen() {
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  // 분석 요청 데이터 (실제로는 알림에서 받은 데이터)
  const [pendingAnalysis, setPendingAnalysis] = useState<any>({
    id: "1",
    address: "서울 강남구 테헤란로 123-45, 101호",
    deposit: 200000000,
    amount: 50000000,
    market_price: 300000000,
    ltv: 83.3,
    riskLevel: "AMBER",
    seniorDebtType: "근저당권",
    changeType: "신규 설정",
    requestDate: "2025-01-20",
  });

  const handleAnalyze = () => {
    setShowAnalysisModal(true);
  };

  const handleConfirmAnalysis = async () => {
    setShowAnalysisModal(false);

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
              // 백엔드에서 PDF URL 받아오기 (실제로는 API 호출)
              // TODO: 실제 백엔드 API 엔드포인트로 변경
              const mockPdfUrl =
                "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

              // 분석 기록에 추가
              const newAnalysis = {
                ...pendingAnalysis,
                analysisDate: new Date().toISOString(),
                pdfUrl: mockPdfUrl,
              };

              setAnalysisHistory([newAnalysis, ...analysisHistory]);

              // PDF 생성 후 분석 대기 항목 제거
              setPendingAnalysis(null);

              // PDF 미리보기 표시
              setPdfUrl(mockPdfUrl);
              setShowPdfPreview(true);

              // PDF 미리보기 표시
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
  };

  const handleDeletePending = () => {
    Alert.alert("분석 대기 항목 삭제", "이 항목을 삭제하시겠습니까?", [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          setPendingAnalysis(null);
        },
      },
    ]);
  };

  // 위험등급에 따른 색상 반환 함수
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "RED":
        return Colors.danger;
      case "AMBER":
        return Colors.warning;
      case "GREEN":
        return Colors.success;
      default:
        return Colors.textSecondary;
    }
  };

  return (
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {/* 분석 기록 목록 (메인) */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>분석 기록</Text>

        {/* 분석 대기 항목 (알림에서 받은 데이터) - 기록 목록 상단에 표시 */}
        {pendingAnalysis && (
          <TouchableOpacity
            style={[
              styles.pendingCard,
              { borderLeftColor: getRiskColor(pendingAnalysis.riskLevel) },
            ]}
            onPress={handleAnalyze}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons
                  name="notifications"
                  size={20}
                  color={getRiskColor(pendingAnalysis.riskLevel)}
                />
                <Text
                  style={[
                    styles.pendingTitle,
                    { color: getRiskColor(pendingAnalysis.riskLevel) },
                  ]}
                >
                  분석 대기
                </Text>
              </View>
              <View style={styles.cardHeaderRight}>
                <RiskBadge level={pendingAnalysis.riskLevel} />
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeletePending();
                  }}
                  style={styles.deleteButton}
                >
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.historyAddress} numberOfLines={1}>
              {pendingAnalysis.address}
            </Text>

            <View style={styles.historyFooter}>
              <Text style={styles.historyLtv}>
                LTV: {pendingAnalysis.ltv.toFixed(1)}%
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.textSecondary}
              />
            </View>
          </TouchableOpacity>
        )}
        {analysisHistory.length === 0 && !pendingAnalysis ? (
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
            <TouchableOpacity
              key={index}
              style={styles.historyCard}
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
                    {new Date(item.analysisDate).toLocaleDateString("ko-KR")}
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
                <Text style={styles.historyLtv}>
                  LTV: {item.ltv.toFixed(1)}%
                </Text>
              </View>
            </TouchableOpacity>
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
        <View style={styles.pdfPreviewContainer}>
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
        </View>
      </Modal>
    </ScrollView>
  );
}
