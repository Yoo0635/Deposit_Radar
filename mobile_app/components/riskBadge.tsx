// components/riskBadge.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors, Spacing, Typography } from "../constants/styles";

const RiskBadge = ({ level = "GREEN" }: { level: string }) => {
  const getColors = (level: string) => {
    switch (level) {
      case "RED":
        return {
          background: Colors.danger,
          text: Colors.cardBackground,
          icon: "alert-circle",
        };
      case "AMBER":
        return {
          background: Colors.warning,
          text: Colors.textPrimary,
          icon: "warning",
        };
      case "GREEN":
        return {
          background: Colors.success,
          text: Colors.cardBackground,
          icon: "shield-checkmark",
        };
      default:
        return {
          background: Colors.textSecondary,
          text: Colors.cardBackground,
          icon: "help-circle",
        };
    }
  };

  const { background, text, icon } = getColors(level);

  return (
    <View style={[styles.badgeContainer, { backgroundColor: background }]}>
      <Ionicons
        name={icon as any}
        size={Typography.body2.fontSize}
        color={text}
        style={styles.icon}
      />
      <Text style={[styles.badgeText, { color: text }]}>{level}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.tiny,
    paddingHorizontal: Spacing.small,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  icon: {
    marginRight: Spacing.tiny,
  },
  badgeText: {
    ...Typography.body2,
    fontWeight: "bold",
  },
});

export default RiskBadge;
