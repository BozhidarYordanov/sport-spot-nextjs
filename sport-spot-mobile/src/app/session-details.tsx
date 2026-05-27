import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '');

type Workout = {
  id: number;
  title: string;
  category: string;
  description?: string | null;
  durationMinutes?: number | null;
  difficultyLevel?: string | null;
  slug?: string | null;
  imageUrl?: string | null;
};

type Session = {
  id: number;
  startTime: string;
  trainerName: string;
  room: string;
  capacity: number;
  enrolledCount: number;
  isEnrolled: boolean;
  members: string[];
  workout: Workout;
};

type SessionActionResponse = {
  success?: boolean;
  error?: unknown;
  enrolledCount?: number;
  booking?: {
    enrolledCount?: number;
  };
};

const badgeColors = ['#fce7f3', '#dcfce7', '#e0f2fe', '#fef3c7', '#ede9fe'];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getBadgeColor(category: string) {
  const hash = category.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return badgeColors[hash % badgeColors.length];
}

function formatStartTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      dateLabel: 'Date to be confirmed',
      timeLabel: 'Time to be confirmed',
    };
  }

  return {
    dateLabel: new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(date),
    timeLabel: new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date),
  };
}

function getResponseError(data: SessionActionResponse, fallback: string) {
  return typeof data.error === 'string' ? data.error : fallback;
}

function getUnknownResponseError(data: unknown, fallback: string) {
  if (!data || typeof data !== 'object' || !('error' in data)) {
    return fallback;
  }

  const error = (data as { error?: unknown }).error;
  return typeof error === 'string' ? error : fallback;
}

export default function SessionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const sessionId = firstParam(id);
  const { token } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canFetch = useMemo(() => Boolean(API_BASE_URL && token && sessionId), [sessionId, token]);
  const startTime = session ? formatStartTime(session.startTime) : null;
  const spotsRemaining = session ? Math.max(session.capacity - session.enrolledCount, 0) : 0;
  const isClassFull = Boolean(session && !session.isEnrolled && spotsRemaining <= 0);

  const fetchSession = useCallback(async () => {
    if (!API_BASE_URL) {
      setErrorMessage('Missing API configuration.');
      setIsLoading(false);
      return;
    }

    if (!sessionId) {
      setErrorMessage('Missing session ID.');
      setIsLoading(false);
      return;
    }

    if (!token) {
      setErrorMessage('Please sign in to view this class.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await response.json()) as Session | { error?: unknown };

      if (!response.ok) {
        throw new Error(getUnknownResponseError(data, 'Unable to load class details.'));
      }

      setSession({
        ...(data as Session),
        isEnrolled: Boolean((data as Session).isEnrolled),
        members: Array.isArray((data as Session).members) ? (data as Session).members : [],
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load class details.');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, token]);

  useEffect(() => {
    if (canFetch) {
      void Promise.resolve().then(fetchSession);
    } else {
      void Promise.resolve().then(() => setIsLoading(false));
    }
  }, [canFetch, fetchSession]);

  const handleAction = useCallback(async () => {
    if (!session || !API_BASE_URL || !token || isActionLoading || isClassFull) {
      return;
    }

    const nextIsEnrolled = !session.isEnrolled;
    const endpoint = nextIsEnrolled ? 'join' : 'leave';

    try {
      setIsActionLoading(true);

      const response = await fetch(`${API_BASE_URL}/sessions/${session.id}/${endpoint}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await response.json()) as SessionActionResponse;

      if (!response.ok || !data.success) {
        throw new Error(getResponseError(data, 'Unable to update your reservation.'));
      }

      setSession((current) => {
        if (!current) {
          return current;
        }

        const serverCount = data.booking?.enrolledCount ?? data.enrolledCount;
        const localCount = nextIsEnrolled ? current.enrolledCount + 1 : current.enrolledCount - 1;

        return {
          ...current,
          isEnrolled: nextIsEnrolled,
          enrolledCount: Math.max(0, serverCount ?? localCount),
        };
      });
    } catch (error) {
      Alert.alert('Reservation update failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsActionLoading(false);
    }
  }, [isActionLoading, isClassFull, session, token]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.centerText}>Loading class details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>Class unavailable</Text>
          <Text style={styles.emptyBody}>{errorMessage ?? 'We could not find this class.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const category = session.workout.category || 'Training';
  const description = session.workout.description || 'No description has been added for this class yet.';
  const actionText = isClassFull ? 'Class Full' : session.isEnrolled ? 'Cancel Reservation' : 'Reserve Spot';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={[styles.badge, { backgroundColor: getBadgeColor(category) }]}>
            <Text style={styles.badgeText}>{category}</Text>
          </View>
          <Text style={styles.title}>{session.workout.title}</Text>
          {startTime ? (
            <View style={styles.timeBlock}>
              <Text style={styles.dateText}>{startTime.dateLabel}</Text>
              <Text style={styles.timeText}>{startTime.timeLabel}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.capacityCard}>
          <View>
            <Text style={styles.capacityCount}>
              {session.enrolledCount} / {session.capacity}
            </Text>
            <Text style={styles.capacityLabel}>spots reserved</Text>
          </View>
          <Text style={styles.remainingText}>
            {spotsRemaining > 0 ? `${spotsRemaining} open` : 'Waitlist soon'}
          </Text>
        </View>

        <View style={styles.infoGrid}>
          <InfoBlock label="Trainer" value={session.trainerName} />
          <InfoBlock label="Room" value={session.room} />
          <InfoBlock label="Duration" value={`${session.workout.durationMinutes ?? 45} min`} />
          <InfoBlock label="Difficulty" value={session.workout.difficultyLevel ?? 'All levels'} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About This Class</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{"Who's Training"}</Text>
          {session.members.length > 0 ? (
            <View style={styles.membersWrap}>
              {session.members.map((member) => (
                <View key={member} style={styles.memberPill}>
                  <Text style={styles.memberInitial}>{member.trim().charAt(0).toUpperCase() || '?'}</Text>
                  <Text style={styles.memberName}>{member}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.firstSpotText}>Be the first to secure a spot!</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        <Pressable
          accessibilityRole="button"
          disabled={isActionLoading || isClassFull}
          onPress={handleAction}
          style={({ pressed }) => [
            styles.actionButton,
            session.isEnrolled ? styles.secondaryButton : styles.primaryButton,
            isClassFull && styles.disabledButton,
            pressed && !isActionLoading && !isClassFull && styles.pressedButton,
          ]}
        >
          {isActionLoading ? (
            <ActivityIndicator color={session.isEnrolled ? colors.primaryDeep : colors.white} />
          ) : (
            <Text style={[styles.actionText, session.isEnrolled ? styles.secondaryActionText : styles.primaryActionText]}>
              {actionText}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoBlock}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 132,
  },
  centerState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  centerText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
  hero: {
    backgroundColor: colors.cardSoft,
    borderColor: '#e9d5ff',
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 40,
    marginTop: 18,
  },
  timeBlock: {
    borderLeftColor: colors.primary,
    borderLeftWidth: 4,
    marginTop: 18,
    paddingLeft: 14,
  },
  dateText: {
    color: colors.primaryDeep,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
  },
  timeText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 22,
    marginTop: 2,
  },
  capacityCard: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: '#ddd6fe',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    padding: 18,
  },
  capacityCount: {
    color: colors.primaryDeep,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0,
  },
  capacityLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  remainingText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 18,
  },
  infoBlock: {
    backgroundColor: colors.white,
    borderColor: '#e9d5ff',
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 92,
    padding: 16,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 23,
    marginTop: 10,
  },
  section: {
    marginTop: 26,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 26,
  },
  description: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 25,
    marginTop: 10,
  },
  membersWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  memberPill: {
    alignItems: 'center',
    backgroundColor: colors.cardSoft,
    borderColor: '#e9d5ff',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  memberInitial: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
    height: 24,
    lineHeight: 24,
    marginRight: 8,
    overflow: 'hidden',
    textAlign: 'center',
    width: 24,
  },
  memberName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  firstSpotText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: 10,
  },
  actionBar: {
    backgroundColor: colors.background,
    borderTopColor: '#f3e8ff',
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    padding: 20,
    position: 'absolute',
    right: 0,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 58,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.cardSoft,
    borderColor: colors.primary,
  },
  disabledButton: {
    backgroundColor: colors.border,
    borderColor: colors.border,
  },
  pressedButton: {
    opacity: 0.82,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '900',
  },
  primaryActionText: {
    color: colors.white,
  },
  secondaryActionText: {
    color: colors.primaryDeep,
  },
});
