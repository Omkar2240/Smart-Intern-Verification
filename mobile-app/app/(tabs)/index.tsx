import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/auth-context';
import { api, StudentProfile } from '@/services/api';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const data = await api.getProfile();
      setProfile(data);
      setCollege(data.college);
      setBranch(data.branch);
      setRollNumber(data.roll_number);
    } catch {
      // Profile not created yet
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    if (!college.trim() || !branch.trim() || !rollNumber.trim()) {
      Alert.alert('Validation Error', 'Please fill in all profile fields.');
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
      setIsEditing(false);
      Alert.alert('Success', 'Profile saved successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#FDF5F0', dark: '#1F2937' }}
      headerImage={
        <View style={styles.headerBg}>
          <Ionicons name="school-outline" size={140} color="#F5B742" style={styles.headerIcon} />
        </View>
      }
    >
      {/* Welcome Banner */}
      <ThemedView style={styles.card}>
        <View style={styles.userHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="title" style={styles.userName}>
              {user?.name || 'Intern'}
            </ThemedText>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Feather name="log-out" size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Reg Number:</Text>
          <Text style={styles.infoValue}>{user?.registration_number || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Mobile:</Text>
          <Text style={styles.infoValue}>{user?.mobile_number || 'N/A'}</Text>
        </View>
      </ThemedView>

      {/* Student Profile Section */}
      <ThemedView style={styles.card}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Student Profile</ThemedText>
          {!isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={styles.editText}>{profile ? 'Edit' : '+ Complete Profile'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {loadingProfile ? (
          <ActivityIndicator color="#F5B742" style={{ padding: 20 }} />
        ) : isEditing ? (
          <View style={styles.editForm}>
            <Text style={styles.inputLabel}>College Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Stanford University"
              value={college}
              onChangeText={setCollege}
            />

            <Text style={styles.inputLabel}>Branch / Department</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Computer Science"
              value={branch}
              onChangeText={setBranch}
            />

            <Text style={styles.inputLabel}>Roll Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. CS2026-042"
              value={rollNumber}
              onChangeText={setRollNumber}
            />

            <View style={styles.formBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsEditing(false)}
                disabled={savingProfile}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator color="#1F2937" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Profile</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : profile ? (
          <View style={styles.profileDetails}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>College:</Text>
              <Text style={styles.infoValue}>{profile.college}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Branch:</Text>
              <Text style={styles.infoValue}>{profile.branch}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Roll No:</Text>
              <Text style={styles.infoValue}>{profile.roll_number}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>College ID:</Text>
              <Text style={[styles.infoValue, { color: profile.has_college_id ? '#16A34A' : '#D97706' }]}>
                {profile.has_college_id ? '✓ Uploaded' : 'Pending Upload'}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>
            No academic profile added yet. Tap Complete Profile above.
          </Text>
        )}
      </ThemedView>

      {/* Verification Status Card */}
      <ThemedView style={styles.card}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Verification Hub</ThemedText>
        </View>
        <Text style={styles.emptyText}>
          Biometric face recognition and GPS geofence verification will be active during your scheduled internship shifts.
        </Text>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerBg: {
    height: 220,
    backgroundColor: '#FDF5F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    opacity: 0.85,
  },
  card: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F5B742',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E09418',
  },
  profileDetails: {
    gap: 6,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  editForm: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  formBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#F5B742',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
});
