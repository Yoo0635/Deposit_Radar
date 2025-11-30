// app/(tabs)/explore/index.tsx
// 설정 화면 컴포넌트 - 앱 설정 및 로그아웃 기능
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import {
  Colors,
  globalStyles,
} from "../../../constants/styles";
import { useAuth } from "../../../context/AuthContext";
import { styles } from "./exploreStyles";

const SettingsItem = ({
  icon,
  name,
  onPress,
  color = "#008080", // 임시 색상 변경: teal
}: {
  icon: any;
  name: string;
  onPress?: () => void;
  color?: string;
}) => (
  <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
    <Ionicons name={icon} size={24} color={color} style={styles.icon} />
      <Text
        style={[
          styles.itemText,
          { color: color === "#008080" ? Colors.textPrimary : color },
        ]}
      >
        {name}
      </Text>
    <Ionicons
      name="chevron-forward-outline"
      size={20}
      color={Colors.textSecondary}
    />
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const { logout } = useAuth();

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.card}>
        <SettingsItem
          icon="notifications-outline"
          name="알림 설정"
          onPress={() => console.log("알림 설정")}
        />
        <SettingsItem
          icon="shield-checkmark-outline"
          name="개인정보 처리방침"
          onPress={() => console.log("개인정보")}
        />
        <SettingsItem
          icon="document-text-outline"
          name="서비스 이용약관"
          onPress={() => console.log("이용약관")}
        />
        <SettingsItem
          icon="information-circle-outline"
          name="앱 버전 (1.0.0)"
        />
      </View>

      <View style={globalStyles.card}>
        <SettingsItem
          icon="log-out-outline"
          name="로그아웃"
          onPress={logout}
          color={Colors.danger}
        />
      </View>
    </View>
  );
}

