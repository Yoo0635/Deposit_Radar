// app/(auth)/login/index.tsx
// 로그인 화면 컴포넌트 - 사용자 인증 및 로그인 처리
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  KeyboardTypeOptions,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../../constants/styles";
import { useAuth } from "../../../context/AuthContext";
import { useNotification } from "../../../contexts/NotificationContext";
import { styles } from "./loginStyles";

// --- [타입 정의] 커스텀 입력창 ---
type CustomTextInputProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  toggleSecure?: () => void;
  onFocus?: () => void;
};

// --- [컴포넌트] 커스텀 입력창 (포커스 효과 + 밑줄) ---
const CustomTextInput = ({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  toggleSecure,
  onFocus,
}: CustomTextInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const activeColor = "#008080";
  const inactiveColor = Colors.textSecondary + "80";

  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) {
      onFocus();
    }
  };

  return (
    <View
      style={[
        styles.inputGroup,
        { borderBottomColor: isFocused ? activeColor : Colors.border },
      ]}
    >
      <Ionicons
        name={icon}
        size={22}
        color={isFocused ? activeColor : inactiveColor}
        style={styles.inputIcon}
      />
      <TextInput
        style={styles.textInput}
        placeholder={placeholder}
        placeholderTextColor={inactiveColor}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        onFocus={handleFocus}
        onBlur={() => setIsFocused(false)}
        autoCapitalize="none"
      />
      {toggleSecure && (
        <TouchableOpacity onPress={toggleSecure} style={styles.passwordToggle}>
          <Ionicons
            name={secureTextEntry ? "eye-off" : "eye"}
            size={22}
            color={activeColor}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

// --- 메인 로그인 화면 ---
export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { pendingNotification } = useNotification();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberLogin, setRememberLogin] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const scrollViewRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = () => {
    if (id && password) {
      // 자동 로그인 체크박스 상태와 함께 로그인
      login(rememberLogin);
      // 알림 데이터가 있으면 로그인 후 분석 화면으로 이동
      if (pendingNotification) {
        setTimeout(() => {
          router.push("/(tabs)/analysis" as any);
        }, 100);
      }
    } else {
      Alert.alert("로그인 오류", "아이디와 비밀번호를 입력해주세요.");
    }
  };

  const tealColor = "#008080";
  const tealDark = "#006666";

  return (
    <LinearGradient
      colors={["#B2E5E5", "#D0F0F0", "#E8F7F7", "#F5FCFC", "#FFFFFF"]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
          >
            <Animated.View
              style={[
                styles.header,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={styles.logoContainer}>
                <Image
                  source={require("../../../assets/logo.png")}
                  style={styles.logoImage}
                  contentFit="contain"
                  transition={200}
                />
              </View>

              <Text style={styles.mainTitle}>보증금 레이더</Text>
              <Text style={styles.subTitle}>
                내 집과 계약을 안전하게 관리하세요
              </Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.form,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              <CustomTextInput
                icon="person-outline"
                placeholder="아이디"
                value={id}
                onChangeText={setId}
                keyboardType="default"
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 100);
                }}
              />

              <CustomTextInput
                icon="lock-closed-outline"
                placeholder="비밀번호"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                toggleSecure={() => setShowPassword(!showPassword)}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 100);
                }}
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.footer,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              {/* 자동 로그인 체크박스 */}
              <TouchableOpacity
                style={styles.autoLoginContainer}
                onPress={() => setRememberLogin(!rememberLogin)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={rememberLogin ? "checkbox" : "checkbox-outline"}
                  size={24}
                  color={rememberLogin ? tealColor : Colors.textSecondary}
                />
                <Text style={styles.autoLoginText}>자동 로그인</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[tealColor, tealDark]}
                  style={styles.loginButtonGradient}
                >
                  <Text style={styles.loginButtonText}>로그인</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="white"
                    style={styles.loginButtonIcon}
                  />
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.footerLinks}>
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/signup")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkText}>회원가입</Text>
                </TouchableOpacity>
                <Text style={styles.linkSeparator}>|</Text>
                <TouchableOpacity
                  onPress={() => Alert.alert("준비 중", "비밀번호 찾기")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.linkText}>비밀번호 찾기</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
