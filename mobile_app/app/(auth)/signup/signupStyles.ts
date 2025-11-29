// app/(auth)/signup/signupStyles.ts
// 회원가입 화면 스타일 정의

import { StyleSheet } from "react-native";
import { Colors, Spacing, Typography } from "../../../constants/styles";

export const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xLarge,
    paddingVertical: Spacing.xLarge,
  },
  header: {
    alignItems: "center",
    paddingVertical: Spacing.xLarge,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: Spacing.large,
    shadowColor: "#008080",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  mainTitle: {
    ...Typography.h1,
    fontSize: 32,
    color: Colors.textPrimary,
    fontWeight: "800",
    lineHeight: 44,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subTitle: {
    ...Typography.body1,
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: Spacing.small,
    textAlign: "center",
  },
  form: {
    paddingVertical: Spacing.medium,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.small,
  },
  inputIcon: {
    marginRight: Spacing.medium,
  },
  textInput: {
    ...Typography.body1,
    flex: 1,
    fontSize: 18,
    color: Colors.textPrimary,
    paddingVertical: Spacing.medium,
  },
  passwordToggle: {
    padding: Spacing.small,
  },
  errorText: {
    ...Typography.small,
    color: Colors.danger,
    marginTop: Spacing.tiny,
    marginBottom: Spacing.small,
    marginLeft: Spacing.medium + 24,
  },
  agreementSection: {
    marginTop: Spacing.medium,
    marginBottom: Spacing.large,
  },
  agreementCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: Spacing.medium,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  agreementItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.small,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.medium,
  },
  checkboxSmall: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginLeft: Spacing.small,
  },
  checkboxChecked: {
    backgroundColor: "#008080",
    borderColor: "#008080",
  },
  agreementAllText: {
    ...Typography.h3,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  agreementTextContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  agreementText: {
    ...Typography.body2,
    color: Colors.textPrimary,
    flex: 1,
  },
  agreementLink: {
    ...Typography.body2,
    color: "#008080",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.small,
  },
  footer: {
    paddingTop: Spacing.medium,
    paddingBottom: Spacing.xLarge,
  },
  signUpButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#008080",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  signUpButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.large,
  },
  signUpButtonDisabled: {
    backgroundColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.large,
  },
  signUpButtonText: {
    ...Typography.body1,
    fontSize: 16,
    color: "white",
    fontWeight: "700",
  },
  signUpButtonTextDisabled: {
    ...Typography.body1,
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: "700",
  },
  signUpButtonIcon: {
    marginLeft: Spacing.small,
  },
  linkButton: {
    padding: Spacing.medium,
  },
  linkText: {
    ...Typography.body1,
    color: Colors.textSecondary,
    fontWeight: "600",
    textAlign: "center",
    marginTop: Spacing.medium,
  },
});

