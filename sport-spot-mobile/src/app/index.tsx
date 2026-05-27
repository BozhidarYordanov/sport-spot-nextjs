import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';

export default function HomeScreen() {
  const { isLoggedIn, logout, user } = useAuth();

  const handlePrimaryAction = () => {
    router.push(isLoggedIn ? '/classes' : '/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#ede9fe', '#ffffff', '#fee2e2']}
          end={{ x: 1, y: 0 }}
          start={{ x: 0, y: 0 }}
          style={styles.hero}
        >
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>SS</Text>
          </View>

          <Text style={styles.brand}>SportSpot</Text>
          <Text style={styles.subtitle}>Your Ultimate Fitness Journey Starts Here</Text>
        </LinearGradient>

        <View style={styles.panel}>
          <Text style={styles.kicker}>{isLoggedIn ? 'Member Access' : 'Train Smarter'}</Text>
          <Text style={styles.title}>
            {isLoggedIn ? `Welcome back, ${user?.fullName ?? 'Athlete'}!` : 'Find the class that moves you.'}
          </Text>
          <Text style={styles.body}>
            {isLoggedIn
              ? 'Jump into today\'s schedule and reserve your next workout in seconds.'
              : 'Explore premium group sessions, book your spot, and build a routine that actually fits your life.'}
          </Text>

          <TouchableOpacity activeOpacity={0.88} style={styles.primaryButton} onPress={handlePrimaryAction}>
            <Text style={styles.primaryButtonText}>
              {isLoggedIn ? 'View Available Classes' : 'Get Started'}
            </Text>
          </TouchableOpacity>

          {isLoggedIn ? (
            <TouchableOpacity activeOpacity={0.78} style={styles.ghostButton} onPress={logout}>
              <Text style={styles.ghostButtonText}>Sign Out</Text>
            </TouchableOpacity>
          ) : null}
        </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 28,
  },
  hero: {
    alignItems: 'center',
    borderRadius: 28,
    justifyContent: 'center',
    minHeight: 330,
    paddingHorizontal: 24,
    paddingVertical: 42,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
  },
  brandBadge: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    width: 60,
  },
  brandBadgeText: {
    color: colors.primaryDeep,
    fontSize: 20,
    fontWeight: '900',
  },
  brand: {
    color: colors.primary,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtitle: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 25,
    marginTop: 12,
    maxWidth: 300,
    textAlign: 'center',
  },
  panel: {
    backgroundColor: colors.cardSoft,
    borderRadius: 24,
    padding: 22,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  kicker: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 34,
  },
  body: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    marginTop: 24,
    paddingVertical: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  ghostButton: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 12,
  },
  ghostButtonText: {
    color: colors.primaryDeep,
    fontSize: 14,
    fontWeight: '700',
  },
});
