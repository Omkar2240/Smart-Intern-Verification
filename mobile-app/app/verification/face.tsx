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
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isFaceVerified, setIsFaceVerified] = useState(false);
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

  // Capture photo from live CameraView and validate genuine face presence & alignment
  const handleCaptureFromCamera = async () => {
    if (!cameraRef.current || !isCameraReady || isValidating) return;

    try {
      setIsValidating(true);
      setErrorMsg(null);
      setIsFaceVerified(false);

      // Quality 0.70 produces lightweight ~150KB image, safe for Render 512MB limit
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.70,
        skipProcessing: false,
        base64: true,
      });

      if (!photo?.uri) {
        setIsValidating(false);
        return;
      }

      setFaceUri(photo.uri);
      setFaceBase64(photo.base64 || null);
      setFaceMime('image/jpeg');

      // Probe backend for face detection, alignment, and clarity
      await validateCapturedFace(photo.uri, photo.base64 || null);
    } catch (e: any) {
      console.warn('Camera capture error, falling back to picker:', e);
      fallbackCapturePicker();
    }
  };

  const validateCapturedFace = async (uri: string, b64?: string | null) => {
    setIsValidating(true);
    try {
      const filename = uri.split('/').pop() || 'face_probe.jpg';
      const result = await api.validateFace(uri, 'image/jpeg', filename, b64);

      if (result.detected && result.aligned && result.clear) {
        setIsFaceVerified(true);
        setErrorMsg(null);
        // Haptic feedback pulse on genuine face detection
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
      } else {
        setIsFaceVerified(false);
        const failMsg =
          result.message || 'Face not properly detected or aligned. Please center your face inside the frame.';
        setErrorMsg(failMsg);
        Alert.alert('Face Alignment Alert', failMsg, [{ text: 'Reposition & Try Again', onPress: handleRetake }]);
      }
    } catch (err: any) {
      console.warn('Face validation network issue:', err);
      setIsFaceVerified(false);
      const is404 = err?.message?.includes('404') || err?.message?.includes('Not Found');
      const msg = is404
        ? 'Backend on Render has not been updated with the new face validation service yet (404 Not Found). Please push git commits so Render redeploys.'
        : (err?.message || 'Face validation network error. Please try again.');
      setErrorMsg(msg);
      Alert.alert('Backend Service Update', msg, [{ text: 'OK', onPress: handleRetake }]);
    } finally {
      setIsValidating(false);
    }
  };

  const fallbackCapturePicker = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.front,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.70,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFaceUri(asset.uri);
        setFaceBase64(asset.base64 || null);
        setFaceMime(asset.mimeType || 'image/jpeg');
        setErrorMsg(null);
        await validateCapturedFace(asset.uri, asset.base64 || null);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err.message || 'Could not take photo.');
      setIsValidating(false);
    }
  };

  const handleRetake = () => {
    setFaceUri(null);
    setFaceBase64(null);
    setErrorMsg(null);
    setIsFaceVerified(false);
    setIsValidating(false);
  };

  const handleEnroll = async () => {
    if (!faceUri || !isFaceVerified) {
      setErrorMsg('Please capture a clear, aligned face photo before proceeding.');
      Alert.alert('Face Capture Required', 'Please position your face steadily inside the oval frame and tap capture.');
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
      const is502 = e?.message?.includes('502') || e?.message?.includes('Bad Gateway');
      const msg = is502
        ? 'Server ran out of memory on Render (502 Bad Gateway). The backend on Render is still running old code. Please push your changes to GitHub to redeploy Render with memory optimizations.'
        : (e?.message || 'Face verification failed. Please ensure you are looking straight and in a well-lit area.');
      setErrorMsg(msg);
      setIsFaceVerified(false);
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
          Real-time biometric scanner. Align your face inside the oval and tap capture. The frame will verify your face presence and clarity.
        </Text>

        {/* Error Banner */}
        {errorMsg && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
            <View style={{ flex: 1 }}>
              <Text style={styles.errorTitle}>Face Alignment Alert</Text>
              <Text style={styles.errorDesc}>{errorMsg}</Text>
            </View>
          </View>
        )}

        {/* Biometric Viewfinder / Oval Section */}
        <View style={styles.viewfinderContainer}>
          {faceUri ? (
            /* Captured Static Preview with Verification State */
            <Animated.View
              style={[
                styles.ovalFrame,
                isFaceVerified ? styles.ovalFrameReady : styles.ovalFrameError,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Image source={{ uri: faceUri }} style={styles.facePreview} />

              {/* Validation Spinner Overlay */}
              {isValidating && (
                <View style={styles.validatingOverlay}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.validatingOverlayText}>Validating Face...</Text>
                </View>
              )}

              {/* Corner Guides */}
              <View
                style={[
                  styles.cornerGuide,
                  styles.cornerTL,
                  isFaceVerified ? styles.cornerReady : styles.cornerError,
                ]}
              />
              <View
                style={[
                  styles.cornerGuide,
                  styles.cornerTR,
                  isFaceVerified ? styles.cornerReady : styles.cornerError,
                ]}
              />
              <View
                style={[
                  styles.cornerGuide,
                  styles.cornerBL,
                  isFaceVerified ? styles.cornerReady : styles.cornerError,
                ]}
              />
              <View
                style={[
                  styles.cornerGuide,
                  styles.cornerBR,
                  isFaceVerified ? styles.cornerReady : styles.cornerError,
                ]}
              />
            </Animated.View>
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
            /* Live Camera Viewfinder with Real-time Scanning HUD */
            <Animated.View
              style={[
                styles.ovalFrame,
                styles.ovalFrameScanning,
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
              <Animated.View
                style={[
                  styles.scanLaserLine,
                  { transform: [{ translateY: scanLineAnim }] },
                ]}
              />

              {/* Corner Guides */}
              <View style={[styles.cornerGuide, styles.cornerTL]} />
              <View style={[styles.cornerGuide, styles.cornerTR]} />
              <View style={[styles.cornerGuide, styles.cornerBL]} />
              <View style={[styles.cornerGuide, styles.cornerBR]} />
            </Animated.View>
          )}

          {/* Real-time Status Badge */}
          {!faceUri && permission?.granted && (
            <View style={[styles.statusBadge, styles.statusBadgeScanning]}>
              <Ionicons name="scan-outline" size={16} color="#D97706" />
              <Text style={styles.statusTextScanning}>Align your face inside the oval frame</Text>
            </View>
          )}

          {faceUri && isValidating && (
            <View style={[styles.statusBadge, styles.statusBadgeValidating]}>
              <ActivityIndicator size="small" color="#2563EB" style={{ marginRight: 6 }} />
              <Text style={styles.statusTextValidating}>Checking face alignment & clarity...</Text>
            </View>
          )}

          {faceUri && !isValidating && isFaceVerified && (
            <View style={[styles.statusBadge, styles.statusBadgeReady]}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.statusTextReady}>Face Aligned & Detected — Ready to Enroll</Text>
            </View>
          )}

          {faceUri && !isValidating && !isFaceVerified && (
            <View style={[styles.statusBadge, styles.statusBadgeError]}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.statusTextError}>Face Not Detected / Misaligned</Text>
            </View>
          )}

          {/* Shutter / Retake Actions */}
          {faceUri ? (
            <TouchableOpacity
              style={styles.retakeTrigger}
              onPress={handleRetake}
              disabled={submitting || isValidating}
            >
              <Feather name="refresh-cw" size={16} color="#6B7280" style={{ marginRight: 6 }} />
              <Text style={styles.retakeTriggerText}>Retake Photo</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.shutterButton,
                isCameraReady && !isValidating ? styles.shutterButtonActive : styles.shutterButtonDisabled,
              ]}
              onPress={handleCaptureFromCamera}
              disabled={!isCameraReady || isValidating}
              activeOpacity={0.8}
            >
              <View style={[styles.shutterInnerCircle, styles.shutterInnerActive]}>
                <Ionicons name="camera" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.shutterButtonText}>
                {isValidating ? 'Validating...' : 'Capture Face'}
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
        {faceUri && isFaceVerified && !isValidating && (
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

        {/* Retry CTA when face check failed */}
        {faceUri && !isFaceVerified && !isValidating && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetake}
              activeOpacity={0.85}
            >
              <Feather name="refresh-cw" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.retryButtonText}>Reposition Face & Retake</Text>
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
  ovalFrameError: {
    borderColor: '#EF4444',
    borderStyle: 'solid',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  facePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  validatingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.60)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  validatingOverlayText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
  cornerError: {
    borderColor: '#EF4444',
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
  statusBadgeValidating: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  statusBadgeReady: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusBadgeError: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  statusTextScanning: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B45309',
  },
  statusTextValidating: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  statusTextReady: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  statusTextError: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B91C1C',
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
  shutterButtonActive: {
    backgroundColor: '#1F2937',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  shutterButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  shutterInnerCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInnerActive: {
    backgroundColor: '#374151',
  },
  shutterButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
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
  retryButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
