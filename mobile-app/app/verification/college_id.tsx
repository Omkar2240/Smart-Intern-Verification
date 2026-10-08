import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

import { api } from '@/services/api';
import { useAuth } from '@/context/auth-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CollegeIdScreen() {
  const router = useRouter();
  const { verificationStatus, refreshVerificationStatus } = useAuth();

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  // States
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [isReadyToCapture, setIsReadyToCapture] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusResult, setStatusResult] = useState<'verified' | 'manual_review' | 'rejected' | null>(
    verificationStatus?.college_id_status === 'verified'
      ? 'verified'
      : verificationStatus?.college_id_status === 'manual_review'
      ? 'manual_review'
      : verificationStatus?.college_id_status === 'rejected'
      ? 'rejected'
      : null
  );

  // Animations
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Real-time scan laser animation
  useEffect(() => {
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 190,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );

    scanLoop.start();
    return () => scanLoop.stop();
  }, [scanLineAnim]);

  // Real-time card positioning detection timer
  useEffect(() => {
    if (!imageUri && isCameraReady) {
      setIsReadyToCapture(false);
      const timer = setTimeout(() => {
        setIsReadyToCapture(true);
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
      }, 1800);

      return () => clearTimeout(timer);
    }
  }, [imageUri, isCameraReady, pulseAnim]);

  const [imageBase64, setImageBase64] = useState<string | null>(null);

  // Capture from live camera
  const handleCaptureCard = async () => {
    if (!isReadyToCapture) {
      Alert.alert('Align ID Card', 'Please align the ID card steadily inside the frame until the indicator turns green.');
      return;
    }

    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.85,
          skipProcessing: false,
          base64: true,
        });

        if (photo?.uri) {
          setImageUri(photo.uri);
          setImageBase64(photo.base64 || null);
          setImageMime('image/jpeg');
          setStatusResult(null);
          setErrorMessage(null);
        }
      }
    } catch (e: any) {
      console.warn('Camera error, fallback to picker:', e);
      fallbackCameraPicker();
    }
  };

  const fallbackCameraPicker = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        setImageBase64(asset.base64 || null);
        setImageMime(asset.mimeType || 'image/jpeg');
        setStatusResult(null);
        setErrorMessage(null);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err.message || 'Could not launch camera');
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
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        setImageBase64(asset.base64 || null);
        setImageMime(asset.mimeType || 'image/jpeg');
        setStatusResult(null);
        setErrorMessage(null);
      }
    } catch (e: any) {
      Alert.alert('Gallery Error', e.message || 'Could not open gallery');
    }
  };

  const handleRetake = () => {
    setImageUri(null);
    setImageBase64(null);
    setStatusResult(null);
    setErrorMessage(null);
    setIsReadyToCapture(false);
  };

  const handleUpload = async () => {
    if (!imageUri) {
      Alert.alert('Image Required', 'Please position and capture your ID card first.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      const filename = imageUri.split('/').pop() || 'college_id.jpg';
      const res = await api.uploadVerificationCollegeId(imageUri, imageMime, filename, imageBase64);
      await refreshVerificationStatus();

      if (res.step_status === 'verified') {
        setStatusResult('verified');
      } else if (res.step_status === 'manual_review') {
        setStatusResult('manual_review');
      }
    } catch (e: any) {
      const msg = e?.message || 'The uploaded card could not be verified. Please check the guidelines and try again.';
      setErrorMessage(msg);
      setStatusResult('rejected');
      Alert.alert('Verification Failed', msg);
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
          Real-time document scanner. Align your student ID inside the frame. The border will turn green when ready to capture.
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

        {/* Viewfinder Container */}
        <View style={styles.viewfinderSection}>
          {imageUri ? (
            /* Captured Preview */
            <View style={[styles.cardFrame, styles.cardFrameReady]}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
              <View style={[styles.cornerGuide, styles.cornerTL, styles.cornerReady]} />
              <View style={[styles.cornerGuide, styles.cornerTR, styles.cornerReady]} />
              <View style={[styles.cornerGuide, styles.cornerBL, styles.cornerReady]} />
              <View style={[styles.cornerGuide, styles.cornerBR, styles.cornerReady]} />
            </View>
          ) : !permission?.granted ? (
            /* Permission Request */
            <View style={styles.permissionCard}>
              <Ionicons name="camera-outline" size={48} color="#9CA3AF" />
              <Text style={styles.permissionTitle}>Camera Access Required</Text>
              <Text style={styles.permissionDesc}>
                We need rear camera access to scan your college ID card in real time.
              </Text>
              <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Live Camera Viewfinder with Real-time Card HUD */
            <Animated.View
              style={[
                styles.cardFrame,
                isReadyToCapture ? styles.cardFrameReady : styles.cardFrameScanning,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing="back"
                onCameraReady={() => setIsCameraReady(true)}
              />

              {/* Animated Horizontal Laser Beam */}
              {!isReadyToCapture && (
                <Animated.View
                  style={[
                    styles.scanLaserLine,
                    { transform: [{ translateY: scanLineAnim }] },
                  ]}
                />
              )}

              {/* Corner Guides */}
              <View
                style={[
                  styles.cornerGuide,
                  styles.cornerTL,
                  isReadyToCapture && styles.cornerReady,
                ]}
              />
              <View
                style={[
                  styles.cornerGuide,
                  styles.cornerTR,
                  isReadyToCapture && styles.cornerReady,
                ]}
              />
              <View
                style={[
                  styles.cornerGuide,
                  styles.cornerBL,
                  isReadyToCapture && styles.cornerReady,
                ]}
              />
              <View
                style={[
                  styles.cornerGuide,
                  styles.cornerBR,
                  isReadyToCapture && styles.cornerReady,
                ]}
              />
            </Animated.View>
          )}

          {/* Real-time Status Badge */}
          {!imageUri && permission?.granted && (
            <View
              style={[
                styles.statusBadge,
                isReadyToCapture ? styles.statusBadgeReady : styles.statusBadgeScanning,
              ]}
            >
              {isReadyToCapture ? (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text style={styles.statusTextReady}>ID Card Aligned & In Focus — Ready to Capture</Text>
                </>
              ) : (
                <>
                  <ActivityIndicator size="small" color="#D97706" style={{ marginRight: 6 }} />
                  <Text style={styles.statusTextScanning}>Scanning ID card... Keep steady inside frame</Text>
                </>
              )}
            </View>
          )}

          {/* Shutter / Retake / Gallery Actions */}
          {imageUri ? (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleRetake}>
                <Feather name="refresh-cw" size={16} color="#4B5563" style={{ marginRight: 6 }} />
                <Text style={styles.secondaryButtonText}>Retake Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
                <Feather name="image" size={16} color="#4B5563" style={{ marginRight: 6 }} />
                <Text style={styles.secondaryButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.shutterContainer}>
              <TouchableOpacity
                style={[
                  styles.shutterButton,
                  isReadyToCapture ? styles.shutterButtonReady : styles.shutterButtonDisabled,
                ]}
                onPress={handleCaptureCard}
                disabled={!isReadyToCapture}
                activeOpacity={0.8}
              >
                <View style={[styles.shutterInnerCircle, isReadyToCapture && styles.shutterInnerReady]}>
                  <Ionicons
                    name="camera"
                    size={26}
                    color={isReadyToCapture ? '#FFFFFF' : '#9CA3AF'}
                  />
                </View>
                <Text
                  style={[
                    styles.shutterButtonText,
                    isReadyToCapture ? styles.shutterTextReady : styles.shutterTextDisabled,
                  ]}
                >
                  {isReadyToCapture ? 'Capture ID Card' : 'Aligning Card...'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.galleryLink} onPress={pickImage}>
                <Feather name="upload" size={14} color="#6B7280" style={{ marginRight: 4 }} />
                <Text style={styles.galleryLinkText}>Upload from Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

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
                Your card has been submitted. You can continue to Step 3 while our team reviews your document.
              </Text>
            </View>
          </View>
        )}

        {(statusResult === 'rejected' || errorMessage) && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={24} color="#DC2626" />
            <View style={{ flex: 1 }}>
              <Text style={styles.errorTitle}>Verification Unsuccessful</Text>
              <Text style={styles.errorDesc}>
                {errorMessage || verificationStatus?.rejection_reason || 'The uploaded card could not be verified. Ensure institution name and student name are clearly legible, then retake.'}
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
            <Text style={styles.checklistText}>Place card flat on a table in a well-lit area</Text>
          </View>
          <View style={styles.checklistItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.checklistText}>Avoid harsh glare, flash reflections, or blurry text</Text>
          </View>
          <View style={styles.checklistItem}>
            <Ionicons name="shield-checkmark" size={16} color="#3B82F6" />
            <Text style={styles.checklistText}>Each student ID card can only be registered to one account</Text>
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
              style={[styles.primaryButton, (!imageUri || submitting) && styles.buttonDisabled]}
              onPress={handleUpload}
              disabled={!imageUri || submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Verify & Upload ID Card</Text>
                  <Feather name="upload" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  collegePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B45309',
    flex: 1,
  },
  viewfinderSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  cardFrame: {
    width: Math.min(SCREEN_WIDTH - 48, 330),
    height: 220,
    borderRadius: 16,
    borderWidth: 3.5,
    overflow: 'hidden',
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 14,
  },
  cardFrameScanning: {
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  cardFrameReady: {
    borderColor: '#10B981',
    borderStyle: 'solid',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  scanLaserLine: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    height: 3,
    backgroundColor: '#F59E0B',
    borderRadius: 2,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  cornerGuide: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: '#F59E0B',
  },
  cornerReady: {
    borderColor: '#10B981',
  },
  cornerTL: {
    top: 16,
    left: 16,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
  },
  cornerTR: {
    top: 16,
    right: 16,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
  },
  cornerBL: {
    bottom: 16,
    left: 16,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
  },
  cornerBR: {
    bottom: 16,
    right: 16,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  statusBadgeScanning: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusBadgeReady: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusTextScanning: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B45309',
  },
  statusTextReady: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  shutterContainer: {
    alignItems: 'center',
    gap: 10,
  },
  shutterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    gap: 10,
    elevation: 3,
  },
  shutterButtonReady: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  shutterButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  shutterInnerCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInnerReady: {
    backgroundColor: '#059669',
  },
  shutterButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  shutterTextReady: {
    color: '#FFFFFF',
  },
  shutterTextDisabled: {
    color: '#9CA3AF',
  },
  galleryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  galleryLinkText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  permissionCard: {
    width: Math.min(SCREEN_WIDTH - 48, 330),
    height: 220,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginBottom: 14,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  permissionDesc: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
  },
  permissionButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  successBanner: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
    gap: 12,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 2,
  },
  successDesc: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 18,
  },
  reviewBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
    gap: 12,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  reviewDesc: {
    fontSize: 13,
    color: '#B45309',
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
    gap: 12,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 2,
  },
  errorDesc: {
    fontSize: 13,
    color: '#B91C1C',
    lineHeight: 18,
  },
  checklistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  checklistTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  checklistText: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    marginTop: 4,
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
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
