// app/modal/index.tsx
// 주택 등록 모달 컴포넌트 - 새 주택 정보 입력 및 등록 처리
import { useNavigation, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
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
    if (!address || !deposit || !moveInDate || !confirmDate) {
      Alert.alert("필수 정보 누락", "모든 필드를 입력해주세요.");
      return;
    }
    setIsLoading(true);

    try {
      // 백엔드 API로 주택 등록 (닉네임은 나중에 대시보드에서 설정)
      // TODO: 실제 백엔드 API 호출 구현
      // import { registerProperty } from '../../api/registry';
      // const token = await getAuthToken(); // 인증 토큰 가져오기
      // const response = await registerProperty({
      //   nickname: "", // 주택 등록 시에는 닉네임 없음 (나중에 대시보드에서 설정)
      //   address: address,
      //   deposit: parseInt(deposit.replace(/,/g, ""), 10),
      //   move_in_date: moveInDate,
      //   confirmation_date: confirmDate,
      // }, token);

      // 주택 정보를 Context에 추가
      // TODO: 백엔드에서 받은 응답을 그대로 사용
      const newProperty = {
        id: Date.now(), // 임시 ID, 백엔드에서 받은 id로 교체
        nickname: "", // 주택 등록 시에는 닉네임 없음 (나중에 대시보드에서 설정)
        address: address,
        deposit: parseInt(deposit.replace(/,/g, ""), 10),
        move_in_date: moveInDate,
        confirmation_date: confirmDate,
      };

      addProperty(newProperty);

      console.log("Registering property:", newProperty);

      // 주택 등록 완료 후 등기부 업로드 화면으로 이동
      // 모달을 닫고 업로드 화면으로 이동
      router.back(); // 모달 닫기
      // Promise를 사용하여 모달이 완전히 닫힌 후 이동
      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push("/upload" as any);
    } catch {
      Alert.alert("등록 실패", "주택 등록 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={globalStyles.container}>
      <Text style={styles.subText}>
        관리할 주택의 정보를 입력해주세요. 정확한 정보 입력은 보증금 보호의
        첫걸음입니다.
      </Text>

      <View style={globalStyles.card}>
        <Text style={styles.inputLabel}>주소</Text>
        <TextInput
          style={styles.textInput}
          placeholder="정확한 주소 (예: 서울시 강남구 테헤란로 123-45)"
          placeholderTextColor={Colors.textSecondary}
          value={address}
          onChangeText={setAddress}
        />

        <Text style={styles.inputLabel}>보증금 (원)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="예: 50000000 (숫자만 입력)"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
          value={deposit}
          onChangeText={setDeposit}
        />

        <Text style={styles.inputLabel}>전입일</Text>
        <TextInput
          style={styles.textInput}
          placeholder="예: 20250115 또는 2025-01-15"
          placeholderTextColor={Colors.textSecondary}
          value={moveInDate}
          onChangeText={(text) => setMoveInDate(formatDateInput(text))}
          keyboardType="numeric"
          maxLength={10}
        />

        <Text style={styles.inputLabel}>확정일자</Text>
        <TextInput
          style={styles.textInput}
          placeholder="예: 20250115 또는 2025-01-15"
          placeholderTextColor={Colors.textSecondary}
          value={confirmDate}
          onChangeText={(text) => setConfirmDate(formatDateInput(text))}
          keyboardType="numeric"
          maxLength={10}
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
  );
}
