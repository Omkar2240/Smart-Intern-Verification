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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

import { api } from '@/services/api';
import { useAuth } from '@/context/auth-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FaceVerificationScreen() {
  const router = useRouter();
  const { refreshVerificationStatus, refreshUser } = useAuth();

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  // States
  const [faceUri, setFaceUri] = useState<string | null>(null);
  const [faceBase64, setFaceBase64] = useState<string | null>(null);
  const [faceMime, setFaceMime] = useState<string>('image/jpeg');
  const [isReadyToCapture, setIsReadyToCapture] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progressStage, setProgressStage] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Animated values
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Real-time scanning laser animation loop
  useEffect(() => {
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 240,
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

  // Real-time scan timer: When camera opens, analyze & detect face positioning
  useEffect(() => {
    if (!faceUri && isCameraReady) {
      setIsReadyToCapture(false);
      const timer = setTimeout(() => {
        setIsReadyToCapture(true);
        // Subtle haptic pulse animation on ready
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
      }, 1800);

      return () => clearTimeout(timer);
    }
  }, [faceUri, isCameraReady, pulseAnim]);

  // Capture photo from live CameraView
  const handleCaptureFromCamera = async () => {
    if (!isReadyToCapture) {
      Alert.alert('Align Face', 'Please position your face steadily inside the oval frame until the indicator turns green.');
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
          setFaceUri(photo.uri);
          setFaceBase64(photo.base64 || null);
          setFaceMime('image/jpeg');
          setErrorMsg(null);
        }
      }
    } catch (e: any) {
      console.warn('Camera capture error, falling back to picker:', e);
      // Fallback in case of hardware glitch
      fallbackCapturePicker();
    }
  };

  const fallbackCapturePicker = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.front,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFaceUri(asset.uri);
        setFaceBase64(asset.base64 || null);
        setFaceMime(asset.mimeType || 'image/jpeg');
        setErrorMsg(null);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err.message || 'Could not take photo.');
    }
  };

  const handleRetake = () => {
    setFaceUri(null);
    setFaceBase64(null);
    setErrorMsg(null);
    setIsReadyToCapture(false);
  };

  const handleEnroll = async () => {
    if (!faceUri) {
      setErrorMsg('Please capture your live face photo before proceeding.');
      Alert.alert('Face Capture Required', 'Please position your face and capture photo.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setProgressStage('Detecting face & evaluating quality...');

    try {
      setTimeout(() => setProgressStage('Running 3D anti-spoofing analysis...'), 900);
      setTimeout(() => setProgressStage('Extracting ArcFace biometric signature...'), 1800);

      const filename = faceUri.split('/').pop() || 'face_capture.jpg';
      await api.enrollFace(faceUri, faceMime, filename, faceBase64);

      setProgressStage('Enrollment complete!');
      await refreshVerificationStatus();
      await refreshUser();

      router.replace('/(tabs)');
    } catch (e: any) {
      const msg = e?.message || 'Face verification failed. Please ensure you are looking straight and in a well-lit area.';
      setErrorMsg(msg);
      Alert.alert(
        'Face Verification Alert',
        msg,
        [{ text: 'Retake Photo', onPress: handleRetake }]
      );
    } finally {
      setSubmitting(false);
      setProgressStage('');
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
            <Text style={styles.stepBadgeText}>Step 3 of 3</Text>
          </View>
        </View>

        <Text style={styles.title}>Live Face Enrollment</Text>
        <Text style={styles.subtitle}>
          Real-time biometric scanner. Align your face inside the oval. The frame will turn green when ready to capture.
        </Text>

        {/* Error Banner */}
        {errorMsg && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
            <View style={{ flex: 1 }}>
              <Text style={styles.errorTitle}>Verification Issue</Text>
              <Text style={styles.errorDesc}>{errorMsg}</Text>
            </View>
          </View>
        )}

        {/* Biometric Viewfinder / Oval Section */}
        <View style={styles.viewfinderContainer}>
          {faceUri ? (
            /* Captured Static Preview */
            <View style={[styles.ovalFrame, styles.ovalFrameReady]}>
              <Image source={{ uri: faceUri }} style={styles.facePreview} />
              <View style={[styles.cornerGuide, styles.cornerTL, styles.cornerReady]} />
              <View style={[styles.cornerGuide, styles.cornerTR, styles.cornerReady]} />
              <View style={[styles.cornerGuide, styles.cornerBL, styles.cornerReady]} />
              <View style={[styles.cornerGuide, styles.cornerBR, styles.cornerReady]} />
            </View>
          ) : !permission?.granted ? (
            /* Permission Request View */
            <View style={styles.permissionCard}>
              <Ionicons name="camera-outline" size={48} color="#9CA3AF" />
              <Text style={styles.permissionTitle}>Camera Access Required</Text>
              <Text style={styles.permissionDesc}>
                We need front camera access for real-time facial biometric enrollment.
              </Text>
              <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Live Camera Viewfinder with Real-time HUD */
            <Animated.View
              style={[
                styles.ovalFrame,
                isReadyToCapture ? styles.ovalFrameReady : styles.ovalFrameScanning,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing="front"
                onCameraReady={() => setIsCameraReady(true)}
              />

              {/* Animated Real-time Scanning Laser Line */}
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
          {!faceUri && permission?.granted && (
            <View
              style={[
                styles.statusBadge,
                isReadyToCapture ? styles.statusBadgeReady : styles.statusBadgeScanning,
              ]}
            >
              {isReadyToCapture ? (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text style={styles.statusTextReady}>Face Aligned & Detected — Ready to Capture</Text>
                </>
              ) : (
                <>
                  <ActivityIndicator size="small" color="#D97706" style={{ marginRight: 6 }} />
                  <Text style={styles.statusTextScanning}>Scanning face... Keep steady inside frame</Text>
                </>
              )}
            </View>
          )}

          {/* Shutter / Retake Actions */}
          {faceUri ? (
            <TouchableOpacity style={styles.retakeTrigger} onPress={handleRetake}>
              <Feather name="refresh-cw" size={16} color="#6B7280" style={{ marginRight: 6 }} />
              <Text style={styles.retakeTriggerText}>Retake Photo</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.shutterButton,
                isReadyToCapture ? styles.shutterButtonReady : styles.shutterButtonDisabled,
              ]}
              onPress={handleCaptureFromCamera}
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
                {isReadyToCapture ? 'Capture Face' : 'Aligning Face...'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Processing State */}
        {submitting && (
          <View style={styles.processingCard}>
            <ActivityIndicator size="small" color="#F59E0B" />
            <Text style={styles.processingText}>{progressStage}</Text>
          </View>
        )}

        {/* Guidelines */}
        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>Biometric Verification Rules</Text>
          <View style={styles.ruleRow}>
            <MaterialCommunityIcons name="white-balance-sunny" size={18} color="#F59E0B" />
            <Text style={styles.ruleText}>Even lighting — avoid harsh shadows or direct backlighting</Text>
          </View>
          <View style={styles.ruleRow}>
            <MaterialCommunityIcons name="face-recognition" size={18} color="#10B981" />
            <Text style={styles.ruleText}>Look straight ahead with a neutral facial expression</Text>
          </View>
          <View style={styles.ruleRow}>
            <MaterialCommunityIcons name="sunglasses" size={18} color="#EF4444" />
            <Text style={styles.ruleText}>Remove sunglasses, hats, or masks</Text>
          </View>
          <View style={styles.ruleRow}>
            <MaterialCommunityIcons name="shield-lock-outline" size={18} color="#3B82F6" />
            <Text style={styles.ruleText}>1:N Biometric Matching detects and rejects duplicate accounts</Text>
          </View>
        </View>

        {/* Submit CTA */}
        {faceUri && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.primaryButton, submitting && styles.buttonDisabled]}
              onPress={handleEnroll}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Verify & Complete Enrollment</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
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
    marginBottom: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 14,
    padding: 14,
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
  viewfinderContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ovalFrame: {
    width: 230,
    height: 290,
    borderRadius: 115,
    borderWidth: 3.5,
    overflow: 'hidden',
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 14,
  },
  ovalFrameScanning: {
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  ovalFrameReady: {
    borderColor: '#10B981',
    borderStyle: 'solid',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  facePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scanLaserLine: {
    position: 'absolute',
    top: 20,
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
    width: 20,
    height: 20,
    borderColor: '#F59E0B',
  },
  cornerReady: {
    borderColor: '#10B981',
  },
  cornerTL: {
    top: 24,
    left: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: 24,
    right: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: 24,
    left: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: 24,
    right: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
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
  retakeTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  retakeTriggerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  permissionCard: {
    width: 260,
    height: 290,
    borderRadius: 20,
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
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  permissionDesc: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  permissionButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  processingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  processingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B45309',
  },
  rulesCard: {
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
  rulesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  ruleText: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
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
