// app/(tabs)/index/index.tsx
// 대시보드 화면 컴포넌트 - 등록된 주택 목록 표시 (닉네임 표시 및 아코디언 상세보기)
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import React, { useState } from "react";
import {
  Animated,
  LayoutAnimation,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { Colors, globalStyles } from "../../../constants/styles";
import { useProperties } from "../../../contexts/PropertyContext";
import { styles } from "./indexStyles";

// Android에서 LayoutAnimation 활성화
if (UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function MainDashboardScreen() {
  const { properties, updateProperty } = useProperties();
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

  const handleSaveNickname = (propertyId: number) => {
    if (nicknameInput.trim()) {
      updateProperty(propertyId, { nickname: nicknameInput.trim() });
    }
    setEditingProperty(null);
    setNicknameInput("");
  };

  const handleToggleExpand = (propertyId: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedProperty(expandedProperty === propertyId ? null : propertyId);
  };

  const renderPropertyCard = (property: any) => {
    const isExpanded = expandedProperty === property.id;

    return (
      <View key={property.id} style={styles.propertyCardWrapper}>
        <TouchableOpacity
          style={styles.propertyCard}
          onPress={() => handleToggleExpand(property.id)}
          activeOpacity={0.7}
        >
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
            <View style={styles.cardContent}>
              <View style={styles.cardMainInfo}>
                <View style={styles.nicknameRow}>
                  <Ionicons
                    name="home"
                    size={22}
                    color="#008080"
                    style={styles.homeIcon}
                  />
                  <View style={styles.nameContainer}>
                    <Text style={styles.nicknameText} numberOfLines={1}>
                      {property.nickname || "이름 없음"}
                    </Text>
                    {property.nickname && (
                      <Text style={styles.addressText} numberOfLines={1}>
                        {property.address}
                      </Text>
                    )}
                    {!property.nickname && (
                      <Text style={styles.addressText} numberOfLines={1}>
                        {property.address}
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEditNickname(property);
                  }}
                  style={styles.editButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="pencil" size={16} color="#008080" />
                </TouchableOpacity>
              </View>
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleToggleExpand(property.id);
                  }}
                  style={styles.expandButton}
                >
                  <Text style={styles.expandButtonText}>
                    {isExpanded ? "접기" : "더보기"}
                  </Text>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#008080"
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* 아코디언 상세 정보 */}
        {isExpanded && (
          <Animated.View style={styles.detailContainer}>
            <View style={styles.detailContent}>
              <View style={styles.detailSection}>
                <View style={styles.detailItem}>
                  <View style={styles.detailIconContainer}>
                    <Ionicons name="location" size={18} color="#008080" />
                  </View>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.accordionDetailLabel}>상세주소</Text>
                    <Text style={styles.accordionDetailValue}>
                      {property.address}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <View style={styles.detailIconContainer}>
                    <Ionicons name="cash" size={18} color="#4CAF50" />
                  </View>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.accordionDetailLabel}>보증금</Text>
                    <Text style={styles.accordionDetailValue}>
                      {property.deposit?.toLocaleString() || "-"}원
                    </Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <View style={styles.detailIconContainer}>
                    <Ionicons name="calendar" size={18} color="#FF9800" />
                  </View>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.accordionDetailLabel}>전입일</Text>
                    <Text style={styles.accordionDetailValue}>
                      {property.move_in_date || "-"}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <View style={styles.detailIconContainer}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#2196F3"
                    />
                  </View>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.accordionDetailLabel}>확정일자</Text>
                    <Text style={styles.accordionDetailValue}>
                      {property.confirmation_date || "-"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
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
