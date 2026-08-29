import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ProgressScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Internship Progress</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.placeholderCard}>
          <Ionicons name="trending-up-outline" size={48} color="#FFA500" />
          <Text style={styles.cardTitle}>Skill & Evaluation Metrics</Text>
          <Text style={styles.cardSubtitle}>
            Track internship hours, mentor evaluations, grading milestones, and certificate generation.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  content: { padding: 20, alignItems: 'center' },
  placeholderCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginTop: 12 },
  cardSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 6, lineHeight: 20 },
});
