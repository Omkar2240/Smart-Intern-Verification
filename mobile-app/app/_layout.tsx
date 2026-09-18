import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/context/auth-context';

function NavigationGuard() {
  const { isLoading, isAuthenticated, verificationStatus } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const segList = segments as string[];
    const inAuthGroup = segList[0] === 'login' || segList[0] === 'register';
    const inVerificationGroup = segList[0] === 'verification';

    if (!isAuthenticated) {
      if (!inAuthGroup) {
        router.replace('/login');
      }
    } else {
      // User is authenticated
      if (!verificationStatus?.is_verified) {
        // Not verified yet: MUST complete mandatory verification flow
        if (!inVerificationGroup) {
          router.replace('/verification' as any);
        }
      } else {
        // Identity verified: allow dashboard access
        if (inAuthGroup || inVerificationGroup) {
          router.replace('/(tabs)');
        }
      }
    }
  }, [isLoading, isAuthenticated, verificationStatus, segments]);

  return null;
}

function MainContent() {
  const { isLoading } = useAuth();

  return (
    <View style={{ flex: 1 }}>
      <NavigationGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="verification" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', headerShown: true }} />
      </Stack>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingTitle}>TrackIntern</Text>
          <ActivityIndicator size="large" color="#F5B742" style={{ marginTop: 20 }} />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <MainContent />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FDF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
});
