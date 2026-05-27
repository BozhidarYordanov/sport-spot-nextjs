import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError('Enter your email and password to continue.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const result = await login(email, password);

    setIsSubmitting(false);

    if (result.success) {
      router.replace('/sessions');
      return;
    }

    setError(result.error ?? 'Unable to sign in. Please check your details.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>SS</Text>
            </View>

            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to reserve your next SportSpot class.</Text>

            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  keyboardType="email-address"
                  onBlur={() => setFocusedField(null)}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="next"
                  style={[styles.input, focusedField === 'email' && styles.inputFocused]}
                  textContentType="emailAddress"
                  value={email}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onSubmitEditing={handleSubmit}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="go"
                  secureTextEntry
                  style={[styles.input, focusedField === 'password' && styles.inputFocused]}
                  textContentType="password"
                  value={password}
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                activeOpacity={0.88}
                disabled={!canSubmit}
                onPress={handleSubmit}
                style={[styles.button, !canSubmit && styles.buttonDisabled]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.primarySoft,
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 6,
  },
  brandBadge: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginBottom: 22,
    width: 56,
  },
  brandBadgeText: {
    color: colors.primaryDeep,
    fontSize: 18,
    fontWeight: '900',
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    textAlign: 'center',
  },
  form: {
    marginTop: 30,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 54,
    paddingHorizontal: 16,
  },
  inputFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 2,
  },
  errorText: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderRadius: 14,
    borderWidth: 1,
    color: '#b91c1c',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.62,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
});
