// constants/Styles.ts
import { StyleSheet } from "react-native";

export const Colors = {
  primary: "#2196F3",
  primaryLight: "#BBDEFB",
  primaryDark: "#1976D2",
  accent: "#FFC107",
  success: "#4CAF50",
  warning: "#FF9800",
  danger: "#F44336",
  background: "#F5F5F5",
  cardBackground: "#FFFFFF",
  textPrimary: "#212121",
  textSecondary: "#757575",
  border: "#E0E0E0",
};

export const Typography = {
  h1: { fontSize: 32, fontWeight: "bold", color: Colors.textPrimary },
  h2: { fontSize: 24, fontWeight: "bold", color: Colors.textPrimary },
  h3: { fontSize: 20, fontWeight: "bold", color: Colors.textPrimary },
  body1: { fontSize: 16, color: Colors.textPrimary },
  body2: { fontSize: 14, color: Colors.textSecondary },
  small: { fontSize: 12, color: Colors.textSecondary },
} as const;

export const Spacing = {
  tiny: 4,
  small: 8,
  medium: 16,
  large: 24,
  xLarge: 32,
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.medium,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: Spacing.medium,
    marginBottom: Spacing.medium,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
