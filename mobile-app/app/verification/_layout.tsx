import { Stack } from 'expo-router';

export default function VerificationLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FDF5F0' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="college" />
      <Stack.Screen name="college-id" />
      <Stack.Screen name="face" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}
