import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { api } from '@/services/api';
import { useAuth } from '@/context/auth-context';

export default function CollegeIdScreen() {
  const router = useRouter();
  const { verificationStatus, refreshVerificationStatus } = useAuth();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [submitting, setSubmitting] = useState(false);
  const [statusResult, setStatusResult] = useState<'verified' | 'manual_review' | 'rejected' | null>(
    verificationStatus?.college_id_status === 'verified'
      ? 'verified'
      : verificationStatus?.college_id_status === 'manual_review'
      ? 'manual_review'
      : null
  );

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to capture your ID card.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.85,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        setImageMime(asset.mimeType || 'image/jpeg');
        setStatusResult(null);
      }
    } catch (e: any) {
      Alert.alert('Camera Error', e.message || 'Could not open camera');
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Photo library permission is required to upload your ID card.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.85,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        setImageMime(asset.mimeType || 'image/jpeg');
        setStatusResult(null);
      }
    } catch (e: any) {
      Alert.alert('Gallery Error', e.message || 'Could not open gallery');
    }
  };

  const handleUpload = async () => {
    if (!imageUri) {
      Alert.alert('Image Required', 'Please take a photo or select your college ID card.');
      return;
    }

    setSubmitting(true);
    try {
      const filename = imageUri.split('/').pop() || 'college_id.jpg';
      const res = await api.uploadVerificationCollegeId(imageUri, imageMime, filename);
      await refreshVerificationStatus();

      if (res.step_status === 'verified') {
        setStatusResult('verified');
      } else if (res.step_status === 'manual_review') {
        setStatusResult('manual_review');
      }
    } catch (e: any) {
      Alert.alert(
        'Verification Failed',
        e.message || 'The uploaded card could not be verified. Please check the guidelines and try again.'
      );
      setStatusResult('rejected');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={22} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>Step 2 of 3</Text>
          </View>
        </View>

        <Text style={styles.title}>Upload College ID Card</Text>
        <Text style={styles.subtitle}>
          Take a photo of your student ID card. Our automated OCR will verify your enrolled college and registered name.
        </Text>

        {/* Selected College Pill */}
        {verificationStatus?.college_name && (
          <View style={styles.collegePill}>
            <Ionicons name="school-outline" size={16} color="#B45309" />
            <Text style={styles.collegePillText} numberOfLines={1}>
              {verificationStatus.college_name}
            </Text>
          </View>
        )}

        {/* Upload Container */}
        {imageUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
            <View style={styles.retakeRow}>
              <TouchableOpacity style={styles.retakeButton} onPress={takePhoto}>
                <Feather name="camera" size={16} color="#4B5563" />
                <Text style={styles.retakeText}>Retake Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chooseButton} onPress={pickImage}>
                <Feather name="image" size={16} color="#4B5563" />
                <Text style={styles.retakeText}>Choose Another</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.uploadPlaceholder}>
            <MaterialCommunityIcons name="card-account-details-outline" size={56} color="#D1D5DB" />
            <Text style={styles.uploadPlaceholderTitle}>Capture or Upload ID Card</Text>
            <Text style={styles.uploadPlaceholderSub}>Ensure all text is clearly legible</Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
                <Feather name="camera" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.captureButtonText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chooseButton} onPress={pickImage}>
                <Feather name="upload" size={18} color="#1F2937" style={{ marginRight: 6 }} />
                <Text style={styles.chooseButtonText}>From Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Status Feedback Banner */}
        {statusResult === 'verified' && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <View style={{ flex: 1 }}>
              <Text style={styles.successTitle}>College ID Verified!</Text>
              <Text style={styles.successDesc}>
                Student profile details matched successfully. You are ready for live face enrollment.
              </Text>
            </View>
          </View>
        )}

        {statusResult === 'manual_review' && (
          <View style={styles.reviewBanner}>
            <Ionicons name="information-circle" size={24} color="#F59E0B" />
            <View style={{ flex: 1 }}>
              <Text style={styles.reviewTitle}>Forwarded for Review</Text>
              <Text style={styles.reviewDesc}>
                Your card has been submitted. You can continue to Step 3 while our team verifies your document.
              </Text>
            </View>
          </View>
        )}

        {/* Checklist Guidelines */}
        <View style={styles.checklistCard}>
          <Text style={styles.checklistTitle}>ID Verification Guidelines</Text>
          <View style={styles.checklistItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.checklistText}>College name and student name must be clearly readable</Text>
          </View>
          <View style={styles.checklistItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.checklistText}>Place card on a flat surface in a well-lit area</Text>
          </View>
          <View style={styles.checklistItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.checklistText}>Avoid harsh glare, flash reflection, or shadows</Text>
          </View>
        </View>

        {/* Bottom CTA */}
        <View style={styles.footer}>
          {statusResult === 'verified' || statusResult === 'manual_review' ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/verification/face' as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Proceed to Step 3: Face Enrollment</Text>
              <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, !imageUri && styles.buttonDisabled]}
              onPress={handleUpload}
              disabled={!imageUri || submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Upload & Verify ID Card</Text>
                  <Feather name="shield" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FDF5F0',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 6,
  },
  stepBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  collegePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  collegePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B45309',
    flex: 1,
  },
  uploadPlaceholder: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  uploadPlaceholderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 4,
  },
  uploadPlaceholderSub: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  captureButton: {
    backgroundColor: '#1F2937',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  captureButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  chooseButton: {
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  chooseButtonText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
  },
  previewContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  retakeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  retakeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 2,
  },
  successDesc: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 16,
  },
  reviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 20,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  reviewDesc: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 16,
  },
  checklistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
    gap: 10,
  },
  checklistTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checklistText: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
  },
  footer: {
    paddingTop: 8,
  },
  primaryButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
