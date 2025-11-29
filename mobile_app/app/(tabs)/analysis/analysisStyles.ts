// app/(tabs)/analysis/analysisStyles.ts
// 분석 화면 스타일 정의

import { StyleSheet } from "react-native";
import {
  Colors,
  Spacing,
  Typography,
  globalStyles,
} from "../../../constants/styles";

export const styles = StyleSheet.create({
  scrollContent: {
    padding: Spacing.medium,
    paddingBottom: Spacing.xLarge + 25,
  },
  pendingCard: {
    ...globalStyles.card,
    marginBottom: Spacing.medium,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.small,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.small,
  },
  deleteButton: {
    padding: Spacing.tiny,
  },
  pendingTitle: {
    ...Typography.body1,
    fontSize: 14,
    fontWeight: "700",
    marginLeft: Spacing.small,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.small,
    paddingVertical: Spacing.tiny,
  },
  infoLabel: {
    ...Typography.body2,
    fontWeight: "600",
    width: 100,
    color: Colors.textSecondary,
  },
  infoValue: {
    ...Typography.body1,
    flex: 1,
    color: Colors.textPrimary,
  },
  analyzeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#008080",
    paddingVertical: Spacing.medium,
    borderRadius: 12,
    marginTop: Spacing.medium,
  },
  analyzeButtonText: {
    ...Typography.body1,
    color: "white",
    fontWeight: "700",
    marginLeft: Spacing.small,
  },
  historySection: {
    marginTop: Spacing.medium,
  },
  sectionTitle: {
    ...Typography.h3,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.medium,
    color: Colors.textPrimary,
  },
  emptyHistory: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xLarge * 2,
  },
  emptyHistoryText: {
    ...Typography.body2,
    color: Colors.textSecondary,
    marginTop: Spacing.medium,
  },
  historyCard: {
    ...globalStyles.card,
    marginBottom: Spacing.medium,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.small,
  },
  historyInfo: {
    flex: 1,
    marginRight: Spacing.small,
  },
  historyAddress: {
    ...Typography.body1,
    fontWeight: "600",
    marginBottom: Spacing.tiny,
    fontSize: 16,
  },
  historyDate: {
    ...Typography.small,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  historyFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.small,
    paddingTop: Spacing.small,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  historyLtv: {
    ...Typography.body2,
    fontWeight: "600",
    color: Colors.textSecondary,
    fontSize: 14,
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
    padding: Spacing.large,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: Spacing.large,
  },
  modalTitle: {
    ...Typography.h2,
    fontSize: 22,
    fontWeight: "700",
    marginTop: Spacing.small,
    color: Colors.textPrimary,
  },
  modalBody: {
    maxHeight: 300,
  },
  guideSection: {
    marginBottom: Spacing.medium,
  },
  guideTitle: {
    ...Typography.h3,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.medium,
    color: Colors.textPrimary,
  },
  guideItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.small,
  },
  guideText: {
    ...Typography.body1,
    marginLeft: Spacing.small,
    color: Colors.textPrimary,
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: Spacing.large,
    gap: Spacing.medium,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.medium,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: Colors.border,
  },
  cancelButtonText: {
    ...Typography.body1,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  confirmButton: {
    backgroundColor: "#008080",
  },
  confirmButtonText: {
    ...Typography.body1,
    fontWeight: "700",
    color: "white",
  },
  // PDF 미리보기 스타일
  pdfPreviewContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  pdfPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pdfPreviewTitle: {
    ...Typography.h3,
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    padding: Spacing.small,
  },
  pdfPreviewContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.large,
  },
  pdfInfoContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.large,
  },
  pdfFilePath: {
    ...Typography.body2,
    marginTop: Spacing.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: Spacing.medium,
    fontSize: 12,
  },
  pdfSizeText: {
    ...Typography.small,
    marginTop: Spacing.small,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  pdfPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  pdfPlaceholderText: {
    ...Typography.h3,
    marginTop: Spacing.medium,
    color: Colors.textPrimary,
  },
  pdfUrlText: {
    ...Typography.body2,
    marginTop: Spacing.small,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  pdfNote: {
    ...Typography.body2,
    marginTop: Spacing.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: Spacing.large,
  },
  openPdfButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#008080",
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.large,
    borderRadius: 12,
    marginTop: Spacing.large,
  },
  openPdfButtonText: {
    ...Typography.body1,
    color: "white",
    fontWeight: "700",
    marginLeft: Spacing.small,
  },
});
