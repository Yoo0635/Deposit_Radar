// app/modal/modalStyles.ts
// 주택 등록 모달 화면 스타일 정의

import { StyleSheet } from "react-native";
import { Colors, Spacing, Typography } from "../../constants/styles";

export const styles = StyleSheet.create({
  subText: {
    ...Typography.body2,
    color: Colors.textSecondary,
    marginBottom: Spacing.large,
  },
  inputLabel: {
    ...Typography.body2,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginTop: Spacing.medium,
    marginBottom: Spacing.tiny,
  },
  textInput: {
    ...Typography.body1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.small,
    marginBottom: Spacing.small,
    backgroundColor: Colors.background + "F0",
  },
  button: {
    backgroundColor: "#008080",
    padding: Spacing.medium,
    borderRadius: 8,
    alignItems: "center",
    marginTop: Spacing.medium,
  },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  buttonDisabled: { backgroundColor: Colors.textSecondary },
  sectionLabel: {
    ...Typography.body2,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginTop: Spacing.large,
    marginBottom: Spacing.small,
    fontSize: 14,
  },
  helpText: {
    ...Typography.small,
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: Spacing.small,
    fontStyle: "italic",
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.medium,
  },
});

