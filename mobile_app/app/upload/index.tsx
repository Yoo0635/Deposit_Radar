// app/upload/index.tsx
// 등기부등본 업로드 화면 컴포넌트 - 문서 촬영/선택 및 업로드 처리
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, Typography, globalStyles } from "../../constants/styles";
import { styles } from "./uploadStyles";

interface SelectedPdf {
  uri: string;
  name: string;
  size?: number;
}

export default function DocumentUploadScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]); // 이미지 2장 저장
  const [selectedPdf, setSelectedPdf] = useState<SelectedPdf | null>(null);

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "권한 필요",
        "카메라 권한이 필요합니다. 설정에서 권한을 허용해주세요."
      );
      return false;
    }
    return true;
  };

  const handleCameraPress = async () => {
    setShowGuide(true);
  };

  const handleStartCamera = async () => {
    setShowGuide(false);
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImages([...selectedImages, result.assets[0].uri]);
        setSelectedPdf(null); // 이미지 선택 시 PDF 제거
      }
    } catch {
      Alert.alert("오류", "카메라를 열 수 없습니다.");
    }
  };

  const handleGalleryPress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "권한 필요",
        "갤러리 접근 권한이 필요합니다. 설정에서 권한을 허용해주세요."
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImages([...selectedImages, result.assets[0].uri]);
        setSelectedPdf(null); // 이미지 선택 시 PDF 제거
      }
    } catch {
      Alert.alert("오류", "갤러리를 열 수 없습니다.");
    }
  };

  const handlePdfPress = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const pdfFile = {
          uri: result.assets[0].uri,
          name: result.assets[0].name || "document.pdf",
          size: result.assets[0].size,
        };
        setSelectedPdf(pdfFile);
        setSelectedImages([]); // PDF 선택 시 이미지 제거
      }
    } catch (error) {
      console.error("PDF 선택 오류:", error);
      Alert.alert("오류", "PDF 파일을 선택할 수 없습니다.");
    }
  };

  const handleSubmitDocument = async () => {
    if (selectedImages.length === 0 && !selectedPdf) {
      Alert.alert("알림", "등기부등본 이미지 또는 PDF 파일을 선택해주세요.");
      return;
    }

    setIsLoading(true);

    // TODO: 백엔드 API 연동 시 아래 함수로 실제 업로드
    // if (selectedPdf) {
    //   await uploadPdfFile(selectedPdf);
    // } else if (selectedImages.length > 0) {
    //   // 이미지 2장 업로드
    //   for (const imageUri of selectedImages) {
    //     await uploadImageFile(imageUri);
    //   }
    // }

    // 임시: 시뮬레이션 (백엔드 연동 후 제거)
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);

    Alert.alert(
      "업로드 성공!",
      "등본 분석이 시작되었습니다. 완료되면 자동으로 대시보드에 추가됩니다.",
      [
        {
          text: "확인",
          onPress: () => {
            router.replace("/(tabs)/" as any);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={globalStyles.container}>
      <Text style={Typography.h2}>등기부등본 업로드</Text>
      <Text style={styles.subText}>
        초기 등기부등본을 업로드해주세요. 텍스트가 선명하게 보이도록
        촬영해주세요.
      </Text>

      {selectedImages.length > 0 && (
        <View style={globalStyles.card}>
          <Text style={styles.previewLabel}>
            선택된 이미지 ({selectedImages.length}장)
          </Text>
          <View style={styles.imagePreviewContainer}>
            {selectedImages.map((imageUri, index) => (
              <View key={index} style={styles.imagePreviewItem}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => {
                    setSelectedImages(
                      selectedImages.filter((_, i) => i !== index)
                    );
                  }}
                >
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color={Colors.danger}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {selectedPdf && (
        <View style={globalStyles.card}>
          <Text style={styles.previewLabel}>선택된 PDF 파일</Text>
          <View style={styles.pdfPreviewContainer}>
            <Ionicons name="document-text" size={64} color="#008080" />
            <Text style={styles.pdfFileName} numberOfLines={1}>
              {selectedPdf.name}
            </Text>
            {selectedPdf.size && (
              <Text style={styles.pdfFileSize}>
                {(selectedPdf.size / 1024 / 1024).toFixed(2)} MB
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => {
              setSelectedPdf(null);
            }}
          >
            <Ionicons name="close-circle" size={24} color={Colors.danger} />
            <Text style={styles.removeButtonText}>PDF 제거</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={globalStyles.card}>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleCameraPress}
        >
          <Ionicons name="camera-outline" size={24} color="#008080" />
          <Text style={styles.uploadButtonText}>카메라로 촬영하기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleGalleryPress}
        >
          <Ionicons name="image-outline" size={24} color="#008080" />
          <Text style={styles.uploadButtonText}>갤러리에서 선택</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handlePdfPress}
        >
          <Ionicons name="document-text-outline" size={24} color="#008080" />
          <Text style={styles.uploadButtonText}>PDF 파일 선택</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          (isLoading || (selectedImages.length === 0 && !selectedPdf)) &&
            styles.submitButtonDisabled,
        ]}
        onPress={handleSubmitDocument}
        disabled={isLoading || (selectedImages.length === 0 && !selectedPdf)}
      >
        <Text style={styles.submitButtonText}>
          {isLoading ? "분석 중..." : "제출 및 분석 시작"}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showGuide}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGuide(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>촬영 가이드라인</Text>
              <TouchableOpacity
                onPress={() => setShowGuide(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.guideContent}>
              <View style={styles.guideItem}>
                <View style={styles.guideIconContainer}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={Colors.success}
                  />
                </View>
                <View style={styles.guideTextContainer}>
                  <Text style={styles.guideTitle}>1. 평평하게 배치</Text>
                  <Text style={styles.guideDescription}>
                    등기부등본을 평평한 곳에 놓고 촬영하세요. 구겨지거나 접힌
                    부분이 없어야 합니다.
                  </Text>
                </View>
              </View>

              <View style={styles.guideItem}>
                <View style={styles.guideIconContainer}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={Colors.success}
                  />
                </View>
                <View style={styles.guideTextContainer}>
                  <Text style={styles.guideTitle}>2. 충분한 조명</Text>
                  <Text style={styles.guideDescription}>
                    밝은 곳에서 촬영하세요. 그림자가 생기지 않도록 주의하세요.
                  </Text>
                </View>
              </View>

              <View style={styles.guideItem}>
                <View style={styles.guideIconContainer}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={Colors.success}
                  />
                </View>
                <View style={styles.guideTextContainer}>
                  <Text style={styles.guideTitle}>3. 전체가 보이도록</Text>
                  <Text style={styles.guideDescription}>
                    등기부등본 전체가 화면에 들어오도록 촬영하세요. 가장자리가
                    잘리지 않도록 주의하세요.
                  </Text>
                </View>
              </View>

              <View style={styles.guideItem}>
                <View style={styles.guideIconContainer}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={Colors.success}
                  />
                </View>
                <View style={styles.guideTextContainer}>
                  <Text style={styles.guideTitle}>4. 텍스트 선명도</Text>
                  <Text style={styles.guideDescription}>
                    모든 텍스트가 선명하게 보이도록 초점을 맞추세요. 흐릿한
                    사진은 분석 정확도가 떨어집니다.
                  </Text>
                </View>
              </View>

              <View style={styles.guideItem}>
                <View style={styles.guideIconContainer}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={Colors.success}
                  />
                </View>
                <View style={styles.guideTextContainer}>
                  <Text style={styles.guideTitle}>5. 수직으로 촬영</Text>
                  <Text style={styles.guideDescription}>
                    카메라를 수직으로 들고 촬영하세요. 기울어진 사진은 분석이
                    어려울 수 있습니다.
                  </Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.startCameraButton}
              onPress={handleStartCamera}
            >
              <LinearGradient
                colors={["#008080", "#006666"]}
                style={styles.startCameraGradient}
              >
                <Ionicons name="camera" size={20} color="white" />
                <Text style={styles.startCameraText}>카메라 열기</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
