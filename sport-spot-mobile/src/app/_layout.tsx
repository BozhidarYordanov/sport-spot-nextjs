import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';

const AUTH_SEGMENTS = new Set(['login', 'register']);
const PROTECTED_SEGMENTS = new Set(['classes']);

export default function RootLayout() {
  return (
    <AuthProvider>
      <GuardedStack />
    </AuthProvider>
  );
}

function GuardedStack() {
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const currentSegment = segments[0] ?? '';

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (token && AUTH_SEGMENTS.has(currentSegment)) {
      router.replace('/classes');
      return;
    }

    if (!token && PROTECTED_SEGMENTS.has(currentSegment)) {
      router.replace('/login');
    }
  }, [currentSegment, isLoading, router, token]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
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
      <Stack.Screen name="register" options={{ title: 'Create Account' }} />
      <Stack.Screen name="classes" options={{ title: 'Available Classes' }} />
      <Stack.Screen name="classes/[slug]" options={{ title: 'Class Details' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
});
