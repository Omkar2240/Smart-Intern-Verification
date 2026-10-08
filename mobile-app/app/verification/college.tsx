import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';

import { api, College, Department } from '@/services/api';
import { useAuth } from '@/context/auth-context';

export default function CollegeSelectionScreen() {
  const router = useRouter();
  const { verificationStatus, refreshVerificationStatus } = useAuth();

  const [search, setSearch] = useState('');
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string | null>(
    verificationStatus?.college_id || null
  );
  const [loadingColleges, setLoadingColleges] = useState(false);

  // Department states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(
    verificationStatus?.department_id || null
  );
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // View state: whether the college list is open or collapsed
  const [isCollegePickerOpen, setIsCollegePickerOpen] = useState(
    !verificationStatus?.college_id
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch colleges list
  const fetchColleges = async (query = '') => {
    try {
      setLoadingColleges(true);
      setErrorMsg(null);
      const data = await api.getColleges(query);
      setColleges(data);
      if (data.length > 0 && !selectedCollegeId) {
        setSelectedCollegeId(data[0].id);
      }
    } catch (e: any) {
      console.warn('Failed to load colleges:', e);
      const msg = e?.message || 'Could not load college directory';
      setErrorMsg(msg);
    } finally {
      setLoadingColleges(false);
    }
  };

  useEffect(() => {
    fetchColleges(search);
  }, [search]);

  // When selected college changes, fetch its active departments
  useEffect(() => {
    if (!selectedCollegeId) {
      setDepartments([]);
      setSelectedDepartmentId(null);
      return;
    }

    let isMounted = true;
    setLoadingDepartments(true);

    api.getDepartments(selectedCollegeId)
      .then((data) => {
        if (!isMounted) return;
        setDepartments(data);
        if (data.length > 0) {
          // Keep current selection if valid, else pick first or match user's previous dept
          if (verificationStatus?.department_id && data.some((d) => d.id === verificationStatus.department_id)) {
            setSelectedDepartmentId(verificationStatus.department_id);
          } else {
            setSelectedDepartmentId(data[0].id);
          }
        } else {
          setSelectedDepartmentId(null);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Failed to load departments:', err);
        setDepartments([]);
        setSelectedDepartmentId(null);
      })
      .finally(() => {
        if (isMounted) setLoadingDepartments(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCollegeId, verificationStatus?.department_id]);

  const selectedCollege = useMemo(() => {
    return colleges.find((c) => c.id === selectedCollegeId) || null;
  }, [colleges, selectedCollegeId]);

  const handleSelectCollege = (collegeId: string) => {
    setSelectedCollegeId(collegeId);
    setIsCollegePickerOpen(false);
    setErrorMsg(null);
  };

  const handleConfirmAndProceed = async () => {
    setErrorMsg(null);

    if (!selectedCollegeId) {
      setErrorMsg('Please select your college from the directory.');
      Alert.alert('Selection Required', 'Please select your college from the directory.');
      return;
    }

    if (departments.length > 0 && !selectedDepartmentId) {
      setErrorMsg('Please select your academic department to proceed.');
      Alert.alert('Department Required', 'Please choose your department from the list.');
      return;
    }

    setSubmitting(true);
    try {
      await api.selectCollege(selectedCollegeId);
      if (selectedDepartmentId) {
        await api.selectDepartment(selectedDepartmentId);
      }
      await refreshVerificationStatus();
      router.push('/verification/college_id' as any);
    } catch (e: any) {
      const msg = e?.message || 'Unable to save college and department selection';
      setErrorMsg(msg);
      Alert.alert('Selection Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const renderCollegeItem = ({ item }: { item: College }) => {
    const isSelected = item.id === selectedCollegeId;
    return (
      <TouchableOpacity
        style={[styles.collegeCard, isSelected && styles.collegeCardSelected]}
        onPress={() => handleSelectCollege(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.radioContainer}>
          <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </View>
        <View style={styles.collegeInfo}>
          <Text style={[styles.collegeName, isSelected && styles.collegeNameSelected]}>
            {item.name}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Ionicons name="location-outline" size={13} color="#6B7280" />
              <Text style={styles.metaText}>{item.city}, {item.state}</Text>
            </View>
            {item.code && (
              <View style={styles.codeBadge}>
                <Text style={styles.codeText}>{item.code}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const isReadyToProceed = Boolean(
    selectedCollegeId && (!departments.length || selectedDepartmentId)
  );

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={22} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>Step 1: Academic Profile</Text>
          </View>
        </View>

        <Text style={styles.title}>Select College & Department</Text>
        <Text style={styles.subtitle}>
          Choose your institution and academic department to verify against your student ID card.
        </Text>

        {/* Error Banner */}
        {errorMsg && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* If College Picker is Open: Show Search + College List */}
        {isCollegePickerOpen ? (
          <View style={styles.sectionWrap}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Feather name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by college name, city, or code..."
                placeholderTextColor="#9CA3AF"
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {loadingColleges ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="large" color="#F59E0B" />
                <Text style={styles.loaderText}>Loading approved institutions...</Text>
              </View>
            ) : (
              <FlatList
                data={colleges}
                keyExtractor={(item) => item.id}
                renderItem={renderCollegeItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyWrap}>
                    <Feather name="alert-circle" size={32} color="#9CA3AF" />
                    <Text style={styles.emptyTitle}>No colleges found</Text>
                    <Text style={styles.emptyDesc}>Try searching for &quot;Raisoni&quot; or &quot;Nagpur&quot;</Text>
                  </View>
                }
              />
            )}
          </View>
        ) : (
          /* Selected College Summary Card + Department Selection */
          <View style={styles.sectionWrap}>
            {/* Selected College Card */}
            <View style={styles.selectedCollegeBanner}>
              <View style={styles.selectedCollegeIconBox}>
                <Ionicons name="school" size={20} color="#B45309" />
              </View>
              <View style={styles.selectedCollegeContent}>
                <Text style={styles.selectedCollegeLabel}>Selected Institution</Text>
                <Text style={styles.selectedCollegeName} numberOfLines={2}>
                  {selectedCollege?.name || 'Selected College'}
                </Text>
                <Text style={styles.selectedCollegeMeta}>
                  {selectedCollege?.city}, {selectedCollege?.state} {selectedCollege?.code ? `• ${selectedCollege.code}` : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.changeCollegeBtn}
                onPress={() => setIsCollegePickerOpen(true)}
              >
                <Text style={styles.changeCollegeText}>Change</Text>
              </TouchableOpacity>
            </View>

            {/* Department Selection Header */}
            <View style={styles.departmentHeaderRow}>
              <View>
                <Text style={styles.departmentTitle}>Choose Your Department</Text>
                <Text style={styles.departmentSubtitle}>
                  Select your enrolled engineering / academic branch:
                </Text>
              </View>
              {departments.length > 0 && (
                <View style={styles.deptCountBadge}>
                  <Text style={styles.deptCountText}>{departments.length} Branches</Text>
                </View>
              )}
            </View>

            {/* Department List */}
            {loadingDepartments ? (
              <View style={styles.departmentLoader}>
                <ActivityIndicator size="small" color="#F59E0B" />
                <Text style={styles.loaderText}>Loading department catalog...</Text>
              </View>
            ) : departments.length === 0 ? (
              <View style={styles.noDepartmentsCard}>
                <Ionicons name="information-circle-outline" size={20} color="#B45309" />
                <Text style={styles.noDepartmentsText}>
                  No department records found for this college. You may proceed directly to ID verification.
                </Text>
              </View>
            ) : (
              <FlatList
                data={departments}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.departmentList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = item.id === selectedDepartmentId;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.departmentCard,
                        isSelected && styles.departmentCardSelected,
                      ]}
                      onPress={() => setSelectedDepartmentId(item.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.departmentInfo}>
                        <Text style={[styles.departmentName, isSelected && styles.departmentNameSelected]}>
                          {item.name}
                        </Text>
                        {item.code ? (
                          <View style={styles.departmentCodeBadge}>
                            <Text style={styles.departmentCodeText}>{item.code}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={22}
                        color={isSelected ? '#F59E0B' : '#D1D5DB'}
                      />
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        )}

        {/* Bottom CTA Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!isReadyToProceed || submitting) && styles.buttonDisabled,
            ]}
            onPress={handleConfirmAndProceed}
            disabled={!isReadyToProceed || submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.continueButtonText}>
                  {isCollegePickerOpen
                    ? 'Select Department'
                    : 'Confirm & Proceed to ID Card'}
                </Text>
                <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FDF5F0',
  },
  container: {
    flex: 1,
    padding: 24,
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
    marginBottom: 16,
  },
  sectionWrap: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  listContent: {
    gap: 10,
    paddingBottom: 16,
  },
  selectedCollegeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  selectedCollegeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedCollegeContent: {
    flex: 1,
  },
  selectedCollegeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedCollegeName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 2,
  },
  selectedCollegeMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  changeCollegeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    marginLeft: 8,
  },
  changeCollegeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  departmentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  departmentTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1F2937',
  },
  departmentSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  deptCountBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  deptCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  departmentLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  departmentList: {
    gap: 10,
    paddingBottom: 16,
  },
  departmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  departmentCardSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFDF9',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  departmentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 10,
  },
  departmentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    flex: 1,
  },
  departmentNameSelected: {
    color: '#B45309',
  },
  departmentCodeBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  departmentCodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  noDepartmentsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  noDepartmentsText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
    flex: 1,
  },
  collegeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  collegeCardSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFDF9',
  },
  radioContainer: {
    marginRight: 14,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#F59E0B',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F59E0B',
  },
  collegeInfo: {
    flex: 1,
  },
  collegeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  collegeNameSelected: {
    color: '#B45309',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  codeBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  codeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
  footer: {
    paddingTop: 12,
  },
  continueButton: {
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
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#B91C1C',
    lineHeight: 18,
  },
});
