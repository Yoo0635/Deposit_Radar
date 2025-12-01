// app/(auth)/login/loginStyles.ts
// 로그인 화면 스타일 정의

import { Platform, StyleSheet } from "react-native";
import { Colors, Spacing, Typography } from "../../../constants/styles";

export const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingHorizontal: Spacing.xLarge,
    paddingTop: Platform.OS === "android" ? Spacing.xLarge : Spacing.large,
    paddingBottom: Spacing.xLarge * 2,
  },
  header: {
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Spacing.medium,
    paddingBottom: 0,
    minHeight: 80,
  },
  logoContainer: {
    width: 180,
    height: 180,
    marginBottom: -Spacing.medium,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  logoImage: {
    width: 180,
    height: 180,
    backgroundColor: "transparent",
  },
  mainTitle: {
    ...Typography.h1,
    fontSize: 36,
    color: Colors.textPrimary,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: -Spacing.medium,
  },
  subTitle: {
    ...Typography.body1,
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: Spacing.tiny,
    textAlign: "center",
    lineHeight: 24,
  },
  form: {
    justifyContent: "center",
    paddingVertical: 0,
    marginTop: Spacing.medium,
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
  footer: {
    justifyContent: "flex-start",
    paddingTop: Spacing.small,
    paddingBottom: Spacing.medium,
  },
  loginButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#008080",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonGradient: {
    paddingVertical: Spacing.medium + 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    ...Typography.h3,
    fontSize: 18,
    color: "white",
    fontWeight: "700",
  },
  loginButtonIcon: {
    marginLeft: Spacing.small,
  },
  autoLoginContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.medium,
    paddingVertical: Spacing.small,
  },
  autoLoginText: {
    ...Typography.body1,
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: Spacing.small,
    fontWeight: "500",
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.large,
  },
  linkText: {
    ...Typography.body1,
    color: Colors.textSecondary,
    fontWeight: "bold",
    paddingHorizontal: Spacing.medium,
  },
  linkSeparator: {
    ...Typography.body1,
    color: Colors.border,
  },
});
