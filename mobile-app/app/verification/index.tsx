import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '@/context/auth-context';
import { VerificationStatus } from '@/services/api';

export default function VerificationHubScreen() {
  const router = useRouter();
  const { user, verificationStatus, refreshVerificationStatus, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshVerificationStatus();
  }, []);

  const getStepNumber = (step?: string) => {
    switch (step) {
      case 'college_selection':
        return 1;
      case 'college_id':
        return 2;
      case 'face':
        return 3;
      case 'completed':
        return 4;
      default:
        return 1;
    }
  };

  const currentStepNum = getStepNumber(verificationStatus?.current_step);

  const handleContinue = () => {
    switch (verificationStatus?.current_step) {
      case 'college_selection':
        router.push('/verification/college' as any);
        break;
      case 'college_id':
        router.push('/verification/college_id' as any);
        break;
      case 'face':
        router.push('/verification/face' as any);
        break;
      case 'completed':
        router.push('/verification/complete' as any);
        break;
      default:
        router.push('/verification/college' as any);
        break;
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Bar */}
        <View style={styles.topBar}>
          <View style={styles.brandBadge}>
            <MaterialCommunityIcons name="shield-check" size={20} color="#F59E0B" />
            <Text style={styles.brandBadgeText}>TrackIntern Identity</Text>
          </View>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <Feather name="log-out" size={18} color="#6B7280" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Title Section */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>Identity Verification</Text>
          <Text style={styles.subtitle}>
            Welcome, {user?.name || 'Intern'}! Complete first-time identity verification
            to activate your internship dashboard, join companies, and mark attendance.
          </Text>
        </View>

        {/* Progress Bar Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Verification Progress</Text>
            <Text style={styles.progressPercent}>
              {currentStepNum === 4
                ? '100%'
                : currentStepNum === 3
                ? '66%'
                : currentStepNum === 2
                ? '33%'
                : '10%'}
            </Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width:
                    currentStepNum === 4
                      ? '100%'
                      : currentStepNum === 3
                      ? '66%'
                      : currentStepNum === 2
                      ? '33%'
                      : '10%',
                },
              ]}
            />
          </View>
        </View>

        {/* 3 Step Cards */}
        <View style={styles.stepsContainer}>
          {/* Step 1: College */}
          <TouchableOpacity
            style={[
              styles.stepCard,
              currentStepNum === 1 && styles.stepCardActive,
            ]}
            onPress={() => router.push('/verification/college' as any)}
            activeOpacity={0.8}
          >
            <View style={styles.stepIconWrap}>
              {verificationStatus?.college_verified ? (
                <View style={[styles.stepIconBadge, styles.stepIconDone]}>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                </View>
              ) : (
                <View
                  style={[
                    styles.stepIconBadge,
                    currentStepNum === 1 ? styles.stepIconCurrent : styles.stepIconPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumberText,
                      currentStepNum === 1 ? styles.stepNumberCurrent : styles.stepNumberPending,
                    ]}
                  >
                    1
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>Select College</Text>
              <Text style={styles.stepDesc}>
                {verificationStatus?.college_name
                  ? verificationStatus.college_name
                  : 'Select your registered engineering institution'}
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Step 2: College ID */}
          <TouchableOpacity
            style={[
              styles.stepCard,
              currentStepNum === 2 && styles.stepCardActive,
            ]}
            onPress={() => {
              if (currentStepNum >= 2) {
                router.push('/verification/college_id' as any);
              } else {
                Alert.alert('Step 1 Required', 'Please select your college first.');
              }
            }}
            activeOpacity={0.8}
          >
            <View style={styles.stepIconWrap}>
              {verificationStatus?.college_id_verified ? (
                <View style={[styles.stepIconBadge, styles.stepIconDone]}>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                </View>
              ) : (
                <View
                  style={[
                    styles.stepIconBadge,
                    currentStepNum === 2 ? styles.stepIconCurrent : styles.stepIconPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumberText,
                      currentStepNum === 2 ? styles.stepNumberCurrent : styles.stepNumberPending,
                    ]}
                  >
                    2
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.stepInfo}>
              <View style={styles.stepTitleRow}>
                <Text style={styles.stepTitle}>College ID Card</Text>
                {verificationStatus?.college_id_status === 'manual_review' && (
                  <View style={styles.reviewPill}>
                    <Text style={styles.reviewPillText}>Under Review</Text>
                  </View>
                )}
              </View>
              <Text style={styles.stepDesc}>
                {verificationStatus?.college_id_verified
                  ? 'ID card verified and matched'
                  : 'Capture or upload front photo of your student ID card'}
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Step 3: Face */}
          <TouchableOpacity
            style={[
              styles.stepCard,
              currentStepNum === 3 && styles.stepCardActive,
            ]}
            onPress={() => {
              if (currentStepNum >= 3) {
                router.push('/verification/face' as any);
              } else {
                Alert.alert('Previous Steps Required', 'Please complete Steps 1 and 2 first.');
              }
            }}
            activeOpacity={0.8}
          >
            <View style={styles.stepIconWrap}>
              {verificationStatus?.face_verified ? (
                <View style={[styles.stepIconBadge, styles.stepIconDone]}>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                </View>
              ) : (
                <View
                  style={[
                    styles.stepIconBadge,
                    currentStepNum === 3 ? styles.stepIconCurrent : styles.stepIconPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumberText,
                      currentStepNum === 3 ? styles.stepNumberCurrent : styles.stepNumberPending,
                    ]}
                  >
                    3
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>Live Face Enrollment</Text>
              <Text style={styles.stepDesc}>
                {verificationStatus?.face_verified
                  ? 'ArcFace biometric embedding enrolled'
                  : 'Capture live face with 3D anti-spoofing detection'}
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Feather name="lock" size={16} color="#6B7280" />
          <Text style={styles.securityNoticeText}>
            Biometric embeddings are encrypted mathematically. Raw face images are never stored permanently.
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>
            {currentStepNum === 4
              ? 'View Completed Verification'
              : currentStepNum === 3
              ? 'Start Face Enrollment'
              : currentStepNum === 2
              ? 'Upload College ID'
              : 'Select College'}
          </Text>
          <Feather name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  brandBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 6,
  },
  signOutText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
  },
  progressCard: {
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  stepsContainer: {
    gap: 14,
    marginBottom: 24,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  stepCardActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFDF9',
  },
  stepIconWrap: {
    marginRight: 14,
  },
  stepIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIconDone: {
    backgroundColor: '#10B981',
  },
  stepIconCurrent: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  stepIconPending: {
    backgroundColor: '#F3F4F6',
  },
  stepNumberText: {
    fontSize: 15,
    fontWeight: '700',
  },
  stepNumberCurrent: {
    color: '#B45309',
  },
  stepNumberPending: {
    color: '#9CA3AF',
  },
  stepInfo: {
    flex: 1,
    marginRight: 8,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  reviewPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  reviewPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
  },
  stepDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 24,
  },
  securityNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
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
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
