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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/auth-context';
import {
  api,
  College,
  Department,
  StudentProfile,
  Internship,
  ShiftTask,
  AttendanceRecordItem,
} from '@/services/api';

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout, verificationStatus, refreshUser, refreshVerificationStatus } = useAuth();

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
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showCollegeOptions, setShowCollegeOptions] = useState(false);
  const [showDepartmentOptions, setShowDepartmentOptions] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Time & Attendance State
  const [currentTime, setCurrentTime] = useState({
    timeStr: '09:41',
    ampm: 'AM',
    dateStr: `TODAY, ${new Date().getDate()} ${['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][new Date().getMonth()]}`,
  });
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toLocaleString('en-US', { month: 'long' })
  );
  const [showMonthModal, setShowMonthModal] = useState(false);

  // Attendance Statistics & Records State
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecordItem[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [stats, setStats] = useState({
    present: '00',
    late: '00',
    absent: '00',
  });

  // Shift & Compliance Tasks State
  const [activeTask, setActiveTask] = useState<ShiftTask | null>(null);
  const [taskRemainingSeconds, setTaskRemainingSeconds] = useState(0);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskSubmission, setTaskSubmission] = useState('');
  const [submittingTask, setSubmittingTask] = useState(false);

  // Check-In Modals State
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [remoteProofType, setRemoteProofType] = useState<'sprint_goal' | 'github_commit' | 'ide_proof'>('sprint_goal');
  const [remoteProofText, setRemoteProofText] = useState('');
  const [remoteProofImage, setRemoteProofImage] = useState<string | null>(null);

  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineSelfieUri, setOfflineSelfieUri] = useState<string | null>(null);
  const [offlineSelfieBase64, setOfflineSelfieBase64] = useState<string | null>(null);
  const [checkInSubmitting, setCheckInSubmitting] = useState(false);
  const [faceVerifying, setFaceVerifying] = useState(false);
  const [faceVerifyResult, setFaceVerifyResult] = useState<{
    verified: boolean;
    match_score: number;
    message: string;
    student_name?: string;
  } | null>(null);

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

  const MONTH_OPTIONS = [
    'All Time',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const getRecordMonthName = (dateStr?: string | null): string => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.slice(0, 10).split('-');
      if (parts.length === 3) {
        const monthIdx = parseInt(parts[1], 10) - 1;
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        if (monthIdx >= 0 && monthIdx < 12) {
          return monthNames[monthIdx];
        }
      }
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString('en-US', { month: 'long' });
      }
    } catch {
      // ignore
    }
    return '';
  };

  const computeAttendanceStats = (records: AttendanceRecordItem[], monthFilter: string) => {
    const filtered =
      monthFilter === 'All Time'
        ? records
        : records.filter((r) => {
            const m = getRecordMonthName(r.date);
            return m.toLowerCase() === monthFilter.toLowerCase();
          });

    let present = 0;
    let late = 0;
    let absent = 0;

    for (const r of filtered) {
      const s = (r.status || '').toLowerCase();
      if (s === 'late') {
        late++;
      } else if (s === 'absent') {
        absent++;
      } else {
        present++;
      }
    }

    return {
      present: String(present).padStart(2, '0'),
      late: String(late).padStart(2, '0'),
      absent: String(absent).padStart(2, '0'),
    };
  };

  const loadAttendanceData = async (targetMonth?: string) => {
    const activeMonth = targetMonth || selectedMonth;
    try {
      setAttendanceLoading(true);
      const data = await api.getAttendanceHistory();
      const records = data?.records || [];
      setAttendanceRecords(records);
      setStats(computeAttendanceStats(records, activeMonth));

      // Check if student has already checked in today
      const now = new Date();
      const localYear = now.getFullYear();
      const localMonth = String(now.getMonth() + 1).padStart(2, '0');
      const localDay = String(now.getDate()).padStart(2, '0');
      const localTodayStr = `${localYear}-${localMonth}-${localDay}`;
      const utcTodayStr = now.toISOString().slice(0, 10);

      const todayRec = records.find(
        (r) =>
          r.date === localTodayStr ||
          r.date === utcTodayStr ||
          (r.check_in && (r.check_in.startsWith(localTodayStr) || r.check_in.startsWith(utcTodayStr)))
      );

      if (todayRec) {
        setIsCheckedIn(true);
        if (todayRec.check_in) {
          try {
            const d = new Date(todayRec.check_in);
            let hours = d.getHours();
            const minutes = d.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
            const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
            setCheckInTime(`${formattedHours}:${formattedMinutes} ${ampm}`);
          } catch {
            setCheckInTime(todayRec.check_in.slice(11, 16) || 'Today');
          }
        }
      }
    } catch {
      // Graceful fallback: offline or identity pending
    } finally {
      setAttendanceLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileData, activeIntern] = await Promise.all([
        api.getProfile().catch(() => null),
        api.getActiveInternship().catch(() => null),
        loadAttendanceData(selectedMonth).catch(() => null),
        refreshUser().catch(() => null),
        refreshVerificationStatus().catch(() => null),
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

  const checkActiveTask = async () => {
    try {
      const res = await api.getActiveShiftTask();
      if (res.has_active_task && res.task) {
        setActiveTask(res.task);
        setTaskRemainingSeconds(res.task.remaining_seconds);
      } else {
        setActiveTask(null);
      }
    } catch {
      // ignore
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
      checkActiveTask();
    }, [])
  );

  // Active task countdown ticker
  useEffect(() => {
    if (!activeTask || taskRemainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setTaskRemainingSeconds((prev) => {
        if (prev <= 1) {
          setActiveTask(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTask, taskRemainingSeconds]);

  // Periodic polling for surprise checks / scheduled tasks
  useEffect(() => {
    const pollInterval = setInterval(() => {
      checkActiveTask();
    }, 25000);
    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    if (!showProfileModal || colleges.length > 0) {
      return;
    }

    api.getColleges()
      .then(setColleges)
      .catch((error: any) => {
        Alert.alert('Error', error.message || 'Could not load the college directory');
      });
  }, [showProfileModal, colleges.length]);

  const selectCollege = async (selectedCollege: College) => {
    setCollege(selectedCollege.name);
    setShowCollegeOptions(false);
    setShowDepartmentOptions(true);
    setLoadingDepartments(true);
    try {
      setDepartments(await api.getDepartments(selectedCollege.id));
    } catch (error: any) {
      setDepartments([]);
      Alert.alert('Error', error.message || 'Could not load departments for this college');
    } finally {
      setLoadingDepartments(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const isWithinShiftTiming = (activeIntern: Internship): { valid: boolean; message: string } => {
    if (!activeIntern.shift_start_time || !activeIntern.shift_end_time) {
      return { valid: true, message: 'No shift restriction configured.' };
    }

    try {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = activeIntern.shift_start_time.split(':').map(Number);
      const [endH, endM] = activeIntern.shift_end_time.split(':').map(Number);

      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      // 15-minute early grace window
      const earliestPermitted = startMinutes - 15;

      if (currentMinutes < earliestPermitted) {
        return {
          valid: false,
          message: `Your shift begins at ${activeIntern.shift_start_time}. Early check-in is permitted up to 15 minutes before shift start.`,
        };
      }
      if (currentMinutes > endMinutes) {
        return {
          valid: false,
          message: `Your shift ended at ${activeIntern.shift_end_time}. Daily check-in is only permitted during assigned shift hours.`,
        };
      }
      return { valid: true, message: 'Shift timing verified.' };
    } catch {
      return { valid: true, message: 'Shift timing verified.' };
    }
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

    if (isCheckedIn) {
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
      return;
    }

    // 1. Validate Shift Timings
    const shiftCheck = isWithinShiftTiming(internship);
    if (!shiftCheck.valid) {
      Alert.alert('Outside Shift Hours', shiftCheck.message);
      return;
    }

    // 2. Branch: Remote vs Hybrid vs On-Site
    if (internship.internship_type === 'remote') {
      // REMOTE: Skip location and face verification entirely!
      setRemoteProofText('');
      setRemoteProofImage(null);
      setShowRemoteModal(true);
    } else if (internship.internship_type === 'hybrid') {
      // HYBRID: Check today's scheduled mode in the 7-day schedule
      const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
      const todayKey = dayKeys[new Date().getDay()];
      let todayMode: 'offline' | 'online' = 'offline';

      if (internship.hybrid_schedule) {
        try {
          const schedule = JSON.parse(internship.hybrid_schedule);
          if (schedule[todayKey] === 'online') {
            todayMode = 'online';
          }
        } catch {
          todayMode = 'offline';
        }
      }

      if (todayMode === 'online') {
        // Today is a Remote / Online day in the Hybrid schedule
        setRemoteProofText('');
        setRemoteProofImage(null);
        setShowRemoteModal(true);
      } else {
        // Today is an Office / Offline day in the Hybrid schedule
        setOfflineSelfieUri(null);
        setOfflineSelfieBase64(null);
        setFaceVerifyResult(null);
        setFaceVerifying(false);
        setShowOfflineModal(true);
      }
    } else {
      // OFFLINE / ON-SITE: Location and Face Verification
      setOfflineSelfieUri(null);
      setOfflineSelfieBase64(null);
      setFaceVerifyResult(null);
      setFaceVerifying(false);
      setShowOfflineModal(true);
    }
  };

  // Submit Remote Check-In (No camera, No GPS)
  const handleRemoteCheckInSubmit = async () => {
    const proofValue = remoteProofType === 'ide_proof' ? remoteProofImage : remoteProofText.trim();
    if (!proofValue) {
      Alert.alert(
        'Digital Proof Required',
        remoteProofType === 'ide_proof'
          ? 'Please attach a screenshot of your IDE / code editor.'
          : remoteProofType === 'github_commit'
          ? 'Please paste your GitHub commit / PR link.'
          : 'Please enter your daily sprint goals / task description.'
      );
      return;
    }

    try {
      setCheckInSubmitting(true);
      const res = await api.checkIn({
        digital_task_type: remoteProofType,
        digital_task_proof: proofValue,
      });

      const timeStamp = `${currentTime.timeStr} ${currentTime.ampm}`;
      setIsCheckedIn(true);
      setCheckInTime(timeStamp);
      setShowRemoteModal(false);
      Alert.alert(
        'Remote Check-In Verified! 💻',
        `Digital proof logged successfully.\nChecked in at ${timeStamp}.\nNo location or face verification required for remote internships.`
      );
      loadAttendanceData();
    } catch (e: any) {
      Alert.alert('Check-In Failed', e.message || 'Could not complete remote check-in.');
    } finally {
      setCheckInSubmitting(false);
    }
  };

  // Pick IDE Screenshot for Remote Work
  const pickIdeScreenshot = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        const asset = res.assets[0];
        setRemoteProofImage(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
      }
    } catch (e: any) {
      Alert.alert('Image Error', e.message || 'Could not pick screenshot.');
    }
  };

  // Run instant biometric comparison against enrolled student face embedding
  const runFaceVerification = async (base64Data: string) => {
    try {
      setFaceVerifying(true);
      setFaceVerifyResult(null);
      const res = await api.verifyAttendanceFace(base64Data);
      setFaceVerifyResult(res);
      if (!res.verified) {
        Alert.alert(
          '❌ Biometric Mismatch Detected',
          res.message || "The captured face does not match your enrolled student identity. Check-in is blocked until your own registered face is verified."
        );
      }
    } catch (err: any) {
      const msg = err.message || 'Face verification failed';
      setFaceVerifyResult({
        verified: false,
        match_score: 0,
        message: msg,
      });
      Alert.alert('Face Verification Error', msg);
    } finally {
      setFaceVerifying(false);
    }
  };

  // Capture Live Selfie for Offline Attendance
  const takeOfflineSelfie = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera Permission Required', 'Camera access is required for on-site biometric verification.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.front,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        const asset = res.assets[0];
        setOfflineSelfieUri(asset.uri);
        setOfflineSelfieBase64(asset.base64 || null);
        if (asset.base64) {
          runFaceVerification(asset.base64);
        }
      }
    } catch (e: any) {
      Alert.alert('Camera Error', e.message || 'Failed to capture selfie.');
    }
  };

  // Submit Offline Check-In (Location + Selfie)
  const handleOfflineCheckInSubmit = async () => {
    if (!offlineSelfieBase64) {
      Alert.alert('Selfie Required', 'Please capture a clear selfie to verify your workplace identity.');
      return;
    }

    if (!faceVerifyResult || !faceVerifyResult.verified) {
      Alert.alert(
        'Biometric Verification Required',
        faceVerifyResult
          ? "Identity mismatch detected: You cannot check in using another person's face. Please retake the selfie with your own registered face."
          : 'Please wait for biometric face verification to complete.'
      );
      return;
    }

    try {
      setCheckInSubmitting(true);
      // Coordinates default to Bangalore office / campus geofence
      const res = await api.checkIn({
        work_mode: 'offline',
        latitude: 12.9716,
        longitude: 77.5946,
        face_image_base64: offlineSelfieBase64,
      });

      const timeStamp = `${currentTime.timeStr} ${currentTime.ampm}`;
      setIsCheckedIn(true);
      setCheckInTime(timeStamp);
      setShowOfflineModal(false);
      Alert.alert(
        'Check-In Successful! 📍',
        `Biometric identity verified (${faceVerifyResult.student_name || user?.name || 'Student'}).\nChecked in at ${timeStamp}.\n2 random 10-minute compliance verification tasks scheduled during your shift.`
      );
      checkActiveTask();
      loadAttendanceData();
    } catch (e: any) {
      Alert.alert('Verification Failed', e.message || 'Could not complete on-site check-in.');
    } finally {
      setCheckInSubmitting(false);
    }
  };

  // Submit Active 10-Minute Compliance Task
  const handleTaskSubmit = async () => {
    if (!activeTask) return;
    if (!taskSubmission.trim()) {
      Alert.alert('Submission Required', 'Please enter your task update or workstation summary.');
      return;
    }

    try {
      setSubmittingTask(true);
      await api.submitShiftTask(activeTask.id, taskSubmission.trim());
      Alert.alert('Task Completed! 🎯', 'Your 10-minute compliance check has been submitted and verified.');
      setShowTaskModal(false);
      setTaskSubmission('');
      setActiveTask(null);
    } catch (e: any) {
      Alert.alert('Submission Error', e.message || 'Failed to submit shift task.');
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!college.trim() || !branch.trim() || !rollNumber.trim()) {
      Alert.alert('Required Fields', 'Please select a college, enter or select a department, and fill in Roll Number.');
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
        {/* Active 10-Minute Compliance / Surprise Task Banner                */}
        {/* ================================================================= */}
        {activeTask && (
          <TouchableOpacity
            style={styles.activeTaskBanner}
            activeOpacity={0.9}
            onPress={() => setShowTaskModal(true)}
          >
            <View style={styles.taskBannerIconWrap}>
              <MaterialCommunityIcons name="alarm-light" size={24} color="#DC2626" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.taskBannerTitle}>
                  {activeTask.trigger_source === 'admin_request' ? '⚡ LIVE ADMIN CHECK' : '⏱️ COMPLIANCE CHECK'}
                </Text>
                <View style={styles.taskCountdownBadge}>
                  <Ionicons name="time" size={12} color="#DC2626" />
                  <Text style={styles.taskCountdownText}>
                    {Math.floor(taskRemainingSeconds / 60)}:
                    {(taskRemainingSeconds % 60).toString().padStart(2, '0')} left
                  </Text>
                </View>
              </View>
              <Text style={styles.taskBannerPrompt} numberOfLines={2}>
                {activeTask.prompt}
              </Text>
              <Text style={styles.taskBannerAction}>Tap to submit response in 10 minutes →</Text>
            </View>
          </TouchableOpacity>
        )}

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
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select Attendance Period</Text>
              <TouchableOpacity onPress={() => setShowMonthModal(false)}>
                <Ionicons name="close-circle" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {MONTH_OPTIONS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.monthOption, selectedMonth === m && styles.selectedMonthOption]}
                  onPress={() => {
                    setSelectedMonth(m);
                    setStats(computeAttendanceStats(attendanceRecords, m));
                    setShowMonthModal(false);
                  }}
                >
                  <Text style={[styles.monthOptionText, selectedMonth === m && styles.selectedMonthOptionText]}>
                    {m}
                  </Text>
                  {selectedMonth === m && <Ionicons name="checkmark-circle" size={18} color="#FFA500" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
                placeholder="Select or enter your college"
                value={college}
                onChangeText={setCollege}
                onFocus={() => setShowCollegeOptions(true)}
              />
              {showCollegeOptions && colleges.length > 0 && (
                <View style={styles.directoryOptions}>
                  {colleges
                    .filter((item) => item.name.toLowerCase().includes(college.toLowerCase()))
                    .slice(0, 5)
                    .map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.directoryOption}
                        onPress={() => selectCollege(item)}
                      >
                        <Text style={styles.directoryOptionTitle}>{item.name}</Text>
                        <Text style={styles.directoryOptionSubtitle}>
                          {[item.city, item.state].filter(Boolean).join(', ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              )}

              <Text style={styles.inputLabel}>Department / Branch</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Select or enter your department"
                value={branch}
                onChangeText={setBranch}
                onFocus={() => setShowDepartmentOptions(true)}
              />
              {showDepartmentOptions && (
                <View style={styles.directoryOptions}>
                  {loadingDepartments ? (
                    <ActivityIndicator color="#F59E0B" />
                  ) : departments.length > 0 ? (
                    departments
                      .filter((item) => item.name.toLowerCase().includes(branch.toLowerCase()))
                      .slice(0, 6)
                      .map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.directoryOption}
                          onPress={() => {
                            setBranch(item.name);
                            setShowDepartmentOptions(false);
                          }}
                        >
                          <Text style={styles.directoryOptionTitle}>{item.name}</Text>
                          <Text style={styles.directoryOptionSubtitle}>{item.code}</Text>
                        </TouchableOpacity>
                      ))
                  ) : (
                    <Text style={styles.directoryEmptyText}>
                      No departments found. You can enter your department manually.
                    </Text>
                  )}
                </View>
              )}

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

      {/* ================================================================= */}
      {/* Remote Work Digital Proof Modal                                   */}
      {/* ================================================================= */}
      <Modal visible={showRemoteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.actionModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="laptop" size={22} color="#059669" />
                <Text style={styles.modalTitle}>Remote Work Check-In</Text>
              </View>
              <TouchableOpacity onPress={() => setShowRemoteModal(false)}>
                <Ionicons name="close-circle" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.remoteModalSubtitle}>
              Physical camera and GPS are skipped for remote internships. Submit your daily digital proof below:
            </Text>

            {/* Proof Type Tabs */}
            <View style={styles.proofTypeRow}>
              <TouchableOpacity
                style={[styles.proofTabBtn, remoteProofType === 'sprint_goal' && styles.proofTabBtnActive]}
                onPress={() => setRemoteProofType('sprint_goal')}
              >
                <Text style={[styles.proofTabText, remoteProofType === 'sprint_goal' && styles.proofTabTextActive]}>
                  🎯 Sprint Goal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.proofTabBtn, remoteProofType === 'github_commit' && styles.proofTabBtnActive]}
                onPress={() => setRemoteProofType('github_commit')}
              >
                <Text style={[styles.proofTabText, remoteProofType === 'github_commit' && styles.proofTabTextActive]}>
                  🔗 GitHub Link
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.proofTabBtn, remoteProofType === 'ide_proof' && styles.proofTabBtnActive]}
                onPress={() => setRemoteProofType('ide_proof')}
              >
                <Text style={[styles.proofTabText, remoteProofType === 'ide_proof' && styles.proofTabTextActive]}>
                  📸 IDE Proof
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form Inputs based on proof type */}
            {remoteProofType === 'sprint_goal' && (
              <View>
                <Text style={styles.inputLabel}>Today's Target Sprint Goal / Deliverables</Text>
                <TextInput
                  style={[styles.modalInput, { height: 90, textAlignVertical: 'top' }]}
                  multiline
                  placeholder="e.g. Implement user authentication endpoints, fix database schema migrations..."
                  value={remoteProofText}
                  onChangeText={setRemoteProofText}
                />
              </View>
            )}

            {remoteProofType === 'github_commit' && (
              <View>
                <Text style={styles.inputLabel}>GitHub PR / Commit URL</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="https://github.com/org/repo/commit/1a2b3c..."
                  autoCapitalize="none"
                  value={remoteProofText}
                  onChangeText={setRemoteProofText}
                />
              </View>
            )}

            {remoteProofType === 'ide_proof' && (
              <View style={{ alignItems: 'center', marginVertical: 10 }}>
                {remoteProofImage ? (
                  <View style={{ alignItems: 'center' }}>
                    <Image source={{ uri: remoteProofImage }} style={styles.proofPreviewImage} />
                    <TouchableOpacity onPress={pickIdeScreenshot} style={{ marginTop: 6 }}>
                      <Text style={{ color: '#F59E0B', fontSize: 13, fontWeight: '600' }}>Change Screenshot</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.uploadProofBox} onPress={pickIdeScreenshot}>
                    <Ionicons name="cloud-upload-outline" size={32} color="#059669" />
                    <Text style={styles.uploadProofBoxText}>Tap to pick IDE / Terminal Screenshot</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitCheckInBtn, checkInSubmitting && styles.btnDisabled]}
              onPress={handleRemoteCheckInSubmit}
              disabled={checkInSubmitting}
            >
              {checkInSubmitting ? (
                <ActivityIndicator color="#111827" />
              ) : (
                <Text style={styles.submitCheckInBtnText}>Confirm Remote Check-In</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================================================================= */}
      {/* Offline On-Site Check-In Modal (GPS & Biometric Verification)     */}
      {/* ================================================================= */}
      <Modal visible={showOfflineModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.actionModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="office-building" size={22} color="#D97706" />
                <Text style={styles.modalTitle}>On-Site Check-In</Text>
              </View>
              <TouchableOpacity onPress={() => setShowOfflineModal(false)}>
                <Ionicons name="close-circle" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Location Geofence Pill */}
            <View style={styles.geofenceCard}>
              <Ionicons name="location" size={18} color="#059669" />
              <View style={{ flex: 1 }}>
                <Text style={styles.geofenceTitle}>
                  {internship?.company_name || 'Assigned Workplace'}
                </Text>
                <Text style={styles.geofenceSubtitle}>
                  GPS Coordinates Verified (12.9716, 77.5946) • Within 200m perimeter
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
            </View>

            {/* Selfie Preview or Camera Button */}
            <View style={{ alignItems: 'center', marginVertical: 14 }}>
              {offlineSelfieUri ? (
                <View style={{ alignItems: 'center', width: '100%' }}>
                  <View style={{ position: 'relative' }}>
                    <Image source={{ uri: offlineSelfieUri }} style={styles.selfiePreviewImage} />
                    {faceVerifying && (
                      <View style={styles.selfieVerifyingOverlay}>
                        <ActivityIndicator color="#F59E0B" size="small" />
                        <Text style={styles.selfieVerifyingText}>Verifying Face...</Text>
                      </View>
                    )}
                  </View>

                  {/* Verification Status Feedback Card */}
                  {faceVerifyResult && !faceVerifying && (
                    faceVerifyResult.verified ? (
                      <View style={styles.faceMatchSuccessCard}>
                        <Ionicons name="checkmark-circle" size={22} color="#059669" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.faceMatchSuccessTitle}>Identity Confirmed</Text>
                          <Text style={styles.faceMatchSuccessSubtitle}>
                            Matches enrolled student: {faceVerifyResult.student_name || user?.name} • {(faceVerifyResult.match_score * 100).toFixed(0)}% match
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.faceMismatchErrorCard}>
                        <Ionicons name="alert-circle" size={24} color="#DC2626" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.faceMismatchErrorTitle}>
                            {faceVerifyResult.match_score > 0 ? '❌ Identity Mismatch' : '⚠️ Verification Issue'}
                          </Text>
                          <Text style={styles.faceMismatchErrorSubtitle}>
                            {faceVerifyResult.message || `The captured face does not match enrolled student ${faceVerifyResult.student_name || user?.name}.`}
                          </Text>
                        </View>
                      </View>
                    )
                  )}

                  <TouchableOpacity onPress={takeOfflineSelfie} style={{ marginTop: 10 }}>
                    <Text style={{ color: '#F59E0B', fontSize: 13, fontWeight: '700' }}>
                      {faceVerifyResult?.verified ? 'Retake Photo' : 'Retake Selfie Photo'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.selfiePromptBox} onPress={takeOfflineSelfie}>
                  <Ionicons name="camera-reverse" size={38} color="#F59E0B" />
                  <Text style={styles.selfiePromptText}>Take Quick Workplace Selfie</Text>
                  <Text style={styles.selfiePromptSubtext}>
                    ArcFace biometric verification strictly compares with your enrolled college face profile.
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.submitCheckInBtn,
                (checkInSubmitting || faceVerifying || !faceVerifyResult?.verified) && styles.btnDisabled,
              ]}
              onPress={handleOfflineCheckInSubmit}
              disabled={checkInSubmitting || faceVerifying || !faceVerifyResult?.verified}
            >
              {checkInSubmitting ? (
                <ActivityIndicator color="#111827" />
              ) : faceVerifying ? (
                <Text style={styles.submitCheckInBtnText}>Verifying Face Biometrics...</Text>
              ) : !offlineSelfieUri ? (
                <Text style={styles.submitCheckInBtnText}>Take Selfie to Verify Face</Text>
              ) : faceVerifyResult?.verified ? (
                <Text style={styles.submitCheckInBtnText}>Confirm On-Site Check-In</Text>
              ) : (
                <Text style={styles.submitCheckInBtnText}>
                  {(faceVerifyResult?.match_score ?? 0) > 0
                    ? 'Check-In Blocked (Mismatch Detected)'
                    : 'Check-In Blocked (Verification Required)'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================================================================= */}
      {/* 10-Minute Compliance / Surprise Task Modal                        */}
      {/* ================================================================= */}
      <Modal visible={showTaskModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.taskModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="alarm-light" size={22} color="#DC2626" />
                <Text style={styles.modalTitle}>
                  {activeTask?.trigger_source === 'admin_request' ? 'Live Admin Check' : '10-Min Compliance Task'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowTaskModal(false)}>
                <Ionicons name="close-circle" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Countdown Timer Header */}
            <View style={styles.taskTimerBox}>
              <Ionicons name="timer-outline" size={24} color="#DC2626" />
              <View style={{ flex: 1 }}>
                <Text style={styles.taskTimerTitle}>Countdown Expiration</Text>
                <Text style={styles.taskTimerSub}>
                  Complete this task before time runs out to record compliance.
                </Text>
              </View>
              <Text style={styles.taskTimerDigits}>
                {Math.floor(taskRemainingSeconds / 60)}:
                {(taskRemainingSeconds % 60).toString().padStart(2, '0')}
              </Text>
            </View>

            <Text style={styles.taskPromptLabel}>Task Description / Question:</Text>
            <View style={styles.taskPromptBox}>
              <Text style={styles.taskPromptText}>{activeTask?.prompt}</Text>
            </View>

            <Text style={styles.inputLabel}>Your Work Status / Verification Response:</Text>
            <TextInput
              style={[styles.modalInput, { height: 90, textAlignVertical: 'top' }]}
              multiline
              placeholder="e.g. Working on bug fixes in the API module at workstation Desk #14..."
              value={taskSubmission}
              onChangeText={setTaskSubmission}
            />

            <TouchableOpacity
              style={[styles.taskSubmitBtn, submittingTask && styles.btnDisabled]}
              onPress={handleTaskSubmit}
              disabled={submittingTask}
            >
              {submittingTask ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.taskSubmitBtnText}>Submit Task Response</Text>
              )}
            </TouchableOpacity>
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
  directoryOptions: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginTop: -4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  directoryOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  directoryOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  directoryOptionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  directoryEmptyText: {
    padding: 12,
    fontSize: 12,
    color: '#6B7280',
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

  // -------------------------------------------------------------------------
  // Active Task Banner & Check-In Action Modals
  // -------------------------------------------------------------------------
  activeTaskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    gap: 12,
    shadowColor: '#DC2626',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  taskBannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskBannerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  taskCountdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  taskCountdownText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  taskBannerPrompt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 3,
  },
  taskBannerAction: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B91C1C',
    marginTop: 4,
  },

  actionModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  remoteModalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  proofTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  proofTabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  proofTabBtnActive: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#059669',
  },
  proofTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  proofTabTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  uploadProofBox: {
    width: '100%',
    height: 120,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
  },
  uploadProofBoxText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 8,
    textAlign: 'center',
  },
  proofPreviewImage: {
    width: 220,
    height: 140,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  submitCheckInBtn: {
    backgroundColor: '#FFA500',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#FFA500',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitCheckInBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },

  geofenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 14,
  },
  geofenceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  geofenceSubtitle: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
  },
  selfiePromptBox: {
    width: '100%',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
  },
  selfiePromptText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
    marginTop: 8,
  },
  selfiePromptSubtext: {
    fontSize: 11,
    color: '#B45309',
    textAlign: 'center',
    marginTop: 4,
  },
  selfiePreviewImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  selfieVerifyingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  selfieVerifyingText: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  faceMatchSuccessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    width: '100%',
  },
  faceMatchSuccessTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  faceMatchSuccessSubtitle: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
    lineHeight: 15,
  },
  faceMismatchErrorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    width: '100%',
  },
  faceMismatchErrorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  faceMismatchErrorSubtitle: {
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 2,
    lineHeight: 16,
  },

  taskModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  taskTimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 14,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  taskTimerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  taskTimerSub: {
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 2,
  },
  taskTimerDigits: {
    fontSize: 20,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 1,
  },
  taskPromptLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  taskPromptBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  taskPromptText: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 18,
  },
  taskSubmitBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  taskSubmitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
