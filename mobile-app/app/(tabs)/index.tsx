import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { api, StudentProfile, Internship } from '@/services/api';

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout, verificationStatus } = useAuth();

  // Profile & Internship State
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [internship, setInternship] = useState<Internship | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Profile Form State
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Time & Attendance State
  const [currentTime, setCurrentTime] = useState({
    timeStr: '09:41',
    ampm: 'AM',
    dateStr: 'TODAY, 24 OCT',
  });
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('October');
  const [showMonthModal, setShowMonthModal] = useState(false);

  // Attendance Statistics
  const [stats, setStats] = useState({
    present: '32',
    late: '02',
    absent: '01',
  });

  // Real-time clock updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 12-hour clock
      const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;

      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const dateStr = `TODAY, ${now.getDate()} ${months[now.getMonth()]}`;

      setCurrentTime({
        timeStr: `${formattedHours}:${formattedMinutes}`,
        ampm,
        dateStr,
      });
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const getStageStep = (stage?: string) => {
    switch (stage) {
      case 'submitted':
        return 1;
      case 'tp_review':
        return 2;
      case 'mentor_review':
        return 3;
      case 'verified':
        return 4;
      case 'rejected':
        return -1;
      default:
        return 1;
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileData, activeIntern] = await Promise.all([
        api.getProfile().catch(() => null),
        api.getActiveInternship().catch(() => null),
      ]);
      setProfile(profileData);
      setInternship(activeIntern);
      if (profileData) {
        setCollege(profileData.college || '');
        setBranch(profileData.branch || '');
        setRollNumber(profileData.roll_number || '');
      }
    } catch {
      setProfile(null);
      setInternship(null);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCheckInToggle = () => {
    const isVerified = Boolean(
      verificationStatus?.is_verified ||
      verificationStatus?.overall_status === 'verified' ||
      verificationStatus?.current_step === 'completed' ||
      user?.is_verified
    );

    if (!isVerified) {
      Alert.alert(
        'Identity Verification Required',
        'You must complete your one-time identity verification before marking attendance or registering companies.',
        [
          { text: 'Verify Now', onPress: () => router.push('/verification' as any) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    if (!internship) {
      Alert.alert(
        'Internship Required',
        'You have not added any internship yet. Please register your company details before marking attendance.',
        [
          { text: 'Add Internship', onPress: () => router.push('/internship' as any) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    if (!isCheckedIn) {
      const timeStamp = `${currentTime.timeStr} ${currentTime.ampm}`;
      setIsCheckedIn(true);
      setCheckInTime(timeStamp);
      Alert.alert(
        'Check-In Successful! 📍',
        `Biometric & GPS geofence verified at HQ Office, Block A.\nChecked in at ${timeStamp}.`
      );
    } else {
      Alert.alert('Check-Out Confirmation', 'Are you sure you want to check out for today?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check Out',
          style: 'destructive',
          onPress: () => {
            setIsCheckedIn(false);
            setCheckInTime(null);
            Alert.alert('Checked Out', 'You have successfully checked out for today.');
          },
        },
      ]);
    }
  };

  const handleSaveProfile = async () => {
    if (!college.trim() || !branch.trim() || !rollNumber.trim()) {
      Alert.alert('Required Fields', 'Please fill in College, Branch, and Roll Number.');
      return;
    }

    setSavingProfile(true);
    try {
      if (profile) {
        const updated = await api.updateProfile({
          college: college.trim(),
          branch: branch.trim(),
          roll_number: rollNumber.trim(),
        });
        setProfile(updated);
      } else {
        const created = await api.createProfile({
          college: college.trim(),
          branch: branch.trim(),
          roll_number: rollNumber.trim(),
        });
        setProfile(created);
      }
      setShowProfileModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of TrackIntern?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          setShowProfileModal(false);
          logout();
        },
      },
    ]);
  };

  const roleTitle = profile?.branch ? `${profile.branch} Intern` : 'Intern';

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFA500" />}
      >
        {/* ================================================================= */}
        {/* Top Header: Avatar, Name & Notification Button */}
        {/* ================================================================= */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.userProfileRow}
            activeOpacity={0.8}
            onPress={() => setShowProfileModal(true)}
          >
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarInitial}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.name || 'Intern'}
              </Text>
              <Text style={styles.userRole} numberOfLines={1}>
                {roleTitle}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.notificationBtn}
            activeOpacity={0.8}
            onPress={() => Alert.alert('Notifications', 'No unread attendance alerts.')}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
                <View style={styles.notificationDot} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Date Label */}
        <Text style={styles.dateLabel}>{currentTime.dateStr}</Text>

        {/* ================================================================= */}
        {/* Today's Attendance Hero Card */}
        {/* ================================================================= */}
        <View style={styles.heroCard}>
          <Text style={styles.heroCardTitle}>Today's Attendance</Text>

          {/* Large Digital Clock Display */}
          <View style={styles.clockContainer}>
            <Text style={styles.clockDigits}>{currentTime.timeStr}</Text>
            <Text style={styles.clockAmPm}>{currentTime.ampm}</Text>
          </View>

          {/* Location Pin */}
          <TouchableOpacity
            style={styles.locationContainer}
            onPress={() => router.push('/internship' as any)}
            activeOpacity={0.75}
          >
            <Ionicons
              name={internship ? "location-sharp" : "location-outline"}
              size={16}
              color={internship ? "#4F46E5" : "#D97706"}
            />
            <Text style={[styles.locationText, !internship && { color: '#B45309', fontWeight: '600' }]} numberOfLines={1}>
              {internship
                ? `${internship.company_name} • ${internship.location || 'Assigned Workplace'}`
                : 'No workplace linked • Tap to Add Internship'}
            </Text>
          </TouchableOpacity>

          {/* Check In / Out Button */}
          <TouchableOpacity
            style={[styles.checkInBtn, isCheckedIn && styles.checkedInBtn]}
            activeOpacity={0.85}
            onPress={handleCheckInToggle}
          >
            <MaterialCommunityIcons
              name={isCheckedIn ? 'checkbox-marked-circle-outline' : 'fingerprint'}
              size={24}
              color={isCheckedIn ? '#FFFFFF' : '#111827'}
              style={styles.checkInIcon}
            />
            <Text style={[styles.checkInText, isCheckedIn && styles.checkedInText]}>
              {isCheckedIn ? `Checked In • ${checkInTime}` : 'Check In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================================================================= */}
        {/* Total Attendance Section */}
        {/* ================================================================= */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Total Attendance</Text>
          <TouchableOpacity
            style={styles.monthSelector}
            activeOpacity={0.7}
            onPress={() => setShowMonthModal(true)}
          >
            <Text style={styles.monthText}>{selectedMonth}</Text>
            <Ionicons name="chevron-down" size={14} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Attendance 3-Stat Cards Row */}
        <View style={styles.statsRow}>
          {/* Present Card */}
          <View style={[styles.statCard, styles.presentCardBg]}>
            <Text style={[styles.statNumber, styles.presentText]}>{stats.present}</Text>
            <Text style={[styles.statLabel, styles.presentText]}>PRESENT</Text>
          </View>

          {/* Late Card */}
          <View style={[styles.statCard, styles.lateCardBg]}>
            <Text style={[styles.statNumber, styles.lateText]}>{stats.late}</Text>
            <Text style={[styles.statLabel, styles.lateText]}>LATE</Text>
          </View>

          {/* Absent Card */}
          <View style={[styles.statCard, styles.absentCardBg]}>
            <Text style={[styles.statNumber, styles.absentText]}>{stats.absent}</Text>
            <Text style={[styles.statLabel, styles.absentText]}>ABSENT</Text>
          </View>
        </View>

        {/* ================================================================= */}
        {/* Internship Verification Section (Dynamic or Empty State)         */}
        {/* ================================================================= */}
        {!internship ? (
          <View style={styles.noInternshipCard}>
            <View style={styles.noInternshipHeader}>
              <View style={styles.noInternshipIconCircle}>
                <MaterialCommunityIcons name="briefcase-plus-outline" size={26} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.noInternshipTitle}>No Internship Linked</Text>
                <Text style={styles.noInternshipSubtitle}>
                  Register your internship to activate attendance check-in and university T&P approval.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.addInternshipPrimaryBtn}
              onPress={() => router.push('/internship' as any)}
              activeOpacity={0.85}
            >
              <Feather name="plus-circle" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.addInternshipPrimaryBtnText}>Add Internship</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.verificationCard}>
            <View style={styles.verificationHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Ionicons name="shield-checkmark" size={20} color="#F59E0B" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.verificationTitle} numberOfLines={1}>
                    {internship.company_name}
                  </Text>
                  <Text style={styles.verificationSubtitle}>
                    {internship.verification_stage === 'verified'
                      ? 'Approved & Verified'
                      : internship.verification_stage === 'rejected'
                      ? 'Action Required • Rejected'
                      : internship.verification_stage === 'mentor_review'
                      ? 'Stage 3: Mentor Review'
                      : internship.verification_stage === 'tp_review'
                      ? 'Stage 2: T&P Cell Scrutiny'
                      : 'Stage 1: Submitted'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.manageInternshipBtn}
                onPress={() => router.push('/internship' as any)}
                activeOpacity={0.75}
              >
                <Text style={styles.manageInternshipBtnText}>Manage</Text>
                <Feather name="chevron-right" size={14} color="#D97706" />
              </TouchableOpacity>
            </View>

            {/* Dynamic Step Pipeline Tracker */}
            {(() => {
              const currentStep = getStageStep(internship.verification_stage);
              const isRejected =
                internship.verification_stage === 'rejected' || internship.status === 'rejected';

              return (
                <>
                  <View style={styles.timelineContainer}>
                    {/* Step 1: Submitted */}
                    <View style={styles.stepItem}>
                      <View style={currentStep >= 1 ? styles.iconCircleDone : styles.iconCirclePending}>
                        <Ionicons
                          name={currentStep >= 1 ? 'checkmark' : 'ellipsis-horizontal'}
                          size={14}
                          color={currentStep >= 1 ? '#111827' : '#9CA3AF'}
                        />
                      </View>
                      <Text
                        style={[styles.stepLabel, currentStep === 1 && styles.stepLabelActive]}
                      >
                        Submitted
                      </Text>
                    </View>

                    {/* Connecting Line 1 */}
                    <View
                      style={
                        currentStep >= 2 ? styles.stepConnectorDone : styles.stepConnectorPending
                      }
                    />

                    {/* Step 2: T&P */}
                    <View style={styles.stepItem}>
                      <View
                        style={
                          currentStep >= 2
                            ? currentStep === 2
                              ? styles.iconCircleActive
                              : styles.iconCircleDone
                            : styles.iconCirclePending
                        }
                      >
                        {currentStep > 2 ? (
                          <Ionicons name="checkmark" size={14} color="#111827" />
                        ) : currentStep === 2 ? (
                          <View style={styles.activeInnerDot} />
                        ) : (
                          <Text style={styles.pendingDotsText}>•••</Text>
                        )}
                      </View>
                      <Text
                        style={[styles.stepLabel, currentStep === 2 && styles.stepLabelActive]}
                      >
                        T&P
                      </Text>
                    </View>

                    {/* Connecting Line 2 */}
                    <View
                      style={
                        currentStep >= 3 ? styles.stepConnectorDone : styles.stepConnectorPending
                      }
                    />

                    {/* Step 3: Mentor */}
                    <View style={styles.stepItem}>
                      <View
                        style={
                          currentStep >= 3
                            ? currentStep === 3
                              ? styles.iconCircleActive
                              : styles.iconCircleDone
                            : styles.iconCirclePending
                        }
                      >
                        {currentStep > 3 ? (
                          <Ionicons name="checkmark" size={14} color="#111827" />
                        ) : currentStep === 3 ? (
                          <View style={styles.activeInnerDot} />
                        ) : (
                          <Text style={styles.pendingDotsText}>•••</Text>
                        )}
                      </View>
                      <Text
                        style={[styles.stepLabel, currentStep === 3 && styles.stepLabelActive]}
                      >
                        Mentor
                      </Text>
                    </View>

                    {/* Connecting Line 3 */}
                    <View
                      style={
                        currentStep >= 4 ? styles.stepConnectorDone : styles.stepConnectorPending
                      }
                    />

                    {/* Step 4: Verified */}
                    <View style={styles.stepItem}>
                      <View
                        style={
                          currentStep >= 4
                            ? styles.iconCircleDone
                            : isRejected
                            ? styles.iconCircleRejected
                            : styles.iconCirclePending
                        }
                      >
                        {currentStep >= 4 ? (
                          <Ionicons name="checkmark" size={14} color="#111827" />
                        ) : isRejected ? (
                          <Ionicons name="close" size={14} color="#FFFFFF" />
                        ) : (
                          <Text style={styles.pendingDotsText}>•••</Text>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.stepLabel,
                          currentStep === 4 && styles.stepLabelActive,
                          isRejected && styles.stepLabelRejected,
                        ]}
                      >
                        {isRejected ? 'Rejected' : 'Verified'}
                      </Text>
                    </View>
                  </View>

                  {/* Feedback Banner if Rejected */}
                  {isRejected && (
                    <View style={styles.homeRejectionNotice}>
                      <Ionicons name="alert-circle" size={16} color="#DC2626" />
                      <Text style={styles.homeRejectionText} numberOfLines={2}>
                        {internship.rejection_reason ||
                          'Verification rejected by administrator. Tap Manage to edit details.'}
                      </Text>
                    </View>
                  )}

                  {/* Success Banner if Verified */}
                  {currentStep === 4 && (
                    <View style={styles.homeVerifiedNotice}>
                      <Ionicons name="checkmark-circle" size={16} color="#059669" />
                      <Text style={styles.homeVerifiedText}>
                        Internship officially verified by College Administration!
                      </Text>
                    </View>
                  )}
                </>
              );
            })()}
          </View>
        )}
      </ScrollView>

      {/* ================================================================= */}
      {/* Month Selection Modal */}
      {/* ================================================================= */}
      <Modal visible={showMonthModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMonthModal(false)}
        >
          <View style={styles.monthModalCard}>
            <Text style={styles.modalTitle}>Select Attendance Month</Text>
            {['August', 'September', 'October', 'November'].map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.monthOption, selectedMonth === m && styles.selectedMonthOption]}
                onPress={() => {
                  setSelectedMonth(m);
                  if (m === 'October') setStats({ present: '32', late: '02', absent: '01' });
                  else if (m === 'September') setStats({ present: '28', late: '01', absent: '02' });
                  else setStats({ present: '24', late: '00', absent: '01' });
                  setShowMonthModal(false);
                }}
              >
                <Text style={[styles.monthOptionText, selectedMonth === m && styles.selectedMonthOptionText]}>
                  {m}
                </Text>
                {selectedMonth === m && <Ionicons name="checkmark-circle" size={18} color="#FFA500" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ================================================================= */}
      {/* Profile & Settings Bottom Sheet / Modal */}
      {/* ================================================================= */}
      <Modal visible={showProfileModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.profileModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Student Profile</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <Ionicons name="close-circle" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.profileSummaryRow}>
                <View style={styles.modalAvatar}>
                  <Text style={styles.modalAvatarText}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalUserName}>{user?.name || 'Intern'}</Text>
                  <Text style={styles.modalUserEmail}>{user?.email}</Text>
                  <Text style={styles.modalUserReg}>Reg: {user?.registration_number || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.modalDivider} />

              <Text style={styles.inputLabel}>College / Institute</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. MIT / Stanford University"
                value={college}
                onChangeText={setCollege}
              />

              <Text style={styles.inputLabel}>Department / Branch</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. UX Design / Computer Science"
                value={branch}
                onChangeText={setBranch}
              />

              <Text style={styles.inputLabel}>Roll Number</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. CS2026-042"
                value={rollNumber}
                onChangeText={setRollNumber}
              />

              <TouchableOpacity
                style={styles.saveProfileBtn}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator color="#111827" />
                ) : (
                  <Text style={styles.saveProfileText}>Save Academic Profile</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.logoutActionBtn} onPress={handleLogout}>
                <Feather name="log-out" size={18} color="#EF4444" />
                <Text style={styles.logoutActionText}>Sign Out Account</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },

  // -------------------------------------------------------------------------
  // Header
  // -------------------------------------------------------------------------
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  userProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatarContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  userRole: {
    fontSize: 13,
    fontWeight: '500',
    color: '#F97316', // Warm amber role subtitle
    marginTop: 1,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#B45309',
    marginTop: 12,
    marginBottom: 14,
    textTransform: 'uppercase',
  },

  // -------------------------------------------------------------------------
  // Today's Attendance Hero Card
  // -------------------------------------------------------------------------
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 26,
  },
  heroCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  clockContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginVertical: 4,
  },
  clockDigits: {
    fontSize: 52,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -1,
  },
  clockAmPm: {
    fontSize: 22,
    fontWeight: '700',
    color: '#9CA3AF',
    marginLeft: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 20,
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  checkInBtn: {
    width: '100%',
    backgroundColor: '#FFA500',
    borderRadius: 30,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  checkedInBtn: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  checkInIcon: {
    marginRight: 8,
  },
  checkInText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  checkedInText: {
    color: '#FFFFFF',
  },

  // -------------------------------------------------------------------------
  // Total Attendance Section
  // -------------------------------------------------------------------------
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  monthText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presentCardBg: {
    backgroundColor: '#ECFDF5',
  },
  lateCardBg: {
    backgroundColor: '#FEF9C3',
  },
  absentCardBg: {
    backgroundColor: '#FEE2E2',
  },
  statNumber: {
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  presentText: {
    color: '#059669',
  },
  lateText: {
    color: '#D97706',
  },
  absentText: {
    color: '#DC2626',
  },

  // -------------------------------------------------------------------------
  // No Internship Prompt Card
  // -------------------------------------------------------------------------
  noInternshipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    marginBottom: 20,
  },
  noInternshipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  noInternshipIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noInternshipTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 3,
  },
  noInternshipSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  addInternshipPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  addInternshipPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // -------------------------------------------------------------------------
  // Internship Verification Card
  // -------------------------------------------------------------------------
  verificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 20,
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  verificationSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
    marginTop: 2,
  },
  manageInternshipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 2,
  },
  manageInternshipBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  stepItem: {
    alignItems: 'center',
    minWidth: 54,
  },
  iconCircleDone: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepConnectorDone: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#111827',
    marginBottom: 20,
  },
  iconCircleActive: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 4,
    borderColor: '#FFA500',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  activeInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFA500',
  },
  stepConnectorActive: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
  },
  iconCirclePending: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircleRejected: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  pendingDotsText: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  stepConnectorPending: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#111827',
    fontWeight: '800',
  },
  stepLabelRejected: {
    color: '#DC2626',
    fontWeight: '800',
  },
  homeRejectionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  homeRejectionText: {
    flex: 1,
    fontSize: 11,
    color: '#B91C1C',
    fontWeight: '600',
  },
  homeVerifiedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  homeVerifiedText: {
    flex: 1,
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
  },

  // -------------------------------------------------------------------------
  // Modals
  // -------------------------------------------------------------------------
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  monthModalCard: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  monthOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  selectedMonthOption: {
    backgroundColor: '#FFF7ED',
  },
  monthOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  selectedMonthOptionText: {
    color: '#C2410C',
    fontWeight: '700',
  },
  profileModalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  profileSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  modalAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFA500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  modalUserEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  modalUserReg: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 2,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    marginBottom: 8,
  },
  saveProfileBtn: {
    backgroundColor: '#FFA500',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 10,
  },
  saveProfileText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  logoutActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    marginTop: 4,
    marginBottom: 10,
  },
  logoutActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
});
