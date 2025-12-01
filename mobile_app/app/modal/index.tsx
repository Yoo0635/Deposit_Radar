// app/modal/index.tsx
// 주택 등록 모달 컴포넌트 - 새 주택 정보 입력 및 등록 처리
import { useNavigation, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, globalStyles } from "../../constants/styles";
import { useProperties } from "../../contexts/PropertyContext";
import { styles } from "./modalStyles";

const formatDateInput = (text: string): string => {
  const numbers = text.replace(/[^\d]/g, "");
  const limited = numbers.slice(0, 8);

  if (limited.length <= 4) {
    return limited;
  } else if (limited.length <= 6) {
    return `${limited.slice(0, 4)}-${limited.slice(4)}`;
  } else {
    return `${limited.slice(0, 4)}-${limited.slice(4, 6)}-${limited.slice(6)}`;
  }
};

export default function AddPropertyModal() {
  const router = useRouter();
  const navigation = useNavigation();
  const { addProperty } = useProperties();
  const scrollViewRef = useRef<ScrollView>(null);
  const confirmDateInputRef = useRef<TextInput>(null);
  const [address, setAddress] = useState("");
  const [deposit, setDeposit] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [confirmDate, setConfirmDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: "새 주택 등록",
      headerTitle: "새 주택 등록",
    });
  }, [navigation]);

  const handleRegisterProperty = async () => {
    // 보증금은 필수, 전입일/확정일자는 선택
    if (!address || !deposit) {
      Alert.alert("필수 정보 누락", "주소와 보증금은 필수 입력 항목입니다.");
      return;
    }
    setIsLoading(true);

    let contractId: number | null = null;
    let registeredProperty: any = null;

    try {
      // 백엔드 API로 주택 등록
      const { registerProperty } = await import("../../api/registry");

      const depositValue = parseInt(deposit.replace(/,/g, ""), 10);
      const response = await registerProperty({
        nickname: null, // 주택 등록 시에는 닉네임 없음 (나중에 대시보드에서 설정)
        address: address,
        deposit: depositValue,
        move_in_date: moveInDate || undefined, // 선택 필드
        confirmation_date: confirmDate || undefined, // 선택 필드
      });

      console.log("✅ 주택 등록 성공:", response);

      contractId = response.id;

      // 백엔드에서 받은 응답을 Context에 추가
      registeredProperty = {
        id: response.id, // 백엔드에서 받은 실제 ID
        nickname: response.nickname || "", // 주택 등록 시에는 닉네임 없음
        address: response.address,
        deposit: response.deposit,
        move_in_date: response.move_in_date || null,
        confirmation_date: response.confirmation_date || null,
        initial_ltv: response.initial_ltv ?? null,
        initial_ltv_risk: response.initial_ltv_risk ?? null,
        market_price: response.market_price ?? null,
      };

      addProperty(registeredProperty);
      console.log("📝 등록된 주택 정보:", registeredProperty);
    } catch (error: any) {
      console.error("❌ 주택 등록 실패:", error);

      // 네트워크 오류인 경우에도 업로드 화면으로 이동할 수 있도록 처리
      const isNetworkError =
        error.message?.includes("Network request failed") ||
        error.message?.includes("network") ||
        error.message?.includes("fetch");

      if (isNetworkError) {
        // 네트워크 오류 시 임시 ID 생성 (음수로 구분)
        const tempId = -Date.now(); // 임시 ID (음수)
        contractId = tempId;

        // 임시 주택 정보 생성 (로컬에만 저장)
        registeredProperty = {
          id: tempId,
          nickname: "",
          address: address,
          deposit: parseInt(deposit.replace(/,/g, ""), 10),
          move_in_date: moveInDate || null,
          confirmation_date: confirmDate || null,
          initial_ltv: null,
          initial_ltv_risk: null,
          market_price: null,
        };

        addProperty(registeredProperty);

        Alert.alert(
          "네트워크 오류",
          "서버에 연결할 수 없습니다.\n\n등기부등본을 먼저 업로드하시고, 나중에 서버 연결이 되면 자동으로 등록됩니다.",
          [
            {
              text: "계속하기",
              onPress: () => {
                // 계속 진행
              },
            },
          ]
        );
      } else {
        // 다른 오류인 경우
        setIsLoading(false);
        const errorMessage =
          error.message || "주택 등록 중 오류가 발생했습니다.";
        Alert.alert("등록 실패", errorMessage);
        return; // 업로드 화면으로 이동하지 않음
      }
    }

    // 성공 또는 네트워크 오류 시에도 업로드 화면으로 이동
    if (contractId !== null) {
      setIsLoading(false); // 로딩 상태 해제

      console.log("📤 등기부등본 업로드 화면으로 이동:", contractId);

      router.push({
        pathname: "/upload",
        params: { contractId: contractId.toString() },
      } as any);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 120 : 20}
    >
      <ScrollView
        ref={scrollViewRef}
        style={globalStyles.container}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 200 }}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.subText}>
          관리할 주택의 정보를 입력해주세요. 정확한 정보 입력은 보증금 보호의
          첫걸음입니다.
        </Text>

        <View style={globalStyles.card}>
        <Text style={styles.inputLabel}>주소 *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="정확한 주소 (예: 서울시 강남구 테헤란로 123-45)"
          placeholderTextColor={Colors.textSecondary}
          value={address}
          onChangeText={setAddress}
        />

        <Text style={styles.inputLabel}>보증금 (원) *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="예: 50000000 (숫자만 입력)"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
          value={deposit}
          onChangeText={setDeposit}
        />
        <Text style={styles.helpText}>
          💡 계약 전에도 알 수 있는 정보입니다
        </Text>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>계약 후 정보 (선택 입력)</Text>
        <Text style={styles.helpText}>
          계약 체결 후 입력하시면 모니터링을 시작할 수 있습니다
        </Text>

        <Text style={styles.inputLabel}>전입일 (선택)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="예: 20250115 또는 2025-01-15 (나중에 입력 가능)"
          placeholderTextColor={Colors.textSecondary}
          value={moveInDate}
          onChangeText={(text) => setMoveInDate(formatDateInput(text))}
          keyboardType="numeric"
          maxLength={10}
        />

        <Text style={styles.inputLabel}>확정일자 (선택)</Text>
        <TextInput
          ref={confirmDateInputRef}
          style={styles.textInput}
          placeholder="예: 20250115 또는 2025-01-15 (나중에 입력 가능)"
          placeholderTextColor={Colors.textSecondary}
          value={confirmDate}
          onChangeText={(text) => setConfirmDate(formatDateInput(text))}
          keyboardType="numeric"
          maxLength={10}
          onFocus={() => {
            // 확정일자 입력 필드가 포커스될 때 하단으로 스크롤
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 300);
          }}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleRegisterProperty}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "등록 중..." : "다음 (등본 업로드)"}
        </Text>
      </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
