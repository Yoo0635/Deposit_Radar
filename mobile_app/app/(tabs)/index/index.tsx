// app/(tabs)/index/index.tsx
// 대시보드 화면 컴포넌트 - 등록된 주택 목록 표시 (닉네임 표시 및 아코디언 상세보기)
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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
  const { properties, updateProperty, deleteProperty } = useProperties();
  const [refreshing, setRefreshing] = useState(false);
  const [editingProperty, setEditingProperty] = useState<number | null>(null);
  const [nicknameInput, setNicknameInput] = useState("");
  const [expandedProperty, setExpandedProperty] = useState<number | null>(null);

  // TODO: 백엔드 API에서 주택 목록 가져오기
  // useEffect(() => {
  //   const loadProperties = async () => {
  //     try {
  //       import { getProperties } from '../../../api/registry';
  //       const token = await getAuthToken();
  //       const data = await getProperties(token);
  //       setProperties(data);
  //     } catch (error) {
  //       console.error('주택 목록 로드 실패:', error);
  //     }
  //   };
  //   loadProperties();
  // }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: 백엔드 API에서 주택 목록 새로고침
    // import { getProperties } from '../../../api/registry';
    // const token = await getAuthToken();
    // const data = await getProperties(token);
    // setProperties(data);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleEditNickname = (property: any) => {
    setEditingProperty(property.id);
    setNicknameInput(property.nickname || property.address);
  };

  const handleSaveNickname = async (propertyId: number) => {
    if (nicknameInput.trim()) {
      // TODO: 백엔드 API로 닉네임 업데이트
      // import { updatePropertyNickname } from '../../../api/registry';
      // const token = await getAuthToken();
      // await updatePropertyNickname(propertyId, {
      //   nickname: nicknameInput.trim(),
      // }, token);

      // 로컬 상태 업데이트
      updateProperty(propertyId, { nickname: nicknameInput.trim() });
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
          onPress: () => {
            deleteProperty(property.id);
            // 확장된 상태면 닫기
            if (expandedProperty === property.id) {
              setExpandedProperty(null);
            }
          },
        },
      ]
    );
  };

  const renderPropertyCard = (property: any) => {
    const isExpanded = expandedProperty === property.id;
    const hasNickname = property.nickname && property.nickname.trim() !== "";

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
                  <Text style={styles.dateValue}>
                      {property.move_in_date || "-"}
                    </Text>
                  </View>
                </View>
              <View style={styles.dateDivider} />
              <View style={styles.dateColumn}>
                <Ionicons name="checkmark-circle" size={20} color="#008080" />
                <View style={styles.dateTextContainer}>
                  <Text style={styles.dateLabel}>확정일자</Text>
                  <Text style={styles.dateValue}>
                      {property.confirmation_date || "-"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView
      style={globalStyles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#008080"]}
        />
      }
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
  );
}
