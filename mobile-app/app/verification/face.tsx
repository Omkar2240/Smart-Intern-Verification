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

export default function FaceVerificationScreen() {
  const router = useRouter();
  const { refreshVerificationStatus, refreshUser } = useAuth();

  const [faceUri, setFaceUri] = useState<string | null>(null);
  const [faceMime, setFaceMime] = useState<string>('image/jpeg');
  const [submitting, setSubmitting] = useState(false);
  const [progressStage, setProgressStage] = useState<string>('');

  const captureFace = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed for live face verification.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.front,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFaceUri(asset.uri);
        setFaceMime(asset.mimeType || 'image/jpeg');
      }
    } catch (e: any) {
      Alert.alert('Camera Error', e.message || 'Could not open front camera.');
    }
  };

  const handleEnroll = async () => {
    if (!faceUri) {
      Alert.alert('Face Capture Required', 'Please take a live face photo before proceeding.');
      return;
    }

    setSubmitting(true);
    setProgressStage('Detecting face & checking quality...');

    try {
      setTimeout(() => setProgressStage('Running 3D anti-spoofing analysis...'), 900);
      setTimeout(() => setProgressStage('Extracting ArcFace biometric embedding...'), 1800);

      const filename = faceUri.split('/').pop() || 'face_capture.jpg';
      await api.enrollFace(faceUri, faceMime, filename);

      setProgressStage('Enrollment complete!');
      await refreshVerificationStatus();
      await refreshUser();

      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert(
        'Face Verification Failed',
        e.message || 'Could not verify face. Please ensure you are in a well-lit room and looking straight into the camera.',
        [{ text: 'Try Again', onPress: () => setFaceUri(null) }]
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
          Capture your face for biometric enrollment. This signature will be used to verify your daily internship attendance.
        </Text>

        {/* Face Oval Container */}
        <View style={styles.ovalSection}>
          <View style={styles.ovalFrame}>
            {faceUri ? (
              <Image source={{ uri: faceUri }} style={styles.facePreview} />
            ) : (
              <View style={styles.ovalPlaceholder}>
                <Ionicons name="person-outline" size={80} color="#D1D5DB" />
                <Text style={styles.ovalGuideText}>Align face in frame</Text>
              </View>
            )}

            {/* Corner Alignment Guides */}
            <View style={[styles.cornerGuide, styles.cornerTL]} />
            <View style={[styles.cornerGuide, styles.cornerTR]} />
            <View style={[styles.cornerGuide, styles.cornerBL]} />
            <View style={[styles.cornerGuide, styles.cornerBR]} />
          </View>

          {/* Action under oval */}
          <TouchableOpacity style={styles.cameraTrigger} onPress={captureFace}>
            <Feather name="camera" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.cameraTriggerText}>
              {faceUri ? 'Retake Live Photo' : 'Open Camera to Capture'}
            </Text>
          </TouchableOpacity>
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
          <Text style={styles.rulesTitle}>Facial Biometric Rules</Text>
          <View style={styles.ruleRow}>
            <MaterialCommunityIcons name="white-balance-sunny" size={18} color="#F59E0B" />
            <Text style={styles.ruleText}>Ensure face is clearly illuminated with even lighting</Text>
          </View>
          <View style={styles.ruleRow}>
            <MaterialCommunityIcons name="face-recognition" size={18} color="#F59E0B" />
            <Text style={styles.ruleText}>Look straight into the lens with a neutral expression</Text>
          </View>
          <View style={styles.ruleRow}>
            <MaterialCommunityIcons name="sunglasses" size={18} color="#EF4444" />
            <Text style={styles.ruleText}>Remove sunglasses, hats, or face masks</Text>
          </View>
          <View style={styles.ruleRow}>
            <MaterialCommunityIcons name="cellphone-off" size={18} color="#EF4444" />
            <Text style={styles.ruleText}>Screens or printed photos will be detected and rejected</Text>
          </View>
        </View>

        {/* Submit CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryButton, (!faceUri || submitting) && styles.buttonDisabled]}
            onPress={handleEnroll}
            disabled={!faceUri || submitting}
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
  ovalSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ovalFrame: {
    width: 220,
    height: 280,
    borderRadius: 110,
    borderWidth: 3,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  facePreview: {
    width: '100%',
    height: '100%',
  },
  ovalPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  ovalGuideText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  cornerGuide: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#F59E0B',
  },
  cornerTL: {
    top: 15,
    left: 15,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: 15,
    right: 15,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: 15,
    left: 15,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: 15,
    right: 15,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  cameraTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 14,
  },
  cameraTriggerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  processingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 20,
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
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
    gap: 12,
  },
  rulesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 2,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ruleText: {
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
