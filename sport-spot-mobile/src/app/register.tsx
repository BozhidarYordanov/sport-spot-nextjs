import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';

type RegisterField = 'fullName' | 'email' | 'password' | 'confirmPassword';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [focusedField, setFocusedField] = useState<RegisterField | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fieldsHaveValues =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0;
  const canSubmit = fieldsHaveValues && !isSubmitting;

  const validateForm = () => {
    if (!fieldsHaveValues) {
      return 'Complete all fields to create your account.';
    }

    if (!emailPattern.test(email.trim())) {
      return 'Enter a valid email address.';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const result = await register(fullName, email, password);

    setIsSubmitting(false);

    if (result.success) {
      router.replace('/classes');
      return;
    }

    setError(result.error ?? 'Unable to create account. Please try again.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>SS</Text>
            </View>

            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Join SportSpot and book your next class in seconds.</Text>

            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  autoCapitalize="words"
                  autoComplete="name"
                  editable={!isSubmitting}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={setFullName}
                  onFocus={() => setFocusedField('fullName')}
                  placeholder="Alex Morgan"
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="next"
                  style={[styles.input, focusedField === 'fullName' && styles.inputFocused]}
                  textContentType="name"
                  value={fullName}
                />
              </View>

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
                  placeholder="Create a password"
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="next"
                  secureTextEntry
                  style={[styles.input, focusedField === 'password' && styles.inputFocused]}
                  textContentType="newPassword"
                  value={password}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onSubmitEditing={handleSubmit}
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="go"
                  secureTextEntry
                  style={[styles.input, focusedField === 'confirmPassword' && styles.inputFocused]}
                  textContentType="newPassword"
                  value={confirmPassword}
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
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.72}
                disabled={isSubmitting}
                onPress={() => router.push('/login')}
                style={styles.footerLink}
              >
                <Text style={styles.footerText}>
                  Already have an account? <Text style={styles.footerTextStrong}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
    flexGrow: 1,
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
  footerLink: {
    alignItems: 'center',
    marginTop: 18,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  footerTextStrong: {
    color: colors.primaryDeep,
    fontWeight: '900',
  },
});
