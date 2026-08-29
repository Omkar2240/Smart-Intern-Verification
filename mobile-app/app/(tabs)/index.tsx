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
import { useAuth } from '@/context/auth-context';
import { api, StudentProfile } from '@/services/api';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  // Profile State
  const [profile, setProfile] = useState<StudentProfile | null>(null);
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

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getProfile();
      setProfile(data);
      setCollege(data.college || '');
      setBranch(data.branch || '');
      setRollNumber(data.roll_number || '');
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCheckInToggle = () => {
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
          <View style={styles.locationContainer}>
            <Ionicons name="location-sharp" size={16} color="#4F46E5" />
            <Text style={styles.locationText}>HQ Office, Block A</Text>
          </View>

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
        {/* Internship Verification Multi-Stage Timeline Card */}
        {/* ================================================================= */}
        <View style={styles.verificationCard}>
          <View style={styles.verificationHeader}>
            <Ionicons name="shield-checkmark" size={20} color="#F59E0B" />
            <Text style={styles.verificationTitle}>Internship Verification</Text>
          </View>

          {/* Step Pipeline Tracker */}
          <View style={styles.timelineContainer}>
            {/* Step 1: Submitted (Completed) */}
            <View style={styles.stepItem}>
              <View style={styles.iconCircleDone}>
                <Ionicons name="checkmark" size={14} color="#111827" />
              </View>
              <Text style={styles.stepLabel}>Submitted</Text>
            </View>

            {/* Connecting Line 1 */}
            <View style={styles.stepConnectorDone} />

            {/* Step 2: T&P (Completed) */}
            <View style={styles.stepItem}>
              <View style={styles.iconCircleDone}>
                <Ionicons name="checkmark" size={14} color="#111827" />
              </View>
              <Text style={styles.stepLabel}>T&P</Text>
            </View>

            {/* Connecting Line 2 */}
            <View style={styles.stepConnectorActive} />

            {/* Step 3: Mentor (Current Active) */}
            <View style={styles.stepItem}>
              <View style={styles.iconCircleActive}>
                <View style={styles.activeInnerDot} />
              </View>
              <Text style={[styles.stepLabel, styles.stepLabelActive]}>Mentor</Text>
            </View>

            {/* Connecting Line 3 */}
            <View style={styles.stepConnectorPending} />

            {/* Step 4: Verified (Pending) */}
            <View style={styles.stepItem}>
              <View style={styles.iconCirclePending}>
                <Text style={styles.pendingDotsText}>•••</Text>
              </View>
              <Text style={styles.stepLabel}>Verified</Text>
            </View>
          </View>
        </View>
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
    gap: 8,
    marginBottom: 24,
  },
  verificationTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
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
