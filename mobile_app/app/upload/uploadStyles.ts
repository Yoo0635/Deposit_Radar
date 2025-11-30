// app/upload/uploadStyles.ts
// 등기부등본 업로드 화면 스타일 정의

import { StyleSheet } from "react-native";
import { Colors, Spacing, Typography } from "../../constants/styles";

export const styles = StyleSheet.create({
  subText: {
    ...Typography.body2,
    color: Colors.textSecondary,
    marginBottom: Spacing.large,
  },
  previewLabel: {
    ...Typography.body2,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePreviewContainer: {
    flexDirection: "row",
    gap: Spacing.small,
    flexWrap: "wrap",
  },
  imagePreviewItem: {
    position: "relative",
    width: "48%",
    aspectRatio: 3 / 4,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.small,
  },
  removeButtonText: {
    ...Typography.body2,
    color: Colors.danger,
    marginLeft: Spacing.small,
    fontWeight: "600",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.medium,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.medium,
  },
  uploadButtonText: {
    ...Typography.body1,
    color: "#008080",
    marginLeft: Spacing.medium,
    fontWeight: "bold",
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  submitButton: {
    backgroundColor: "#008080",
    padding: Spacing.medium,
    borderRadius: 8,
    alignItems: "center",
    marginTop: Spacing.large,
    marginBottom: Spacing.xLarge,
  },
  submitButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  submitButtonDisabled: { backgroundColor: Colors.textSecondary },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: Spacing.large,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.large,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    ...Typography.h2,
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: Spacing.tiny,
  },
  guideContent: {
    padding: Spacing.large,
  },
  guideItem: {
    flexDirection: "row",
    marginBottom: Spacing.large,
  },
  guideIconContainer: {
    marginRight: Spacing.medium,
  },
  guideTextContainer: {
    flex: 1,
  },
  guideTitle: {
    ...Typography.h3,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.tiny,
  },
  guideDescription: {
    ...Typography.body2,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  startCameraButton: {
    marginHorizontal: Spacing.large,
    marginTop: Spacing.medium,
    borderRadius: 12,
    overflow: "hidden",
  },
  startCameraGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.large,
  },
  startCameraText: {
    ...Typography.body1,
    color: "white",
    fontWeight: "700",
    marginLeft: Spacing.small,
  },
  pdfPreviewContainer: {
    width: "100%",
    minHeight: 200,
    borderRadius: 8,
    marginBottom: Spacing.medium,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.large,
  },
  pdfFileName: {
    ...Typography.body1,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: Spacing.medium,
    textAlign: "center",
  },
  pdfFileSize: {
    ...Typography.body2,
    color: Colors.textSecondary,
    marginTop: Spacing.small,
  },
});

