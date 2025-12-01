// app/(tabs)/index/index.tsx
// 대시보드 화면 컴포넌트 - 등록된 주택 목록 표시 (닉네임 표시 및 아코디언 상세보기)
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React, { useRef, useState, useEffect } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, globalStyles } from "../../../constants/styles";
import { useProperties } from "../../../contexts/PropertyContext";
import { styles } from "./indexStyles";

export default function MainDashboardScreen() {
  const { properties, updateProperty, deleteProperty, loadPropertiesFromAPI } =
    useProperties();
  const [refreshing, setRefreshing] = useState(false);
  const [editingProperty, setEditingProperty] = useState<number | null>(null);
  const [nicknameInput, setNicknameInput] = useState("");
  const [expandedProperty, setExpandedProperty] = useState<number | null>(null);
  const [completingProperty, setCompletingProperty] = useState<number | null>(null);
  const [moveInDateInput, setMoveInDateInput] = useState("");
  const [confirmDateInput, setConfirmDateInput] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);
  const moveInDateInputRef = useRef<TextInput>(null);
  const confirmDateInputRef = useRef<TextInput>(null);

  // 백엔드 API에서 주택 목록 가져오기
  useEffect(() => {
    const loadProperties = async () => {
      try {
        await loadPropertiesFromAPI();
      } catch (error) {
        console.error("주택 목록 로드 실패:", error);
      }
    };
    loadProperties();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // 백엔드 API에서 주택 목록 새로고침
      await loadPropertiesFromAPI();
    } catch (error) {
      console.error("주택 목록 새로고침 실패:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEditNickname = (property: any) => {
    setEditingProperty(property.id);
    setNicknameInput(property.nickname || property.address);
  };

  const handleSaveNickname = async (propertyId: number) => {
    if (nicknameInput.trim()) {
      try {
        // 백엔드 API로 닉네임 업데이트
        const { updatePropertyNickname } = await import(
          "../../../api/registry"
        );
        const response = await updatePropertyNickname(propertyId, {
          nickname: nicknameInput.trim(),
        });

        console.log("닉네임 업데이트 성공:", response);

        // 로컬 상태 업데이트 (백엔드 응답 사용)
        updateProperty(propertyId, {
          nickname: response.nickname || nicknameInput.trim(),
        });
      } catch (error) {
        console.error("닉네임 업데이트 실패:", error);
        Alert.alert("업데이트 실패", "닉네임 업데이트에 실패했습니다.");
      }
    }
    setEditingProperty(null);
    setNicknameInput("");
  };
  const handleToggleExpand = (propertyId: number) => {
    setExpandedProperty(expandedProperty === propertyId ? null : propertyId);
  };

  const handleDeleteProperty = (property: any) => {
    Alert.alert(
      "주택 삭제",
      `"${property.nickname || property.address}" 주택을 삭제하시겠습니까?`,
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              // 백엔드 API로 삭제 요청 (PropertyContext에서 처리)
              await deleteProperty(property.id);
              // 확장된 상태면 닫기
              if (expandedProperty === property.id) {
                setExpandedProperty(null);
              }
            } catch (error: any) {
              console.error("주택 삭제 실패:", error);
              Alert.alert("삭제 실패", error.message || "주택 삭제에 실패했습니다.");
            }
          },
        },
      ]
    );
  };

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

  const handleStartCompleteContract = (property: any) => {
    setCompletingProperty(property.id);
    setMoveInDateInput(property.move_in_date || "");
    setConfirmDateInput(property.confirmation_date || "");
  };

  const handleCompleteContract = async (propertyId: number) => {
    if (!moveInDateInput || !confirmDateInput) {
      Alert.alert("입력 필요", "전입일과 확정일자를 모두 입력해주세요.");
      return;
    }

    try {
      const { updateContract } = await import("../../../api/registry");
      const response = await updateContract(propertyId, {
        move_in_date: moveInDateInput,
        confirmation_date: confirmDateInput,
      });

      console.log("계약 정보 업데이트 성공:", response);

      // 로컬 상태 업데이트
      updateProperty(propertyId, {
        move_in_date: response.move_in_date,
        confirmation_date: response.confirmation_date,
      });

      // 입력 필드 초기화
      setCompletingProperty(null);
      setMoveInDateInput("");
      setConfirmDateInput("");

      Alert.alert("완료", "계약 정보가 업데이트되었습니다.");
    } catch (error: any) {
      console.error("계약 정보 업데이트 실패:", error);
      Alert.alert("업데이트 실패", error.message || "계약 정보 업데이트에 실패했습니다.");
    }
  };

  const renderPropertyCard = (property: any) => {
    const isExpanded = expandedProperty === property.id;
    const hasNickname = property.nickname && property.nickname.trim() !== "";
    
    // 계약 완료 여부 판단 (전입일과 확정일자가 모두 있으면 완료)
    const isContractCompleted = property.move_in_date && property.confirmation_date;
    const initialLtv = property.initial_ltv;
    const initialLtvRisk = property.initial_ltv_risk;

    return (
      <View key={property.id} style={styles.propertyCardWrapper}>
        {/* 첫 번째 카드: 주소 정보 */}
        <View style={styles.addressCard}>
          {editingProperty === property.id ? (
            <View style={styles.nicknameEditContainer}>
              <TextInput
                style={styles.nicknameInput}
                value={nicknameInput}
                onChangeText={setNicknameInput}
                placeholder="닉네임 입력"
                autoFocus
              />
              <View style={styles.editActionButtons}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleSaveNickname(property.id);
                  }}
                  style={styles.saveButton}
                >
                  <Ionicons name="checkmark-circle" size={24} color="#008080" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setEditingProperty(null);
                    setNicknameInput("");
                  }}
                  style={styles.cancelEditButton}
                >
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.addressCardContent}>
              <View style={styles.addressCardHeader}>
                <View style={styles.addressTitleContainer}>
                  {/* 계약 상태 배지 및 LTV */}
                  <View style={styles.statusBadgeRow}>
                    <View style={styles.statusBadgeContainer}>
                      {isContractCompleted ? (
                        <View style={styles.statusBadgeCompleted}>
                          <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                          <Text style={styles.statusBadgeTextCompleted}>계약 완료</Text>
                        </View>
                      ) : (
                        <View style={styles.statusBadgeDraft}>
                          <Ionicons name="time-outline" size={14} color="#FFC107" />
                          <Text style={styles.statusBadgeTextDraft}>계약 전</Text>
                        </View>
                      )}
                    </View>
                    
                    {/* LTV 표시 (있는 경우) */}
                    {initialLtv !== null && initialLtv !== undefined && (
                      <Text style={[
                        styles.ltvText,
                        initialLtvRisk === "RED" && styles.ltvTextRed,
                        initialLtvRisk === "AMBER" && styles.ltvTextAmber,
                        initialLtvRisk === "GREEN" && styles.ltvTextGreen,
                      ]}>
                        LTV: {initialLtv.toFixed(1)}%
                      </Text>
                    )}
                  </View>
                  
                  <Text
                    style={
                      hasNickname
                        ? styles.addressCardTitle
                        : styles.addressCardTitlePlaceholder
                    }
                  >
                    {hasNickname ? property.nickname : "닉네임이 없습니다"}
                  </Text>
                </View>
                <View style={styles.headerButtons}>
                  <TouchableOpacity
                    onPress={() => handleEditNickname(property)}
                    style={styles.editButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="pencil" size={16} color="#008080" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteProperty(property)}
                    style={styles.deleteButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.addressDetailRow}>
                <Ionicons name="location" size={20} color="#008080" />
                <View style={styles.addressDetailTextContainer}>
                  <Text style={styles.addressDetailLabel}>상세주소</Text>
                  <Text style={styles.addressDetailValue}>
                    {property.address || "-"}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                onPress={() => handleToggleExpand(property.id)}
                style={styles.moreButton}
              >
                <Text style={styles.moreButtonText}>
                  {isExpanded ? "접기" : "더보기"}
                </Text>
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#008080"
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 두 번째 카드: 보증금 및 날짜 정보 (더보기 클릭 시 표시) */}
        {isExpanded && (
          <View style={styles.infoCard}>
            <View style={styles.depositRow}>
              <Ionicons name="cash" size={24} color="#008080" />
              <View style={styles.depositTextContainer}>
                <Text style={styles.depositLabel}>보증금</Text>
                <Text style={styles.depositValue}>
                  {property.deposit?.toLocaleString() || "-"}원
                </Text>
              </View>
            </View>
            <View style={styles.sectionDivider} />
            <View style={styles.dateRow}>
              <View style={styles.dateColumn}>
                <Ionicons name="calendar" size={20} color="#008080" />
                <View style={styles.dateTextContainer}>
                  <Text style={styles.dateLabel}>전입일</Text>
                  <Text style={[
                    styles.dateValue,
                    !property.move_in_date && styles.dateValueMissing
                  ]}>
                    {property.move_in_date || "입력 필요"}
                  </Text>
                </View>
              </View>
              <View style={styles.dateDivider} />
              <View style={styles.dateColumn}>
                <Ionicons name="checkmark-circle" size={20} color="#008080" />
                <View style={styles.dateTextContainer}>
                  <Text style={styles.dateLabel}>확정일자</Text>
                  <Text style={[
                    styles.dateValue,
                    !property.confirmation_date && styles.dateValueMissing
                  ]}>
                    {property.confirmation_date || "입력 필요"}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* 계약 전일 때 완성하기 버튼 */}
            {!isContractCompleted && (
              <>
                <View style={styles.sectionDivider} />
                {completingProperty === property.id ? (
                  <View style={styles.completeFormContainer}>
                    <Text style={styles.completeFormLabel}>전입일</Text>
                    <TextInput
                      ref={moveInDateInputRef}
                      style={styles.completeFormInput}
                      placeholder="예: 2025-01-15"
                      placeholderTextColor={Colors.textSecondary}
                      value={moveInDateInput}
                      onChangeText={(text) => setMoveInDateInput(formatDateInput(text))}
                      keyboardType="numeric"
                      maxLength={10}
                      onFocus={() => {
                        // 키보드가 올라올 때 약간의 지연 후 스크롤
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 300);
                      }}
                    />
                    <Text style={styles.completeFormLabel}>확정일자</Text>
                    <TextInput
                      ref={confirmDateInputRef}
                      style={styles.completeFormInput}
                      placeholder="예: 2025-01-15"
                      placeholderTextColor={Colors.textSecondary}
                      value={confirmDateInput}
                      onChangeText={(text) => setConfirmDateInput(formatDateInput(text))}
                      keyboardType="numeric"
                      maxLength={10}
                      onFocus={() => {
                        // 키보드가 올라올 때 약간의 지연 후 스크롤
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 300);
                      }}
                    />
                    <View style={styles.completeFormButtons}>
                      <TouchableOpacity
                        style={[styles.completeFormButton, styles.completeFormButtonCancel]}
                        onPress={() => {
                          setCompletingProperty(null);
                          setMoveInDateInput("");
                          setConfirmDateInput("");
                        }}
                      >
                        <Text style={styles.completeFormButtonTextCancel}>취소</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.completeFormButton, styles.completeFormButtonSave]}
                        onPress={() => handleCompleteContract(property.id)}
                      >
                        <Text style={styles.completeFormButtonTextSave}>저장</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => handleStartCompleteContract(property)}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text style={styles.completeButtonText}>
                      계약 정보 완성하기
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        ref={scrollViewRef}
        style={globalStyles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#008080"]}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>나의 등록 주택</Text>
          <Link href="/modal" asChild>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add" size={20} color="#008080" />
              <Text style={styles.addButtonText}>주택 추가</Text>
            </TouchableOpacity>
          </Link>
        </View>
        <Text style={styles.subHeaderText}>
          등록된 주택 목록입니다. 푸시 알림을 통해 위험도 분석 PDF를 받을 수
          있습니다.
        </Text>
      </View>

      {/* 2. 등록된 주택이 없을 때(properties.length === 0) 빈 상태 UI 표시 */}
      {properties.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons
              name="home-outline"
              size={80}
              color={Colors.textSecondary}
            />
          </View>
          <Text style={styles.emptyStateText}>등록된 주택이 없습니다.</Text>
          <Text style={styles.emptyStateSubText}>
            &apos;주택 추가&apos; 버튼을 눌러 첫 번째 주택을 등록하세요.
          </Text>
        </View>
      ) : (
        properties.map(renderPropertyCard)
      )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
