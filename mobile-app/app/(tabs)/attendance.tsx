import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import {
  api,
  AttendanceHistoryResult,
  AttendanceRecordItem,
} from '@/services/api';

export default function AttendanceScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<AttendanceHistoryResult | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecordItem | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'offline' | 'online'>('all');

  const fetchHistory = async () => {
    try {
      const data = await api.getAttendanceHistory();
      setHistory(data);
    } catch (e: any) {
      console.warn('Failed to load attendance history:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchHistory();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
  };

  const records = history?.records || [];
  const filteredRecords = records.filter((r) => {
    if (filterMode === 'offline') return r.work_mode === 'offline';
    if (filterMode === 'online') return r.work_mode === 'online';
    return true;
  });

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return '--:--';
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timeStr.split('T')[1]?.slice(0, 5) || timeStr;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Attendance Logs</Text>
          <Text style={styles.subtitle}>Shift compliance & biometric audit trail</Text>
        </View>
        <TouchableOpacity style={styles.refreshIconBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFA500" />
        }
      >
        {/* ============================================================= */}
        {/* LeetCode-Style Stats Summary Card                             */}
        {/* ============================================================= */}
        <View style={styles.statsCard}>
          <View style={styles.rateCircleContainer}>
            <View style={styles.rateCircle}>
              <Text style={styles.rateNumber}>{history?.attendance_rate ?? 0}%</Text>
              <Text style={styles.rateLabel}>ATTENDANCE</Text>
            </View>
          </View>

          <View style={styles.metricsColumn}>
            <View style={styles.metricRow}>
              <View style={[styles.metricDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.metricName}>Present Days</Text>
              <Text style={styles.metricVal}>{history?.present_days ?? 0}</Text>
            </View>

            <View style={styles.metricRow}>
              <View style={[styles.metricDot, { backgroundColor: '#4F46E5' }]} />
              <Text style={styles.metricName}>On-Site (Offline)</Text>
              <Text style={styles.metricVal}>{history?.on_site_count ?? 0}</Text>
            </View>

            <View style={styles.metricRow}>
              <View style={[styles.metricDot, { backgroundColor: '#059669' }]} />
              <Text style={styles.metricName}>Remote (Online)</Text>
              <Text style={styles.metricVal}>{history?.remote_count ?? 0}</Text>
            </View>

            <View style={styles.metricRow}>
              <View style={[styles.metricDot, { backgroundColor: '#9CA3AF' }]} />
              <Text style={styles.metricName}>Total Logged</Text>
              <Text style={styles.metricVal}>{history?.total_days ?? 0}</Text>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabsRow}>
          <TouchableOpacity
            style={[styles.filterTab, filterMode === 'all' && styles.filterTabActive]}
            onPress={() => setFilterMode('all')}
          >
            <Text style={[styles.filterTabText, filterMode === 'all' && styles.filterTabTextActive]}>
              All ({records.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterMode === 'offline' && styles.filterTabActive]}
            onPress={() => setFilterMode('offline')}
          >
            <Text
              style={[styles.filterTabText, filterMode === 'offline' && styles.filterTabTextActive]}
            >
              🏢 On-Site ({history?.on_site_count ?? 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterMode === 'online' && styles.filterTabActive]}
            onPress={() => setFilterMode('online')}
          >
            <Text
              style={[styles.filterTabText, filterMode === 'online' && styles.filterTabTextActive]}
            >
              💻 Remote ({history?.remote_count ?? 0})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ============================================================= */}
        {/* Attendance Records List                                       */}
        {/* ============================================================= */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#FFA500" />
            <Text style={styles.loadingText}>Fetching attendance records...</Text>
          </View>
        ) : filteredRecords.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Attendance Records Yet</Text>
            <Text style={styles.emptySub}>
              Daily check-ins, biometric scans, and remote sprint proofs will appear here.
            </Text>
          </View>
        ) : (
          filteredRecords.map((item) => {
            const isPresent = item.status === 'present';
            const isLate = item.status === 'late';
            const isOffline = item.work_mode === 'offline';

            return (
              <View key={item.id} style={styles.recordCard}>
                <View style={styles.recordHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View
                      style={[
                        styles.statusBadge,
                        isPresent
                          ? styles.statusBadgePresent
                          : isLate
                          ? styles.statusBadgeLate
                          : styles.statusBadgeAbsent,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isPresent
                            ? styles.statusTextPresent
                            : isLate
                            ? styles.statusTextLate
                            : styles.statusTextAbsent,
                        ]}
                      >
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.recordDateText}>{formatDate(item.date)}</Text>
                  </View>

                  {/* Mode Pill */}
                  <View
                    style={[
                      styles.modePill,
                      isOffline ? styles.modePillOffline : styles.modePillOnline,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modePillText,
                        isOffline ? styles.modeTextOffline : styles.modeTextOnline,
                      ]}
                    >
                      {isOffline ? '🏢 On-Site' : '💻 Remote'}
                    </Text>
                  </View>
                </View>

                {/* Timing Row */}
                <View style={styles.timingRow}>
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeLabel}>CHECK IN</Text>
                    <Text style={styles.timeValue}>{formatTime(item.check_in)}</Text>
                  </View>
                  <View style={styles.timeDivider}>
                    <Ionicons name="arrow-forward" size={14} color="#9CA3AF" />
                  </View>
                  <View style={styles.timeBlock}>
                    <Text style={styles.timeLabel}>CHECK OUT</Text>
                    <Text style={styles.timeValue}>
                      {item.check_out ? formatTime(item.check_out) : 'In Progress'}
                    </Text>
                  </View>
                </View>

                {/* Badges / Verification Row */}
                <View style={styles.verificationRow}>
                  {isOffline ? (
                    <View style={styles.tagBadge}>
                      <Ionicons name="finger-print" size={12} color="#059669" />
                      <Text style={styles.tagBadgeText}>ArcFace Biometrics</Text>
                    </View>
                  ) : (
                    <View style={styles.tagBadge}>
                      <MaterialCommunityIcons name="shield-check" size={12} color="#4F46E5" />
                      <Text style={[styles.tagBadgeText, { color: '#4F46E5' }]}>
                        Digital Work Proof
                      </Text>
                    </View>
                  )}

                  {item.tasks_assigned_count > 0 && (
                    <View style={styles.tagBadge}>
                      <Ionicons name="checkmark-done-circle" size={13} color="#D97706" />
                      <Text style={[styles.tagBadgeText, { color: '#D97706' }]}>
                        Tasks: {item.tasks_completed_count}/{item.tasks_assigned_count}
                      </Text>
                    </View>
                  )}

                  {item.admin_requested_check && (
                    <View style={[styles.tagBadge, { backgroundColor: '#FEF2F2' }]}>
                      <Ionicons name="flash" size={12} color="#DC2626" />
                      <Text style={[styles.tagBadgeText, { color: '#DC2626' }]}>Admin Check</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.detailsBtn}
                    onPress={() => setSelectedRecord(item)}
                  >
                    <Text style={styles.detailsBtnText}>View Details →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ============================================================= */}
      {/* View Details Inspection Modal                                 */}
      {/* ============================================================= */}
      <Modal visible={Boolean(selectedRecord)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="shield-checkmark" size={22} color="#FFA500" />
                <Text style={styles.modalTitle}>Shift Audit Trail</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedRecord(null)}>
                <Ionicons name="close-circle" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {selectedRecord && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
                <View style={styles.detailGridRow}>
                  <Text style={styles.detailGridKey}>Date:</Text>
                  <Text style={styles.detailGridVal}>{formatDate(selectedRecord.date)}</Text>
                </View>

                <View style={styles.detailGridRow}>
                  <Text style={styles.detailGridKey}>Status:</Text>
                  <Text style={[styles.detailGridVal, { fontWeight: '700' }]}>
                    {selectedRecord.status.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.detailGridRow}>
                  <Text style={styles.detailGridKey}>Work Mode:</Text>
                  <Text style={styles.detailGridVal}>
                    {selectedRecord.work_mode === 'offline'
                      ? 'On-Site / Physical Office'
                      : 'Remote / Work From Home'}
                  </Text>
                </View>

                <View style={styles.detailGridRow}>
                  <Text style={styles.detailGridKey}>Check-In Time:</Text>
                  <Text style={styles.detailGridVal}>{formatTime(selectedRecord.check_in)}</Text>
                </View>

                <View style={styles.detailGridRow}>
                  <Text style={styles.detailGridKey}>Check-Out Time:</Text>
                  <Text style={styles.detailGridVal}>
                    {selectedRecord.check_out
                      ? formatTime(selectedRecord.check_out)
                      : 'Not Checked Out Yet'}
                  </Text>
                </View>

                <View style={styles.detailGridRow}>
                  <Text style={styles.detailGridKey}>Location Verified:</Text>
                  <Text style={styles.detailGridVal}>
                    {selectedRecord.location_verified ? 'Yes (Geofenced GPS)' : 'N/A (Remote)'}
                  </Text>
                </View>

                <View style={styles.detailGridRow}>
                  <Text style={styles.detailGridKey}>Biometric Match:</Text>
                  <Text style={styles.detailGridVal}>
                    {selectedRecord.face_verified
                      ? 'Yes (ArcFace Enrolled Vector)'
                      : 'N/A (Remote)'}
                  </Text>
                </View>

                <View style={styles.detailGridRow}>
                  <Text style={styles.detailGridKey}>10-Min Compliance Tasks:</Text>
                  <Text style={styles.detailGridVal}>
                    {selectedRecord.tasks_completed_count} /{' '}
                    {selectedRecord.tasks_assigned_count} Completed
                  </Text>
                </View>

                <View style={styles.detailGridRow}>
                  <Text style={styles.detailGridKey}>Admin Surprise Check:</Text>
                  <Text style={styles.detailGridVal}>
                    {selectedRecord.admin_requested_check ? 'Yes (Requested by Admin)' : 'No'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeDetailBtn}
                  onPress={() => setSelectedRecord(null)}
                >
                  <Text style={styles.closeDetailBtnText}>Close Audit Window</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  refreshIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  // Stats Card
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  rateCircleContainer: {
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FEF3C7',
    borderWidth: 5,
    borderColor: '#FFA500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateNumber: { fontSize: 22, fontWeight: '900', color: '#B45309' },
  rateLabel: { fontSize: 9, fontWeight: '700', color: '#92400E', marginTop: 2 },
  metricsColumn: { flex: 1, marginLeft: 16, gap: 8 },
  metricRow: { flexDirection: 'row', alignItems: 'center' },
  metricDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  metricName: { flex: 1, fontSize: 13, color: '#4B5563', fontWeight: '500' },
  metricVal: { fontSize: 14, fontWeight: '700', color: '#111827' },

  // Filter Tabs
  filterTabsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  filterTabActive: { backgroundColor: '#111827', borderColor: '#111827' },
  filterTabText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterTabTextActive: { color: '#FFFFFF', fontWeight: '700' },

  // Record Cards
  loadingBox: { padding: 40, alignItems: 'center' },
  loadingText: { fontSize: 13, color: '#6B7280', marginTop: 10 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 4, lineHeight: 18 },

  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  recordHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgePresent: { backgroundColor: '#ECFDF5' },
  statusBadgeLate: { backgroundColor: '#FEF9C3' },
  statusBadgeAbsent: { backgroundColor: '#FEE2E2' },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },
  statusTextPresent: { color: '#059669' },
  statusTextLate: { color: '#D97706' },
  statusTextAbsent: { color: '#DC2626' },
  recordDateText: { fontSize: 14, fontWeight: '700', color: '#111827' },

  modePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  modePillOffline: { backgroundColor: '#EEF2FF' },
  modePillOnline: { backgroundColor: '#ECFDF5' },
  modePillText: { fontSize: 11, fontWeight: '700' },
  modeTextOffline: { color: '#4F46E5' },
  modeTextOnline: { color: '#059669' },

  timingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  timeBlock: { flex: 1, alignItems: 'center' },
  timeLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF' },
  timeValue: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginTop: 2 },
  timeDivider: { paddingHorizontal: 12 },

  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagBadgeText: { fontSize: 11, fontWeight: '600', color: '#4B5563' },
  detailsBtn: { marginLeft: 'auto', paddingVertical: 4 },
  detailsBtnText: { fontSize: 12, fontWeight: '700', color: '#FFA500' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  detailGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  detailGridKey: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  detailGridVal: { fontSize: 13, color: '#1E293B', fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  closeDetailBtn: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeDetailBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
