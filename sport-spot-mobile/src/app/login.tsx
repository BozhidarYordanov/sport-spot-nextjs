import { router } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';

export default function LoginScreen() {
  const { login } = useAuth();

  const handleDemoSignIn = () => {
    login();
    router.replace('/sessions');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Sign in to SportSpot</Text>
        <Text style={styles.body}>Authentication wiring lives here next. Use demo sign in to preview the member flow.</Text>

        <TouchableOpacity activeOpacity={0.88} style={styles.button} onPress={handleDemoSignIn}>
          <Text style={styles.buttonText}>Demo Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: colors.primary,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0,
  },
  body: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    marginTop: 28,
    paddingVertical: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
