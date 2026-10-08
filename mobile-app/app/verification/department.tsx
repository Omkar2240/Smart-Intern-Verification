import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';

import { api, Department } from '@/services/api';
import { useAuth } from '@/context/auth-context';

export default function DepartmentSelectionScreen() {
  const router = useRouter();
  const { verificationStatus, refreshVerificationStatus } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!verificationStatus?.college_id) {
      router.replace('/verification/college' as any);
      return;
    }

    api.getDepartments(verificationStatus.college_id)
      .then(setDepartments)
      .catch((error: any) => Alert.alert('Error', error.message || 'Could not load departments'))
      .finally(() => setLoading(false));
  }, [verificationStatus?.college_id]);

  const handleContinue = async () => {
    if (!selectedId) {
      Alert.alert('Selection Required', 'Please select your department.');
      return;
    }
    setSubmitting(true);
    try {
      await api.selectDepartment(selectedId);
      await refreshVerificationStatus();
      router.push('/verification/college_id' as any);
    } catch (error: any) {
      Alert.alert('Selection Failed', error.message || 'Unable to save department selection');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={22} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Step 2 of 4</Text>
          </View>
        </View>
        <Text style={styles.title}>Select Your Department</Text>
        <Text style={styles.subtitle}>
          Choose the department associated with your selected college.
        </Text>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text style={styles.muted}>Loading departments...</Text>
          </View>
        ) : (
          <FlatList
            data={departments}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const selected = item.id === selectedId;
              return (
                <TouchableOpacity
                  style={[styles.card, selected && styles.cardSelected]}
                  onPress={() => setSelectedId(item.id)}
                >
                  <View>
                    <Text style={[styles.name, selected && styles.nameSelected]}>{item.name}</Text>
                    <Text style={styles.code}>{item.code}</Text>
                  </View>
                  <Ionicons
                    name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={23}
                    color={selected ? '#F59E0B' : '#D1D5DB'}
                  />
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.empty}>
                No active departments are available for this college.
              </Text>
            }
          />
        )}

        <TouchableOpacity
          style={[styles.continueButton, !selectedId && styles.disabled]}
          onPress={handleContinue}
          disabled={!selectedId || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.continueText}>Confirm & Proceed to Step 3</Text>
              <Feather name="arrow-right" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FDF5F0' },
  container: { flex: 1, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  backButton: { padding: 6 },
  badge: { backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#B45309' },
  title: { fontSize: 26, fontWeight: '800', color: '#1F2937', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 20 },
  list: { gap: 10, paddingBottom: 20 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, borderWidth: 1.5, borderColor: '#E5E7EB' },
  cardSelected: { borderColor: '#F59E0B', backgroundColor: '#FFFDF9' },
  name: { fontSize: 15, fontWeight: '700', color: '#374151' },
  nameSelected: { color: '#B45309' },
  code: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  muted: { color: '#6B7280' },
  empty: { color: '#B45309', backgroundColor: '#FEF3C7', padding: 12, borderRadius: 10 },
  continueButton: { backgroundColor: '#F59E0B', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 16, borderRadius: 16 },
  disabled: { opacity: 0.5 },
  continueText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
