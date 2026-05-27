import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

export default function SessionDetailsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Class Details</Text>
          <Text style={styles.title}>Strength and Conditioning</Text>
          <Text style={styles.body}>Detailed booking data, room capacity, trainer notes, and reservation controls will live here.</Text>
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
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.cardSoft,
    borderRadius: 24,
    padding: 24,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.primary,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 36,
  },
  body: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
});
