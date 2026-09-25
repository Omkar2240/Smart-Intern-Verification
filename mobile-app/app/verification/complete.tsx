import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '@/context/auth-context';

export default function VerificationCompleteScreen() {
  const router = useRouter();
  const { user, verificationStatus } = useAuth();

  React.useEffect(() => {
    router.replace('/(tabs)');
  }, []);

  const handleEnterDashboard = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Celebration Header */}
        <View style={styles.celebrationSection}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Identity Verified!</Text>
          <Text style={styles.subtitle}>
            Congratulations, {user?.name || 'Intern'}! Your identity onboarding has been verified. You now have full access to TrackIntern.
          </Text>
        </View>

        {/* Verified Credential Card */}
        <View style={styles.credentialCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="shield-check" size={24} color="#10B981" />
            <Text style={styles.cardTitle}>Verified Intern Profile</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Student Name</Text>
            <Text style={styles.infoValue}>{user?.name || 'Omkar Ramgirwar'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>College</Text>
            <Text style={styles.infoValue}>
              {verificationStatus?.college_name || 'G. H. Raisoni College of Engineering, Nagpur'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID Card Status</Text>
            <View style={styles.statusPill}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={styles.statusPillText}>Verified</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Biometric Enrollment</Text>
            <View style={styles.statusPill}>
              <Ionicons name="finger-print" size={14} color="#10B981" />
              <Text style={styles.statusPillText}>ArcFace Active</Text>
            </View>
          </View>
        </View>

        {/* Unlocked Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Unlocked Capabilities</Text>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Feather name="briefcase" size={18} color="#F59E0B" />
            </View>
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureHeading}>Register & Join Companies</Text>
              <Text style={styles.featureSub}>Link your internship organization for official tracking</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Feather name="map-pin" size={18} color="#F59E0B" />
            </View>
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureHeading}>Biometric Attendance</Text>
              <Text style={styles.featureSub}>Mark daily presence with instant live face recognition</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Feather name="file-text" size={18} color="#F59E0B" />
            </View>
            <View style={styles.featureTextWrap}>
              <Text style={styles.featureHeading}>Certified Reports</Text>
              <Text style={styles.featureSub}>Generate attendance verification reports for your college</Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleEnterDashboard}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
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
  celebrationSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 28,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  credentialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    maxWidth: '65%',
    textAlign: 'right',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  featuresSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  featuresTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextWrap: {
    flex: 1,
  },
  featureHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  featureSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
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
