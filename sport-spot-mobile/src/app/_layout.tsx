import { Stack } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';
import { colors } from '@/theme/colors';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '700',
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Sign In' }} />
        <Stack.Screen name="sessions" options={{ title: 'Available Classes' }} />
        <Stack.Screen name="session-details" options={{ title: 'Class Details' }} />
      </Stack>
    </AuthProvider>
  );
}
