// app/(tabs)/_layout.tsx
// 탭 네비게이션 레이아웃 - 하단 탭바 설정 (대시보드, 설정)
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

// 하단 탭바의 아이콘을 설정하는 헬퍼 컴포넌트
function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
}) {
  return <Ionicons size={24} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#008080",
        tabBarInactiveTintColor: "#757575",
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 0.5,
          borderTopColor: "#e0e0e0",
          height: Platform.OS === "ios" ? 70 : 65,
          paddingBottom: Platform.OS === "ios" ? 12 : 10,
          paddingTop: 8,
        },
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index/index"
        options={{
          title: "보증금 레이더",
          headerTitle: "보증금 레이더",
          headerShown: true,
          tabBarLabel: "대시보드",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "home" : "home-outline"}
              color={color}
            />
          ),
          headerStyle: {
            backgroundColor: "#ffffff",
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0.5,
            borderBottomColor: "#e0e0e0",
            height: Platform.OS === "ios" ? 92 : 52,
          },
          headerTitleStyle: {
            fontSize: 22,
            fontWeight: "700",
            marginTop: Platform.OS === "android" ? -20 : -28,
            lineHeight: 28,
            includeFontPadding: false,
          },
          headerTitleAlign: "center",
        }}
      />
      <Tabs.Screen
        name="analysis/index"
        options={{
          headerTitle: "분석",
          headerShown: true,
          tabBarLabel: "분석",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "analytics" : "analytics-outline"}
              color={color}
            />
          ),
          headerStyle: {
            backgroundColor: "#ffffff",
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0.5,
            borderBottomColor: "#e0e0e0",
            height: Platform.OS === "ios" ? 92 : 52,
          },
          headerTitleStyle: {
            fontSize: 22,
            fontWeight: "700",
            marginTop: Platform.OS === "android" ? -20 : -28,
            lineHeight: 28,
            includeFontPadding: false,
          },
          headerTitleAlign: "center",
        }}
      />
      <Tabs.Screen
        name="explore/index"
        options={{
          headerTitle: "설정",
          headerShown: true,
          tabBarLabel: "설정",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "settings" : "settings-outline"}
              color={color}
            />
          ),
          headerStyle: {
            backgroundColor: "#ffffff",
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0.5,
            borderBottomColor: "#e0e0e0",
            height: Platform.OS === "ios" ? 92 : 52,
          },
          headerTitleStyle: {
            fontSize: 22,
            fontWeight: "700",
            marginTop: Platform.OS === "android" ? -20 : -28,
            lineHeight: 28,
            includeFontPadding: false,
          },
          headerTitleAlign: "center",
        }}
      />
    </Tabs>
  );
}
