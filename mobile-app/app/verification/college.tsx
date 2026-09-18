import React, { useEffect, useState } from 'react';
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

import { api, College } from '@/services/api';
import { useAuth } from '@/context/auth-context';

export default function CollegeSelectionScreen() {
  const router = useRouter();
  const { refreshVerificationStatus } = useAuth();

  const [search, setSearch] = useState('');
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchColleges = async (query = '') => {
    try {
      setLoading(true);
      const data = await api.getColleges(query);
      setColleges(data);
      // If none selected and there is a college, default select first
      if (data.length > 0 && !selectedCollegeId) {
        setSelectedCollegeId(data[0].id);
      }
    } catch (e: any) {
      console.warn('Failed to load colleges:', e);
      Alert.alert('Error', e.message || 'Could not load college directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges(search);
  }, [search]);

  const handleSelect = async () => {
    if (!selectedCollegeId) {
      Alert.alert('Selection Required', 'Please select your college from the directory.');
      return;
    }

    setSubmitting(true);
    try {
      await api.selectCollege(selectedCollegeId);
      await refreshVerificationStatus();
      router.push('/verification/college_id' as any);
    } catch (e: any) {
      Alert.alert('Selection Failed', e.message || 'Unable to save college selection');
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: College }) => {
    const isSelected = item.id === selectedCollegeId;
    return (
      <TouchableOpacity
        style={[styles.collegeCard, isSelected && styles.collegeCardSelected]}
        onPress={() => setSelectedCollegeId(item.id)}
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

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={22} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>Step 1 of 3</Text>
          </View>
        </View>

        <Text style={styles.title}>Select Your College</Text>
        <Text style={styles.subtitle}>
          Choose your enrolled institution. This will be matched against your student ID card in the next step.
        </Text>

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

        {/* List */}
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text style={styles.loaderText}>Loading approved institutions...</Text>
          </View>
        ) : (
          <FlatList
            data={colleges}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Feather name="alert-circle" size={32} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No colleges found</Text>
                <Text style={styles.emptyDesc}>Try searching for "Raisoni" or "Nagpur"</Text>
              </View>
            }
          />
        )}

        {/* Bottom CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueButton, !selectedCollegeId && styles.buttonDisabled]}
            onPress={handleSelect}
            disabled={!selectedCollegeId || submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.continueButtonText}>Confirm & Proceed to Step 2</Text>
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
    marginBottom: 20,
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
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  listContent: {
    gap: 12,
    paddingBottom: 16,
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
});
