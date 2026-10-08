import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  KeyboardAvoidingView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

import { api, Internship, InternshipCreatePayload } from '@/services/api';
import { useAuth } from '@/context/auth-context';
import LocationPickerModal, { SelectedLocationResult } from '@/components/LocationPickerModal';

type VerificationStage = 'submitted' | 'tp_review' | 'mentor_review' | 'verified' | 'rejected';

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type DayMode = 'offline' | 'online';

export interface WeeklySchedule {
  mon: DayMode;
  tue: DayMode;
  wed: DayMode;
  thu: DayMode;
  fri: DayMode;
  sat: DayMode;
  sun: DayMode;
}

const DEFAULT_HYBRID_SCHEDULE: WeeklySchedule = {
  mon: 'offline',
  tue: 'offline',
  wed: 'offline',
  thu: 'online',
  fri: 'online',
  sat: 'online',
  sun: 'online',
};

const DAYS_ORDER: { key: DayOfWeek; label: string; full: string }[] = [
  { key: 'mon', label: 'Mon', full: 'Monday' },
  { key: 'tue', label: 'Tue', full: 'Tuesday' },
  { key: 'wed', label: 'Wed', full: 'Wednesday' },
  { key: 'thu', label: 'Thu', full: 'Thursday' },
  { key: 'fri', label: 'Fri', full: 'Friday' },
  { key: 'sat', label: 'Sat', full: 'Saturday' },
  { key: 'sun', label: 'Sun', full: 'Sunday' },
];

function formatHybridSummary(scheduleStr?: string | null): string {
  if (!scheduleStr) return 'Custom Hybrid Schedule';
  try {
    const s = JSON.parse(scheduleStr) as WeeklySchedule;
    const offlineDays: string[] = [];
    const onlineDays: string[] = [];
    DAYS_ORDER.forEach((d) => {
      if (s[d.key] === 'offline') offlineDays.push(d.label);
      else onlineDays.push(d.label);
    });
    if (offlineDays.length === 0) return 'All Online (Remote)';
    if (onlineDays.length === 0) return 'All Offline (Office)';
    return `${offlineDays.join(', ')} (Office) • ${onlineDays.join(', ')} (Remote)`;
  } catch {
    return 'Custom Hybrid Schedule';
  }
}

export default function InternshipManagementScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Location Picker Modal State (Free OSM API)
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [internshipType, setInternshipType] = useState<'on_site' | 'remote' | 'hybrid'>('on_site');
  const [location, setLocation] = useState('');
  const [workplaceLat, setWorkplaceLat] = useState<number | null>(null);
  const [workplaceLng, setWorkplaceLng] = useState<number | null>(null);
  const [locatingCurrent, setLocatingCurrent] = useState(false);
  const [hybridSchedule, setHybridSchedule] = useState<WeeklySchedule>(DEFAULT_HYBRID_SCHEDULE);
  const [supervisorName, setSupervisorName] = useState('');
  const [supervisorEmail, setSupervisorEmail] = useState('');
  const [supervisorPhone, setSupervisorPhone] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stipend, setStipend] = useState('');
  const [shiftStartTime, setShiftStartTime] = useState('09:00');
  const [shiftEndTime, setShiftEndTime] = useState('17:00');
  const [actualHours, setActualHours] = useState('8');
  const [offerLetterUrl, setOfferLetterUrl] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleUseCurrentGpsLocation = async () => {
    try {
      setLocatingCurrent(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please allow location access to auto-detect your office workplace location.'
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setWorkplaceLat(lat);
      setWorkplaceLng(lng);

      // Reverse geocode via OpenStreetMap Nominatim
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'SmartInternVerification/1.0' },
        });
        const data = await res.json();
        if (data && (data.display_name || data.name)) {
          setLocation(data.display_name || data.name);
        } else {
          setLocation(`Office Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
        }
      } catch {
        setLocation(`Office Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
      }

      Alert.alert(
        'Location Detected',
        `Current office location captured:\nLat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}\n\nThis will be used for attendance geofencing.`
      );
    } catch (err: any) {
      Alert.alert('GPS Error', err.message || 'Could not retrieve current location.');
    } finally {
      setLocatingCurrent(false);
    }
  };

  // Simulator Modal State
  const [showSimModal, setShowSimModal] = useState(false);

  const fetchInternships = async () => {
    try {
      const data = await api.getInternships();
      setInternships(data);
    } catch (e: any) {
      console.warn('Failed to fetch internships:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchInternships();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInternships();
  };

  const activeInternship = internships.find((i) => i.is_active) || internships[0] || null;

  const resetForm = () => {
    setEditingId(null);
    setCompanyName('');
    setRole('');
    setDepartment('');
    setInternshipType('on_site');
    setLocation('');
    setWorkplaceLat(null);
    setWorkplaceLng(null);
    setHybridSchedule(DEFAULT_HYBRID_SCHEDULE);
    setSupervisorName('');
    setSupervisorEmail('');
    setSupervisorPhone('');
    setStartDate('');
    setEndDate('');
    setStipend('');
    setShiftStartTime('09:00');
    setShiftEndTime('17:00');
    setActualHours('8');
    setOfferLetterUrl(null);
    setProofFileName(null);
    setFormError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    // Default placeholder dates
    const today = new Date();
    const future = new Date();
    future.setMonth(future.getMonth() + 3);
    setStartDate(today.toISOString().split('T')[0]);
    setEndDate(future.toISOString().split('T')[0]);
    setModalVisible(true);
  };

  const handleOpenEdit = (item: Internship) => {
    setEditingId(item.id);
    setCompanyName(item.company_name);
    setRole(item.role);
    setDepartment(item.department || '');
    setInternshipType(item.internship_type || 'on_site');
    setLocation(item.location || '');
    setWorkplaceLat(item.workplace_lat ?? null);
    setWorkplaceLng(item.workplace_lng ?? null);
    if (item.hybrid_schedule) {
      try {
        setHybridSchedule(JSON.parse(item.hybrid_schedule));
      } catch {
        setHybridSchedule(DEFAULT_HYBRID_SCHEDULE);
      }
    } else {
      setHybridSchedule(DEFAULT_HYBRID_SCHEDULE);
    }
    setSupervisorName(item.supervisor_name || '');
    setSupervisorEmail(item.supervisor_email || '');
    setSupervisorPhone(item.supervisor_phone || '');
    setStartDate(item.start_date || '');
    setEndDate(item.end_date || '');
    setStipend(item.stipend || '');
    setShiftStartTime(item.shift_start_time || '09:00');
    setShiftEndTime(item.shift_end_time || '17:00');
    setActualHours(item.actual_hours_per_day ? String(item.actual_hours_per_day) : '8');
    setOfferLetterUrl(item.offer_letter_url || null);
    setProofFileName(item.offer_letter_url ? item.offer_letter_url.split('/').pop() || 'offer_proof' : null);
    setFormError(null);
    setModalVisible(true);
  };

  const handleUploadFile = async (uri: string, mimeType: string, filename: string) => {
    try {
      setUploadingProof(true);
      const res = await api.uploadInternshipProof(uri, mimeType, filename);
      setOfferLetterUrl(res.storage_ref);
      setProofFileName(filename);
      Alert.alert('Proof Attached', 'Offer letter / document proof attached successfully.');
    } catch (e: any) {
      Alert.alert('Upload Failed', e.message || 'Could not upload document proof.');
    } finally {
      setUploadingProof(false);
    }
  };

  const pickProofImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access gallery is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 0.85,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const filename = asset.fileName || asset.uri.split('/').pop() || 'offer_letter.jpg';
        await handleUploadFile(asset.uri, asset.mimeType || 'image/jpeg', filename);
      }
    } catch (e: any) {
      Alert.alert('Gallery Error', e.message || 'Could not pick image.');
    }
  };

  const takeProofPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const filename = asset.fileName || asset.uri.split('/').pop() || 'offer_photo.jpg';
        await handleUploadFile(asset.uri, asset.mimeType || 'image/jpeg', filename);
      }
    } catch (e: any) {
      Alert.alert('Camera Error', e.message || 'Could not open camera.');
    }
  };

  const pickProofDocument = () => {
    if (Platform.OS === 'web') {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf,image/*';
        input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (file) {
            const uri = URL.createObjectURL(file);
            await handleUploadFile(uri, file.type || 'application/pdf', file.name || 'offer_letter.pdf');
          }
        };
        input.click();
      } catch (err: any) {
        Alert.alert('Error', 'File picker not available on this browser.');
      }
    } else {
      Alert.alert(
        'Upload Offer Proof',
        'Choose how you want to upload your offer letter or acceptance email proof:',
        [
          { text: 'Take Photo', onPress: takeProofPhoto },
          { text: 'From Gallery', onPress: pickProofImage },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleSaveInternship = async () => {
    if (!companyName.trim()) {
      setFormError('Company name is required.');
      return;
    }
    if (!role.trim()) {
      setFormError('Job role / designation is required.');
      return;
    }
    if (internshipType === 'on_site' && !location.trim()) {
      setFormError('Office workplace location is required for on-site internships. Please pick a location from the map.');
      return;
    }
    if (!shiftStartTime.trim() || !shiftEndTime.trim()) {
      setFormError('Shift start time and end time are required (e.g. 09:00 - 17:00).');
      return;
    }
    if (!offerLetterUrl) {
      setFormError('Offer letter / timing proof is required for college admin verification.');
      return;
    }

    setActionLoading(true);
    setFormError(null);

    const payload: InternshipCreatePayload = {
      company_name: companyName.trim(),
      role: role.trim(),
      department: department.trim() || undefined,
      internship_type: internshipType,
      location: internshipType === 'remote' ? undefined : (location.trim() || undefined),
      workplace_lat: internshipType === 'remote' ? null : workplaceLat,
      workplace_lng: internshipType === 'remote' ? null : workplaceLng,
      supervisor_name: supervisorName.trim() || undefined,
      supervisor_email: supervisorEmail.trim() || undefined,
      supervisor_phone: supervisorPhone.trim() || undefined,
      start_date: startDate.trim() || undefined,
      end_date: endDate.trim() || undefined,
      stipend: stipend.trim() || undefined,
      shift_start_time: shiftStartTime.trim(),
      shift_end_time: shiftEndTime.trim(),
      actual_hours_per_day: actualHours.trim() ? parseFloat(actualHours.trim()) : undefined,
      hybrid_schedule: internshipType === 'hybrid' ? JSON.stringify(hybridSchedule) : undefined,
      offer_letter_url: offerLetterUrl || undefined,
    };

    try {
      if (editingId) {
        await api.updateInternship(editingId, payload);
        Alert.alert('Success', 'Internship updated successfully.');
      } else {
        await api.createInternship(payload);
        Alert.alert('Success', 'Internship registered and submitted for verification!');
      }
      setModalVisible(false);
      resetForm();
      await fetchInternships();
    } catch (e: any) {
      setFormError(e.message || 'Failed to save internship');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (item: Internship) => {
    Alert.alert(
      'Delete Internship',
      `Are you sure you want to remove "${item.company_name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await api.deleteInternship(item.id);
              await fetchInternships();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete internship.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSetActive = async (item: Internship) => {
    if (item.is_active) return;
    try {
      setActionLoading(true);
      await api.setActiveInternship(item.id);
      await fetchInternships();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to set active internship.');
    } finally {
      setActionLoading(false);
    }
  };



  // Stage mapping helper
  const getStageStep = (stage: string) => {
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

  const currentStageStep = activeInternship ? getStageStep(activeInternship.verification_stage) : 0;
  const isRejected = activeInternship?.verification_stage === 'rejected' || activeInternship?.status === 'rejected';

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconCircleBtn}>
          <Feather name="arrow-left" size={20} color="#1F2937" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={styles.headerTitle}>My Internship</Text>
          <Text style={styles.headerSub}>Manage & verify company postings</Text>
        </View>
        <TouchableOpacity style={styles.addNavBtn} onPress={handleOpenAdd}>
          <Feather name="plus" size={18} color="#FFFFFF" />
          <Text style={styles.addNavBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text style={styles.loadingText}>Loading internship records...</Text>
          </View>
        ) : internships.length === 0 ? (
          /* ============================================================= */
          /* Empty State: No Internship Added Yet                          */
          /* ============================================================= */
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="briefcase-plus-outline" size={54} color="#F59E0B" />
            </View>
            <Text style={styles.emptyTitle}>No Internship Added Yet</Text>
            <Text style={styles.emptySub}>
              Link your registered organization, office workplace, and mentor details. This enables biometric check-in and university T&P approval.
            </Text>

            <TouchableOpacity style={styles.emptyCtaButton} onPress={handleOpenAdd} activeOpacity={0.85}>
              <Feather name="plus-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.emptyCtaButtonText}>Register Internship Now</Text>
            </TouchableOpacity>

            <View style={styles.emptyFeaturesRow}>
              <View style={styles.emptyFeatureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.emptyFeatureText}>GPS Geofence Check-In</Text>
              </View>
              <View style={styles.emptyFeatureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.emptyFeatureText}>T&P Cell Clearance</Text>
              </View>
              <View style={styles.emptyFeatureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.emptyFeatureText}>Academic Credits</Text>
              </View>
            </View>
          </View>
        ) : (
          /* ============================================================= */
          /* Active Internship & Verification Flow Tracker                 */
          /* ============================================================= */
          <>
            {/* Dynamic Multi-Stage Verification Pipeline Card */}
            <View style={styles.verificationCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="shield-checkmark" size={22} color="#F59E0B" />
                  <Text style={styles.cardSectionTitle}>Internship Verification</Text>
                </View>

                {/* Status Badge */}
                {isRejected ? (
                  <View style={[styles.statusBadge, styles.badgeRejected]}>
                    <Ionicons name="alert-circle" size={14} color="#DC2626" />
                    <Text style={styles.badgeRejectedText}>Rejected</Text>
                  </View>
                ) : activeInternship?.verification_stage === 'verified' ? (
                  <View style={[styles.statusBadge, styles.badgeVerified]}>
                    <Ionicons name="checkmark-circle" size={14} color="#059669" />
                    <Text style={styles.badgeVerifiedText}>Verified</Text>
                  </View>
                ) : (
                  <View style={[styles.statusBadge, styles.badgePending]}>
                    <Ionicons name="time" size={14} color="#D97706" />
                    <Text style={styles.badgePendingText}>In Review</Text>
                  </View>
                )}
              </View>

              <Text style={styles.activeInternshipBanner}>
                {activeInternship?.company_name} — <Text style={{ fontWeight: '500' }}>{activeInternship?.role}</Text>
              </Text>

              {/* Dynamic Pipeline Tracker */}
              <View style={styles.timelineContainer}>
                {/* Step 1: Submitted */}
                <View style={styles.stepItem}>
                  <View style={currentStageStep >= 1 ? styles.iconCircleDone : styles.iconCirclePending}>
                    <Ionicons
                      name={currentStageStep >= 1 ? 'checkmark' : 'ellipsis-horizontal'}
                      size={14}
                      color={currentStageStep >= 1 ? '#111827' : '#9CA3AF'}
                    />
                  </View>
                  <Text style={[styles.stepLabel, currentStageStep === 1 && styles.stepLabelActive]}>
                    Submitted
                  </Text>
                </View>

                {/* Connecting Line 1 */}
                <View
                  style={currentStageStep >= 2 ? styles.stepConnectorDone : styles.stepConnectorPending}
                />

                {/* Step 2: T&P Review */}
                <View style={styles.stepItem}>
                  <View
                    style={
                      currentStageStep >= 2
                        ? currentStageStep === 2
                          ? styles.iconCircleActive
                          : styles.iconCircleDone
                        : styles.iconCirclePending
                    }
                  >
                    {currentStageStep > 2 ? (
                      <Ionicons name="checkmark" size={14} color="#111827" />
                    ) : currentStageStep === 2 ? (
                      <View style={styles.activeInnerDot} />
                    ) : (
                      <Text style={styles.pendingDotsText}>•••</Text>
                    )}
                  </View>
                  <Text style={[styles.stepLabel, currentStageStep === 2 && styles.stepLabelActive]}>
                    T&P
                  </Text>
                </View>

                {/* Connecting Line 2 */}
                <View
                  style={currentStageStep >= 3 ? styles.stepConnectorDone : styles.stepConnectorPending}
                />

                {/* Step 3: Mentor Review */}
                <View style={styles.stepItem}>
                  <View
                    style={
                      currentStageStep >= 3
                        ? currentStageStep === 3
                          ? styles.iconCircleActive
                          : styles.iconCircleDone
                        : styles.iconCirclePending
                    }
                  >
                    {currentStageStep > 3 ? (
                      <Ionicons name="checkmark" size={14} color="#111827" />
                    ) : currentStageStep === 3 ? (
                      <View style={styles.activeInnerDot} />
                    ) : (
                      <Text style={styles.pendingDotsText}>•••</Text>
                    )}
                  </View>
                  <Text style={[styles.stepLabel, currentStageStep === 3 && styles.stepLabelActive]}>
                    Mentor
                  </Text>
                </View>

                {/* Connecting Line 3 */}
                <View
                  style={currentStageStep >= 4 ? styles.stepConnectorDone : styles.stepConnectorPending}
                />

                {/* Step 4: Final Verified */}
                <View style={styles.stepItem}>
                  <View
                    style={
                      currentStageStep >= 4
                        ? styles.iconCircleDone
                        : isRejected
                        ? styles.iconCircleRejected
                        : styles.iconCirclePending
                    }
                  >
                    {currentStageStep >= 4 ? (
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
                      currentStageStep === 4 && styles.stepLabelActive,
                      isRejected && styles.stepLabelRejected,
                    ]}
                  >
                    {isRejected ? 'Rejected' : 'Verified'}
                  </Text>
                </View>
              </View>

              {/* Status Explanation Box */}
              {isRejected ? (
                <View style={styles.rejectionNotice}>
                  <Ionicons name="warning" size={20} color="#DC2626" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rejectionTitle}>Verification Rejected by Admin</Text>
                    <Text style={styles.rejectionDesc}>
                      {activeInternship?.rejection_reason ||
                        'Offer letter details or supervisor contact could not be verified by T&P.'}
                    </Text>
                    <TouchableOpacity
                      style={styles.resubmitBtn}
                      onPress={() => activeInternship && handleOpenEdit(activeInternship)}
                    >
                      <Text style={styles.resubmitBtnText}>Edit & Resubmit Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : currentStageStep === 4 ? (
                <View style={styles.verifiedNotice}>
                  <Ionicons name="ribbon" size={20} color="#059669" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.verifiedTitle}>Officially Approved & Verified!</Text>
                    <Text style={styles.verifiedDesc}>
                      Your college T&P cell and mentor have approved this internship. Daily attendance is officially recorded towards academic credits.
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.pendingNotice}>
                  <Ionicons name="information-circle" size={18} color="#B45309" />
                  <Text style={styles.pendingNoticeText}>
                    {currentStageStep === 1
                      ? 'Details submitted. Awaiting initial scrutiny by College T&P Cell.'
                      : currentStageStep === 2
                      ? 'T&P Cell approved. Verification dispatched to your assigned Faculty/Company Mentor.'
                      : 'Mentor review in progress. Final clearance pending.'}
                  </Text>
                </View>
              )}

            </View>

            {/* List of Internships Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>All Internships ({internships.length})</Text>
              <TouchableOpacity onPress={handleOpenAdd}>
                <Text style={styles.addLinkText}>+ Add Another</Text>
              </TouchableOpacity>
            </View>

            {internships.map((item) => (
              <View key={item.id} style={[styles.itemCard, item.is_active && styles.itemCardActive]}>
                <View style={styles.itemHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.companyRow}>
                      <Text style={styles.companyName}>{item.company_name}</Text>
                      {item.is_active && (
                        <View style={styles.activePill}>
                          <Text style={styles.activePillText}>ACTIVE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.itemRole}>{item.role}</Text>
                  </View>

                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>
                      {item.internship_type === 'on_site'
                        ? 'On-Site'
                        : item.internship_type === 'remote'
                        ? 'Remote'
                        : 'Hybrid'}
                    </Text>
                  </View>
                </View>

                {/* Details Grid */}
                <View style={styles.detailsGrid}>
                  {item.internship_type === 'remote' ? (
                    <View style={styles.detailRow}>
                      <Feather name="home" size={15} color="#059669" />
                      <Text style={[styles.detailText, { color: '#059669', fontWeight: '600' }]}>
                        Workplace: 100% Remote (Digital Verification)
                      </Text>
                    </View>
                  ) : item.location ? (
                    <View style={styles.detailRow}>
                      <Ionicons name="location-outline" size={16} color="#6B7280" />
                      <Text style={styles.detailText} numberOfLines={2}>
                        {item.location}
                      </Text>
                    </View>
                  ) : null}

                  {item.internship_type === 'hybrid' && item.hybrid_schedule && (
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="calendar-sync" size={16} color="#4F46E5" />
                      <Text style={[styles.detailText, { color: '#4F46E5', fontWeight: '600' }]} numberOfLines={2}>
                        Schedule: {formatHybridSummary(item.hybrid_schedule)}
                      </Text>
                    </View>
                  )}

                  {item.supervisor_name && (
                    <View style={styles.detailRow}>
                      <Feather name="user" size={15} color="#6B7280" />
                      <Text style={styles.detailText} numberOfLines={1}>
                        Mentor: {item.supervisor_name}
                        {item.supervisor_email ? ` (${item.supervisor_email})` : ''}
                      </Text>
                    </View>
                  )}

                  {(item.start_date || item.end_date) && (
                    <View style={styles.detailRow}>
                      <Feather name="calendar" size={15} color="#6B7280" />
                      <Text style={styles.detailText}>
                        {item.start_date || 'N/A'} to {item.end_date || 'Present'}
                      </Text>
                    </View>
                  )}

                  {item.stipend && (
                    <View style={styles.detailRow}>
                      <Ionicons name="cash-outline" size={16} color="#059669" />
                      <Text style={[styles.detailText, { color: '#059669', fontWeight: '600' }]}>
                        Stipend: {item.stipend}
                      </Text>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color="#D97706" />
                    <Text style={[styles.detailText, { color: '#D97706', fontWeight: '600' }]}>
                      Shift: {item.shift_start_time || '09:00'} - {item.shift_end_time || '17:00'} ({item.actual_hours_per_day || 8} hrs/day)
                    </Text>
                  </View>

                  {item.workplace_lat != null && item.workplace_lng != null && (
                    <View style={styles.detailRow}>
                      <Ionicons name="navigate-circle-outline" size={16} color="#059669" />
                      <Text style={[styles.detailText, { color: '#059669', fontWeight: '500' }]}>
                        GPS: {item.workplace_lat.toFixed(5)}, {item.workplace_lng.toFixed(5)} (300m perimeter)
                      </Text>
                    </View>
                  )}

                  {item.offer_letter_url && (
                    <View style={styles.detailRow}>
                      <Ionicons name="document-attach-outline" size={16} color="#059669" />
                      <Text style={[styles.detailText, { color: '#059669', fontWeight: '600' }]}>
                        Offer Letter / Email Proof Attached
                      </Text>
                    </View>
                  )}
                </View>

                {/* Item Actions */}
                <View style={styles.cardActionsRow}>
                  {!item.is_active && (
                    <TouchableOpacity
                      style={styles.activateBtn}
                      onPress={() => handleSetActive(item)}
                      disabled={actionLoading}
                    >
                      <Text style={styles.activateBtnText}>Set as Active</Text>
                    </TouchableOpacity>
                  )}

                  <View style={{ flex: 1 }} />

                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => handleOpenEdit(item)}
                    disabled={actionLoading}
                  >
                    <Feather name="edit-2" size={14} color="#1F2937" />
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item)}
                    disabled={actionLoading}
                  >
                    <Feather name="trash-2" size={14} color="#DC2626" />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* ============================================================= */}
      {/* Add / Edit Internship Modal Form                              */}
      {/* ============================================================= */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {editingId ? 'Edit Internship' : 'Register New Internship'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {formError && (
              <View style={styles.formErrorBox}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              {/* Company Name */}
              <Text style={styles.inputLabel}>
                Company / Organization Name <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Google India, Infosys, TechCorp"
                placeholderTextColor="#9CA3AF"
                value={companyName}
                onChangeText={setCompanyName}
              />

              {/* Job Role */}
              <Text style={styles.inputLabel}>
                Internship Role / Title <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Full Stack Developer Intern"
                placeholderTextColor="#9CA3AF"
                value={role}
                onChangeText={setRole}
              />

              {/* Department */}
              <Text style={styles.inputLabel}>Department / Domain</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Cloud & AI Infrastructure, Core Engineering"
                placeholderTextColor="#9CA3AF"
                value={department}
                onChangeText={setDepartment}
              />

              {/* Work Mode */}
              <Text style={styles.inputLabel}>
                Workplace Mode <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <View style={styles.segmentRow}>
                {(['on_site', 'hybrid', 'remote'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.segmentBtn, internshipType === type && styles.segmentBtnActive]}
                    onPress={() => setInternshipType(type)}
                  >
                    <Text
                      style={[
                        styles.segmentBtnText,
                        internshipType === type && styles.segmentBtnTextActive,
                      ]}
                    >
                      {type === 'on_site' ? '🏢 On-Site' : type === 'hybrid' ? '🔄 Hybrid' : '🏠 Remote'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* ------------------------------------------------------------- */}
              {/* HYBRID MODE: 7-Day Weekly Schedule Selector                   */}
              {/* ------------------------------------------------------------- */}
              {internshipType === 'hybrid' && (
                <View style={styles.hybridScheduleContainer}>
                  <View style={styles.hybridHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.hybridSectionTitle}>7-Day Weekly Hybrid Schedule</Text>
                      <Text style={styles.hybridSectionSubtitle}>
                        Choose on which days you report to office (Offline) and work from home (Online).
                      </Text>
                    </View>
                    <View style={styles.scheduleBadge}>
                      <Text style={styles.scheduleBadgeText}>
                        🏢 {Object.values(hybridSchedule).filter((v) => v === 'offline').length} Office • 💻 {Object.values(hybridSchedule).filter((v) => v === 'online').length} Remote
                      </Text>
                    </View>
                  </View>

                  {/* Quick Preset Buttons */}
                  <View style={styles.presetButtonsRow}>
                    <TouchableOpacity
                      style={styles.quickPresetChip}
                      onPress={() =>
                        setHybridSchedule({
                          mon: 'offline',
                          tue: 'offline',
                          wed: 'offline',
                          thu: 'online',
                          fri: 'online',
                          sat: 'online',
                          sun: 'online',
                        })
                      }
                    >
                      <Text style={styles.quickPresetText}>Mon-Wed Office</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.quickPresetChip}
                      onPress={() =>
                        setHybridSchedule({
                          mon: 'offline',
                          tue: 'offline',
                          wed: 'offline',
                          thu: 'offline',
                          fri: 'offline',
                          sat: 'online',
                          sun: 'online',
                        })
                      }
                    >
                      <Text style={styles.quickPresetText}>Mon-Fri Office</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.quickPresetChip}
                      onPress={() =>
                        setHybridSchedule({
                          mon: 'offline',
                          tue: 'online',
                          wed: 'offline',
                          thu: 'online',
                          fri: 'offline',
                          sat: 'online',
                          sun: 'online',
                        })
                      }
                    >
                      <Text style={styles.quickPresetText}>Alternate Days</Text>
                    </TouchableOpacity>
                  </View>

                  {/* 7 Days List with Toggle Buttons */}
                  <View style={styles.daysListGrid}>
                    {DAYS_ORDER.map((d) => {
                      const mode = hybridSchedule[d.key];
                      const isOffline = mode === 'offline';
                      return (
                        <View key={d.key} style={styles.dayScheduleRow}>
                          <View style={styles.dayNameBox}>
                            <Text style={styles.dayNameText}>{d.full}</Text>
                          </View>
                          <View style={styles.dayTogglesGroup}>
                            <TouchableOpacity
                              style={[styles.dayToggleBtn, isOffline && styles.dayToggleBtnActiveOffline]}
                              onPress={() =>
                                setHybridSchedule((prev) => ({ ...prev, [d.key]: 'offline' }))
                              }
                            >
                              <Text
                                style={[
                                  styles.dayToggleBtnText,
                                  isOffline && styles.dayToggleBtnTextActiveOffline,
                                ]}
                              >
                                🏢 Office
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.dayToggleBtn, !isOffline && styles.dayToggleBtnActiveOnline]}
                              onPress={() =>
                                setHybridSchedule((prev) => ({ ...prev, [d.key]: 'online' }))
                              }
                            >
                              <Text
                                style={[
                                  styles.dayToggleBtnText,
                                  !isOffline && styles.dayToggleBtnTextActiveOnline,
                                ]}
                              >
                                💻 Remote
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* ------------------------------------------------------------- */}
              {/* REMOTE MODE: Informational Card (Office location is hidden)   */}
              {/* ------------------------------------------------------------- */}
              {internshipType === 'remote' && (
                <View style={styles.remoteNoticeBox}>
                  <View style={styles.remoteNoticeIconCircle}>
                    <Feather name="home" size={20} color="#059669" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.remoteNoticeTitle}>100% Remote Internship</Text>
                    <Text style={styles.remoteNoticeSub}>
                      Office workplace location is not required. Attendance verification uses daily sprint goals, GitHub commits, or IDE proof without physical geofencing.
                    </Text>
                  </View>
                </View>
              )}

              {/* ------------------------------------------------------------- */}
              {/* ON-SITE & HYBRID: Office Workplace Location with Map Picker   */}
              {/* ------------------------------------------------------------- */}
              {internshipType !== 'remote' && (
                <View style={styles.locationSection}>
                  <View style={styles.locationLabelRow}>
                    <Text style={styles.inputLabel}>
                      Office Workplace Location{' '}
                      {internshipType === 'on_site' ? (
                        <Text style={{ color: '#EF4444' }}>* (Required)</Text>
                      ) : (
                        <Text style={{ color: '#6B7280' }}>(For offline days)</Text>
                      )}
                    </Text>
                  </View>
                  <Text style={styles.inputSubtext}>
                    Used for GPS geofencing & biometric face check-in on office days.
                  </Text>

                  {/* Location Action Buttons: Current GPS & Map Picker */}
                  <View style={{ gap: 8, marginBottom: 12 }}>
                    <TouchableOpacity
                      style={[styles.openMapBtn, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
                      onPress={handleUseCurrentGpsLocation}
                      disabled={locatingCurrent}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.openMapIconBox, { backgroundColor: '#10B981' }]}>
                        {locatingCurrent ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <MaterialCommunityIcons name="crosshairs-gps" size={18} color="#FFFFFF" />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.openMapBtnTitle, { color: '#065F46' }]}>
                          {locatingCurrent ? 'Detecting Device GPS...' : 'Use Current Device Location (GPS)'}
                        </Text>
                        <Text style={styles.openMapBtnSub}>
                          Auto-captures exact office latitude & longitude for geofence verification
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={18} color="#059669" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.openMapBtn}
                      onPress={() => setShowLocationPicker(true)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.openMapIconBox}>
                        <Ionicons name="map" size={18} color="#D97706" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.openMapBtnTitle}>Pick Location from Map</Text>
                        <Text style={styles.openMapBtnSub}>
                          Country ➔ State ➔ City ➔ Exact Landmark (OpenStreetMap API)
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={18} color="#D97706" />
                    </TouchableOpacity>
                  </View>

                  {/* Selected Location Card or Input */}
                  {location ? (
                    <View style={styles.selectedAddressCard}>
                      <View style={styles.selectedAddressHeader}>
                        <View style={styles.verifiedPinBadge}>
                          <Ionicons name="location-sharp" size={14} color="#059669" />
                          <Text style={styles.verifiedPinText}>Location Selected</Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowLocationPicker(true)}>
                          <Text style={styles.changeAddressLink}>Change on Map</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.selectedAddressContent}>{location}</Text>
                      {workplaceLat && workplaceLng && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 8 }}>
                          <Ionicons name="compass-outline" size={14} color="#059669" />
                          <Text style={{ fontSize: 12, color: '#059669', fontWeight: '600' }}>
                            Geofence Coords: {workplaceLat.toFixed(5)}, {workplaceLng.toFixed(5)} (300m perimeter)
                          </Text>
                        </View>
                      )}
                      <TextInput
                        style={styles.subBuildingInput}
                        placeholder="Optional: Add Floor, Wing, or Desk (e.g. 4th Floor, Tower B)"
                        placeholderTextColor="#9CA3AF"
                        value={location}
                        onChangeText={setLocation}
                      />
                    </View>
                  ) : (
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. EON IT Park, Kharadi, Pune, Maharashtra, India"
                      placeholderTextColor="#9CA3AF"
                      value={location}
                      onChangeText={setLocation}
                    />
                  )}
                </View>
              )}

              {/* Supervisor Info */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Supervisor Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Rajesh Sharma"
                    placeholderTextColor="#9CA3AF"
                    value={supervisorName}
                    onChangeText={setSupervisorName}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Supervisor Phone</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="+91 9876543210"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={supervisorPhone}
                    onChangeText={setSupervisorPhone}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Supervisor Official Email</Text>
              <TextInput
                style={styles.textInput}
                placeholder="supervisor@company.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={supervisorEmail}
                onChangeText={setSupervisorEmail}
              />

              {/* Start & End Date */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Start Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="2026-06-01"
                    placeholderTextColor="#9CA3AF"
                    value={startDate}
                    onChangeText={setStartDate}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>End Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="2026-08-31"
                    placeholderTextColor="#9CA3AF"
                    value={endDate}
                    onChangeText={setEndDate}
                  />
                </View>
              </View>

              {/* Shift Timings */}
              <View style={{ marginTop: 8, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <Text style={[styles.inputLabel, { marginTop: 0 }]}>
                  Shift Timings & Daily Hours <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <Text style={[styles.inputSubtext, { marginBottom: 8 }]}>
                  Shift hours are validated during daily check-in and automated 10-minute compliance checks.
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Start Time (HH:MM)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="09:00"
                      placeholderTextColor="#9CA3AF"
                      value={shiftStartTime}
                      onChangeText={setShiftStartTime}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>End Time (HH:MM)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="17:00"
                      placeholderTextColor="#9CA3AF"
                      value={shiftEndTime}
                      onChangeText={setShiftEndTime}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Hours / Day</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="8"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      value={actualHours}
                      onChangeText={setActualHours}
                    />
                  </View>
                </View>
              </View>

              {/* Offer Letter / Email Proof Attachment */}
              <Text style={styles.inputLabel}>
                Offer Letter / Proof Document <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <Text style={styles.inputSubtext}>
                Upload official offer letter, selection email, or proof of internship timings for Admin verification.
              </Text>

              {offerLetterUrl ? (
                <View style={styles.attachedProofBox}>
                  <View style={styles.proofIconCircle}>
                    <Ionicons
                      name={offerLetterUrl.toLowerCase().endsWith('.pdf') ? 'document-text' : 'image'}
                      size={20}
                      color="#059669"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.proofFileName} numberOfLines={1}>
                      {proofFileName || offerLetterUrl.split('/').pop() || 'Proof Document'}
                    </Text>
                    <Text style={styles.proofStatusText}>✓ Uploaded & attached</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeProofBtn}
                    onPress={() => {
                      setOfferLetterUrl(null);
                      setProofFileName(null);
                    }}
                  >
                    <Feather name="x" size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadProofActionsRow}>
                  <TouchableOpacity
                    style={styles.proofActionBtn}
                    onPress={takeProofPhoto}
                    disabled={uploadingProof}
                  >
                    <Feather name="camera" size={16} color="#B45309" />
                    <Text style={styles.proofActionBtnText}>Take Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.proofActionBtn}
                    onPress={pickProofImage}
                    disabled={uploadingProof}
                  >
                    <Feather name="image" size={16} color="#B45309" />
                    <Text style={styles.proofActionBtnText}>From Gallery</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.proofActionBtn}
                    onPress={pickProofDocument}
                    disabled={uploadingProof}
                  >
                    <Feather name="file-text" size={16} color="#B45309" />
                    <Text style={styles.proofActionBtnText}>Choose PDF/File</Text>
                  </TouchableOpacity>
                </View>
              )}

              {uploadingProof && (
                <View style={styles.uploadingProofIndicator}>
                  <ActivityIndicator size="small" color="#F59E0B" />
                  <Text style={styles.uploadingProofText}>Uploading document proof...</Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, actionLoading && styles.btnDisabled]}
              onPress={handleSaveInternship}
              disabled={actionLoading}
              activeOpacity={0.85}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.saveBtnText}>
                    {editingId ? 'Save Changes' : 'Submit for Verification'}
                  </Text>
                  <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* OpenStreetMap Location Picker Modal */}
      <LocationPickerModal
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        initialLocation={location}
        onSelectLocation={(selected: SelectedLocationResult) => {
          setLocation(selected.fullAddress);
          setWorkplaceLat(selected.lat);
          setWorkplaceLng(selected.lng);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FDF5F0',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  headerSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  addNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  addNavBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  /* Empty State */
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
    marginBottom: 24,
  },
  emptyCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  emptyCtaButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyFeaturesRow: {
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
  },
  emptyFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyFeatureText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },

  /* Verification Pipeline Card */
  verificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  activeInternshipBanner: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgePendingText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeVerified: {
    backgroundColor: '#D1FAE5',
  },
  badgeVerifiedText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeRejected: {
    backgroundColor: '#FEE2E2',
  },
  badgeRejectedText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '700',
  },

  /* Pipeline Timeline Tracker */
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  stepItem: {
    alignItems: 'center',
    width: 60,
  },
  iconCircleDone: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFA500',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 2,
  },
  iconCircleActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFA500',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 2,
  },
  activeInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#111827',
  },
  iconCirclePending: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleRejected: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingDotsText: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
    fontWeight: '600',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#111827',
    fontWeight: '700',
  },
  stepLabelRejected: {
    color: '#DC2626',
    fontWeight: '700',
  },
  stepConnectorDone: {
    flex: 1,
    height: 2.5,
    backgroundColor: '#FFA500',
    marginTop: -16,
  },
  stepConnectorPending: {
    flex: 1,
    height: 2.5,
    backgroundColor: '#E5E7EB',
    marginTop: -16,
  },

  /* Notice Boxes */
  pendingNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  pendingNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
  verifiedNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 2,
  },
  verifiedDesc: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 17,
  },
  rejectionNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 2,
  },
  rejectionDesc: {
    fontSize: 12,
    color: '#B91C1C',
    lineHeight: 17,
    marginBottom: 8,
  },
  resubmitBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  simStageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  simStageBtnText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  addLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
  },

  /* Items Cards */
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemCardActive: {
    borderColor: '#F59E0B',
    borderWidth: 1.5,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  companyName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1F2937',
  },
  activePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  itemRole: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
    marginTop: 2,
  },
  typeBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  detailsGrid: {
    gap: 6,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#4B5563',
    flex: 1,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  activateBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
  },
  activateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  formErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  formErrorText: {
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 10,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  segmentBtnTextActive: {
    color: '#92400E',
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 15,
    borderRadius: 16,
    marginTop: 18,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },

  /* Simulator Card */
  simCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    alignSelf: 'center',
    width: '90%',
    marginVertical: 'auto',
  },
  simDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 16,
  },
  simOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  simDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  simOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  simOptionSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  /* Proof Upload Styles */
  inputSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  attachedProofBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 8,
  },
  proofIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proofFileName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  proofStatusText: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
  },
  removeProofBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadProofActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  proofActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  proofActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  uploadingProofIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    marginBottom: 6,
  },
  uploadingProofText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600',
  },
  // Hybrid Schedule Styles
  hybridScheduleContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 12,
    marginTop: 4,
  },
  hybridHeaderRow: {
    marginBottom: 10,
  },
  hybridSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  hybridSectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 6,
  },
  scheduleBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  scheduleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  presetButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  quickPresetChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quickPresetText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  daysListGrid: {
    gap: 6,
  },
  dayScheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dayNameBox: {
    width: 90,
  },
  dayNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  dayTogglesGroup: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  dayToggleBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  dayToggleBtnActiveOffline: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  dayToggleBtnActiveOnline: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  dayToggleBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  dayToggleBtnTextActiveOffline: {
    color: '#B45309',
    fontWeight: '800',
  },
  dayToggleBtnTextActiveOnline: {
    color: '#1D4ED8',
    fontWeight: '800',
  },
  // Remote Notice Styles
  remoteNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    marginBottom: 12,
    marginTop: 4,
  },
  remoteNoticeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remoteNoticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  remoteNoticeSub: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
    lineHeight: 15,
  },
  // Location Section & Map Picker Styles
  locationSection: {
    marginBottom: 12,
  },
  locationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  openMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    marginBottom: 8,
    gap: 10,
  },
  openMapIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openMapBtnTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  openMapBtnSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 1,
  },
  selectedAddressCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
  },
  selectedAddressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  verifiedPinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedPinText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  changeAddressLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  selectedAddressContent: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 18,
    marginBottom: 8,
  },
  subBuildingInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    color: '#1E293B',
  },
});
