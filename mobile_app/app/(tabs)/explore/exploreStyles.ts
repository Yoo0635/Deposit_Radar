// app/(tabs)/explore/exploreStyles.ts
// 설정 화면 스타일 정의

import { StyleSheet } from "react-native";
import { Colors, Spacing, Typography } from "../../../constants/styles";

export const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.medium,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  icon: {
    marginRight: Spacing.medium,
  },
  itemText: {
    ...Typography.body1,
    color: Colors.textPrimary,
    flex: 1,
  },
});

