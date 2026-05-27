import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';

const PAGE_SIZE = 10;
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
  workout: Workout;
};

type SessionsResponse = {
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  items?: Session[];
};

const badgeColors = ['#fce7f3', '#dcfce7', '#e0f2fe', '#fef3c7', '#ede9fe'];

function formatStartTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Time to be confirmed';
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function getBadgeColor(category: string) {
  const hash = category.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return badgeColors[hash % badgeColors.length];
}

export default function SessionsScreen() {
  const { token, user, isLoading: isAuthLoading } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fetchedPages = useRef(new Set<number>());

  const canFetch = useMemo(() => Boolean(API_BASE_URL && token), [token]);

  const fetchSessions = useCallback(
    async (targetPage: number, shouldRefresh = false) => {
      if (!API_BASE_URL) {
        setErrorMessage('Missing API configuration.');
        return;
      }

      if (!token) {
        setErrorMessage('Please sign in to view classes.');
        return;
      }

      if (!shouldRefresh && fetchedPages.current.has(targetPage)) {
        return;
      }

      try {
        if (shouldRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        setErrorMessage(null);

        const response = await fetch(`${API_BASE_URL}/sessions?page=${targetPage}&pageSize=${PAGE_SIZE}`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const data = (await response.json()) as SessionsResponse;

        if (!response.ok) {
          throw new Error('Unable to load classes. Please try again.');
        }

        const nextItems = Array.isArray(data.items) ? data.items : [];
        fetchedPages.current.add(targetPage);

        setSessions((current) => (targetPage === 1 ? nextItems : [...current, ...nextItems]));
        setHasMore(typeof data.totalPages === 'number' ? targetPage < data.totalPages : nextItems.length === PAGE_SIZE);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load classes. Please try again.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (canFetch) {
      void Promise.resolve().then(() => fetchSessions(page));
    }
  }, [canFetch, fetchSessions, page]);

  const handleRefresh = useCallback(() => {
    fetchedPages.current.clear();
    setHasMore(true);
    setPage(1);
    setSessions([]);
    fetchSessions(1, true);
  }, [fetchSessions]);

  const handleEndReached = useCallback(() => {
    if (isLoading || isRefreshing || !hasMore || sessions.length === 0) {
      return;
    }

    setPage((currentPage) => currentPage + 1);
  }, [hasMore, isLoading, isRefreshing, sessions.length]);

  const renderSession = useCallback(({ item }: { item: Session }) => {
    const category = item.workout.category || 'Training';
    const filledCount = Math.min(item.enrolledCount, item.capacity);

    return (
      <TouchableOpacity
        activeOpacity={0.86}
        style={styles.card}
        onPress={() => router.push({ pathname: '/session-details', params: { id: String(item.id) } })}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: getBadgeColor(category) }]}>
            <Text style={styles.badgeText}>{category}</Text>
          </View>
          <Text style={styles.time}>{formatStartTime(item.startTime)}</Text>
        </View>

        <Text style={styles.title}>{item.workout.title}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Trainer</Text>
          <Text style={styles.metaValue}>{item.trainerName}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Room</Text>
          <Text style={styles.metaValue}>{item.room}</Text>
        </View>

        <View style={styles.capacityBlock}>
          <View style={styles.capacityTrack}>
            <View style={[styles.capacityFill, { width: `${item.capacity > 0 ? (filledCount / item.capacity) * 100 : 0}%` }]} />
          </View>
          <Text style={styles.capacityText}>
            {filledCount} / {item.capacity} spots filled
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, []);

  const renderEmpty = useCallback(() => {
    if (isLoading && sessions.length === 0) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No classes scheduled for today.</Text>
        <Text style={styles.emptyBody}>{errorMessage ?? 'Pull down to refresh the schedule.'}</Text>
      </View>
    );
  }, [errorMessage, isLoading, sessions.length]);

  if (isAuthLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.lockedState}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!token || !user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.lockedState}>
          <View style={styles.lockBadge}>
            <Text style={styles.lockIcon}>Lock</Text>
          </View>
          <Text style={styles.lockedTitle}>Access the Schedule</Text>
          <Text style={styles.lockedBody}>
            Sign in to view available fitness classes, track capacities, and secure your training spots.
          </Text>
          <TouchableOpacity activeOpacity={0.86} style={styles.signInButton} onPress={() => router.push('/login')}>
            <Text style={styles.signInButtonText}>Sign In Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        contentContainerStyle={[styles.listContent, sessions.length === 0 && styles.emptyContent]}
        data={sessions}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          isLoading && sessions.length > 0 ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Schedule</Text>
            <Text style={styles.screenTitle}>Classes</Text>
          </View>
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.35}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            tintColor={colors.primary}
            colors={[colors.primary]}
            onRefresh={handleRefresh}
          />
        }
        renderItem={renderSession}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 20,
    paddingBottom: 32,
  },
  emptyContent: {
    flexGrow: 1,
  },
  header: {
    marginBottom: 18,
    paddingTop: 10,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  screenTitle: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 40,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: '#e9d5ff',
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 14,
    padding: 18,
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  time: {
    color: colors.textMuted,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 12,
    textAlign: 'right',
  },
  title: {
    color: colors.primaryDeep,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 28,
    marginBottom: 16,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metaLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  metaValue: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 14,
    textAlign: 'right',
  },
  capacityBlock: {
    marginTop: 18,
  },
  capacityTrack: {
    backgroundColor: colors.white,
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
  },
  capacityFill: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: '100%',
  },
  capacityText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 22,
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
  footerLoader: {
    paddingVertical: 18,
  },
  lockedState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  lockBadge: {
    alignItems: 'center',
    backgroundColor: colors.cardSoft,
    borderColor: '#e9d5ff',
    borderRadius: 28,
    borderWidth: 1,
    height: 76,
    justifyContent: 'center',
    marginBottom: 22,
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    width: 76,
  },
  lockIcon: {
    color: colors.primaryDeep,
    fontSize: 13,
    fontWeight: '900',
  },
  lockedTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 34,
    textAlign: 'center',
  },
  lockedBody: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
    maxWidth: 340,
    textAlign: 'center',
  },
  signInButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    marginTop: 26,
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: 30,
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
  },
  signInButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
});
