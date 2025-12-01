// app/(auth)/signup/index.tsx
// 회원가입 화면 컴포넌트 - 신규 사용자 등록 및 약관 동의 처리
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
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
import { styles } from "./signupStyles";

type CustomTextInputProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
};

const CustomTextInput = ({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType,
  toggleSecure,
  error,
}: CustomTextInputProps & {
  keyboardType?: "default" | "email-address";
  toggleSecure?: () => void;
  error?: boolean;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const tealColor = "#008080";
  const activeColor = error ? Colors.danger : tealColor;
  const inactiveColor = Colors.textSecondary + "80";

  return (
    <View>
      <View
        style={[
          styles.inputGroup,
          {
            borderBottomColor: isFocused
              ? activeColor
              : error
              ? Colors.danger
              : Colors.border,
            borderBottomWidth: error ? 2 : 2,
          },
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
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize="none"
        />
        {toggleSecure && (
          <TouchableOpacity
            onPress={toggleSecure}
            style={styles.passwordToggle}
          >
            <Ionicons
              name={secureTextEntry ? "eye-off" : "eye"}
              size={22}
              color={activeColor}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={styles.errorText}>
          {placeholder.includes("비밀번호 확인")
            ? "비밀번호가 일치하지 않습니다"
            : placeholder.includes("아이디")
            ? "아이디는 4자 이상의 영문/숫자만 사용 가능합니다"
            : placeholder.includes("이름")
            ? "이름을 2자 이상 입력해주세요"
            : placeholder.includes("비밀번호")
            ? "비밀번호는 8자 이상이어야 합니다"
            : "올바른 형식으로 입력해주세요"}
        </Text>
      )}
    </View>
  );
};

export default function SignUpScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreePersonalInfo, setAgreePersonalInfo] = useState(false);
  const [agreeApiQuery, setAgreeApiQuery] = useState(false);
  const [agreeAll, setAgreeAll] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  const tealColor = "#008080";
  const tealDark = "#006666";

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

  const handleAgreeAll = (checked: boolean) => {
    setAgreeAll(checked);
    setAgreePersonalInfo(checked);
    setAgreeApiQuery(checked);
  };

  React.useEffect(() => {
    setAgreeAll(agreePersonalInfo && agreeApiQuery);
  }, [agreePersonalInfo, agreeApiQuery]);

  const isValidUserId = (userId: string) => {
    // 아이디는 4자 이상, 영문/숫자만 허용
    return /^[a-zA-Z0-9]{4,}$/.test(userId);
  };

  const isValidPassword = (password: string) => {
    return password.length >= 8;
  };

  const isPasswordMatch =
    password === confirmPassword && confirmPassword !== "";

  const nameError = name !== "" && name.trim().length < 2;
  const userIdError = userId !== "" && !isValidUserId(userId);
  const passwordError = password !== "" && !isValidPassword(password);
  const confirmPasswordError = confirmPassword !== "" && !isPasswordMatch;

  const canSignUp =
    name.trim().length >= 2 &&
    isValidUserId(userId) &&
    isValidPassword(password) &&
    isPasswordMatch &&
    agreePersonalInfo &&
    agreeApiQuery;

  const handleSignUp = () => {
    if (!canSignUp) {
      if (name.trim().length < 2) {
        Alert.alert("오류", "이름을 2자 이상 입력해주세요.");
      } else if (!isValidUserId(userId)) {
        Alert.alert("오류", "아이디는 4자 이상의 영문/숫자만 사용 가능합니다.");
      } else if (!isValidPassword(password)) {
        Alert.alert("오류", "비밀번호는 8자 이상이어야 합니다.");
      } else if (!isPasswordMatch) {
        Alert.alert("오류", "비밀번호가 일치하지 않습니다.");
      } else if (!agreePersonalInfo || !agreeApiQuery) {
        Alert.alert("동의 필요", "모든 약관에 동의해주세요.");
      }
      return;
    }

    Alert.alert("회원가입 성공", "로그인 되었습니다.", [
      { text: "확인", onPress: () => login() },
    ]);
  };

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
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
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
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={[tealColor, tealDark]}
                  style={styles.iconGradient}
                >
                  <Ionicons name="person-add" size={50} color="white" />
                </LinearGradient>
              </View>
              <Text style={styles.mainTitle}>
                처음이시군요!{"\n"}환영합니다.
              </Text>
              <Text style={styles.subTitle}>
                등기부등본을 안전하게 관리하세요
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
                placeholder="이름"
                value={name}
                onChangeText={setName}
                error={nameError}
              />
              <CustomTextInput
                icon="at-outline"
                placeholder="아이디 (4자 이상, 영문/숫자)"
                value={userId}
                onChangeText={setUserId}
                keyboardType="default"
                error={userIdError}
              />
              <CustomTextInput
                icon="lock-closed-outline"
                placeholder="비밀번호 (8자 이상)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                toggleSecure={() => setShowPassword(!showPassword)}
                error={passwordError}
              />
              <CustomTextInput
                icon="lock-closed-outline"
                placeholder="비밀번호 확인"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                toggleSecure={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                error={confirmPasswordError}
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.agreementSection,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              <View style={styles.agreementCard}>
                <TouchableOpacity
                  style={styles.agreementItem}
                  onPress={() => handleAgreeAll(!agreeAll)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkbox,
                      agreeAll && styles.checkboxChecked,
                    ]}
                  >
                    {agreeAll && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </View>
                  <Text style={styles.agreementAllText}>전체 동의합니다</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.agreementItem}
                  onPress={() => setAgreePersonalInfo(!agreePersonalInfo)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkbox,
                      styles.checkboxSmall,
                      agreePersonalInfo && styles.checkboxChecked,
                    ]}
                  >
                    {agreePersonalInfo && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                  <View style={styles.agreementTextContainer}>
                    <Text style={styles.agreementText}>
                      [필수] 개인정보 수집 및 이용 동의
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert(
                          "개인정보 수집 및 이용 동의",
                          "보증금 레이더 서비스 제공을 위해 다음과 같이 개인정보를 수집 및 이용합니다.\n\n1. 수집 항목: 이메일, 비밀번호\n2. 이용 목적: 서비스 제공, 등기부등본 관리\n3. 보유 기간: 회원 탈퇴 시까지\n\n자세한 내용은 개인정보 처리방침을 확인해주세요."
                        )
                      }
                    >
                      <Text style={styles.agreementLink}>보기</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.agreementItem}
                  onPress={() => setAgreeApiQuery(!agreeApiQuery)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkbox,
                      styles.checkboxSmall,
                      agreeApiQuery && styles.checkboxChecked,
                    ]}
                  >
                    {agreeApiQuery && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                  <View style={styles.agreementTextContainer}>
                    <Text style={styles.agreementText}>
                      [필수] 변동 시 API 조회 동의
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert(
                          "변동 시 API 조회 동의",
                          "등기부등본 변동 감지를 위해 정기적으로 API를 조회하는 것에 동의합니다.\n\n- 등기부등본 변동 사항을 실시간으로 감지하기 위해 주기적으로 조회합니다.\n- 변동 사항이 감지되면 푸시 알림으로 알려드립니다.\n- 개인정보는 안전하게 보호되며, 조회 목적으로만 사용됩니다."
                        )
                      }
                    >
                      <Text style={styles.agreementLink}>보기</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.footer,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.signUpButton}
                onPress={handleSignUp}
                disabled={!canSignUp}
                activeOpacity={0.8}
              >
                {canSignUp ? (
                  <LinearGradient
                    colors={[tealColor, tealDark]}
                    style={styles.signUpButtonGradient}
                  >
                    <Text style={styles.signUpButtonText}>
                      동의하고 가입하기
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color="white"
                      style={styles.signUpButtonIcon}
                    />
                  </LinearGradient>
                ) : (
                  <View style={styles.signUpButtonDisabled}>
                    <Text style={styles.signUpButtonTextDisabled}>
                      동의하고 가입하기
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.replace("/(auth)/login")}
                style={styles.linkButton}
                activeOpacity={0.7}
              >
                <Text style={styles.linkText}>이미 계정이 있으신가요?</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

