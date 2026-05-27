import { and, asc, desc, eq, gte, lt, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import SessionActionButton from '@/app/classes/SessionActionButton';
import { db } from '@/db';
import { bookings, profiles, schedule, workoutTypes } from '@/db/schema';
import { verifyToken } from '@/lib/auth';

type DashboardPageProps = {
  searchParams?: Promise<{
    page?: string | string[];
  }>;
};

type BreakdownItem = {
  label: string;
  sessions: number;
};

const UPCOMING_PER_PAGE = 4;

const DIFFICULTY_META: Record<
  number,
  { label: string; badgeClass: string }
> = {
  1: { label: 'Easy', badgeClass: 'bg-emerald-50 text-emerald-700' },
  2: { label: 'Intermediate', badgeClass: 'bg-amber-50 text-amber-700' },
  3: { label: 'Advanced', badgeClass: 'bg-rose-50 text-rose-700' },
};

const compactDateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const historyDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const normalizeParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

const normalizePageParam = (value?: string | string[]) => {
  const page = Number(normalizeParam(value));
  return Number.isInteger(page) && page > 0 ? page : 1;
};

const getMonthRange = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
};

function DifficultyBadge({ level }: { level: number }) {
  const meta = DIFFICULTY_META[level] ?? DIFFICULTY_META[1];
  const filledBars = Math.min(3, Math.max(1, level));

  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}
    >
      <span className="flex items-center gap-0.5">
        {Array.from({ length: 3 }).map((_, index) => (
          <span
            key={`dashboard-difficulty-bar-${level}-${index}`}
            className={`h-2 w-1 rounded-full ${
              index < filledBars ? 'bg-current' : 'bg-current/20'
            }`}
          />
        ))}
      </span>
      {meta.label}
    </span>
  );
}

function StatCard({
  value,
  title,
  description,
}: {
  value: number;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-3xl border border-white/70 bg-white/88 p-5 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
        Statistics
      </p>
      <h2 className="mt-2 text-base font-medium text-slate-900">{title}</h2>
      <p className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-2 max-w-52 text-sm leading-5 text-slate-500">
        {description}
      </p>
    </article>
  );
}

function TrainingBreakdown({ items }: { items: BreakdownItem[] }) {
  const maxSessions = Math.max(...items.map((item) => item.sessions), 1);

  return (
    <section className="rounded-3xl border border-white/70 bg-white/88 p-5 shadow-sm backdrop-blur sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          Training Breakdown
        </p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900">
          Most Attended
        </h2>
      </div>

      <div className="mt-6 space-y-5">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-500">
            Complete a few workouts to unlock your training mix.
          </div>
        ) : (
          items.map((item) => {
            const percentage = Math.round((item.sessions / maxSessions) * 100);

            return (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-800">
                    {item.label}
                  </span>
                  <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-indigo-600">
                    {item.sessions}{' '}
                    {item.sessions === 1 ? 'session' : 'sessions'}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-violet-600"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pageItems =
    totalPages <= 3
      ? Array.from({ length: totalPages }, (_, index) => index + 1)
      : Array.from(
          new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])
        ).filter((page) => page >= 1 && page <= totalPages);

  return (
    <nav className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
      <Link
        href={`/dashboard?page=${Math.max(1, currentPage - 1)}`}
        prefetch={false}
        scroll={false}
        aria-disabled={currentPage === 1}
        className={`rounded-full border px-3 py-1.5 font-semibold transition ${
          currentPage === 1
            ? 'pointer-events-none border-slate-100 bg-slate-50 text-slate-400'
            : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-700'
        }`}
      >
        Prev
      </Link>
      {pageItems.map((page, index) => {
        const previousPage = pageItems[index - 1];
        const showGap = previousPage !== undefined && page - previousPage > 1;

        return (
          <span key={`dashboard-page-item-${page}`} className="flex items-center gap-2">
            {showGap ? (
              <span className="px-1 text-sm font-semibold text-slate-400">
                ...
              </span>
            ) : null}
            <Link
              href={`/dashboard?page=${page}`}
              prefetch={false}
              scroll={false}
              className={`flex h-8 min-w-8 items-center justify-center rounded-full border px-2 font-semibold transition ${
                page === currentPage
                  ? 'border-transparent bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-700'
              }`}
            >
              {page}
            </Link>
          </span>
        );
      })}
      <Link
        href={`/dashboard?page=${Math.min(totalPages, currentPage + 1)}`}
        prefetch={false}
        scroll={false}
        aria-disabled={currentPage === totalPages}
        className={`rounded-full border px-3 py-1.5 font-semibold transition ${
          currentPage === totalPages
            ? 'pointer-events-none border-slate-100 bg-slate-50 text-slate-400'
            : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-700'
        }`}
      >
        Next
      </Link>
    </nav>
  );
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const requestedPage = normalizePageParam(resolvedParams?.page);

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const viewer = sessionToken ? await verifyToken(sessionToken) : null;

  if (!viewer) {
    redirect('/login');
  }

  const now = new Date();
  const { start: monthStart, end: nextMonthStart } = getMonthRange(now);

  const activeCompletedFilter = and(
    eq(bookings.userId, viewer.id),
    eq(bookings.status, 'active'),
    lt(schedule.startTime, now)
  );

  const upcomingFilter = and(
    eq(bookings.userId, viewer.id),
    eq(bookings.status, 'active'),
    gte(schedule.startTime, now)
  );

  const [profileRows, monthRows, totalRows, breakdownRows, upcomingCountRows] =
    await Promise.all([
      db
        .select({ fullName: profiles.fullName })
        .from(profiles)
        .where(eq(profiles.id, viewer.id))
        .limit(1),
      db
        .select({ value: sql<number>`count(*)` })
        .from(bookings)
        .innerJoin(schedule, eq(bookings.scheduleId, schedule.id))
        .where(
          and(
            activeCompletedFilter,
            gte(schedule.startTime, monthStart),
            lt(schedule.startTime, nextMonthStart)
          )
        ),
      db
        .select({ value: sql<number>`count(*)` })
        .from(bookings)
        .innerJoin(schedule, eq(bookings.scheduleId, schedule.id))
        .where(activeCompletedFilter),
      db
        .select({
          title: workoutTypes.title,
          sessions: sql<number>`count(*)`,
        })
        .from(bookings)
        .innerJoin(schedule, eq(bookings.scheduleId, schedule.id))
        .innerJoin(workoutTypes, eq(schedule.workoutTypeId, workoutTypes.id))
        .where(activeCompletedFilter)
        .groupBy(workoutTypes.title)
        .orderBy(sql`count(*) desc`)
        .limit(5),
      db
        .select({ value: sql<number>`count(*)` })
        .from(bookings)
        .innerJoin(schedule, eq(bookings.scheduleId, schedule.id))
        .where(upcomingFilter),
    ]);

  const workoutsThisMonth = Number(monthRows[0]?.value ?? 0);
  const totalWorkouts = Number(totalRows[0]?.value ?? 0);
  const upcomingTotal = Number(upcomingCountRows[0]?.value ?? 0);
  const totalPages = Math.max(1, Math.ceil(upcomingTotal / UPCOMING_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);
  const upcomingOffset = (currentPage - 1) * UPCOMING_PER_PAGE;

  const [upcomingBookings, workoutHistory] = await Promise.all([
    db
      .select({
        bookingId: bookings.id,
        scheduleId: schedule.id,
        startTime: schedule.startTime,
        trainerName: schedule.trainerName,
        room: schedule.room,
        title: workoutTypes.title,
        category: workoutTypes.category,
        difficultyLevel: workoutTypes.difficultyLevel,
      })
      .from(bookings)
      .innerJoin(schedule, eq(bookings.scheduleId, schedule.id))
      .innerJoin(workoutTypes, eq(schedule.workoutTypeId, workoutTypes.id))
      .where(upcomingFilter)
      .orderBy(asc(schedule.startTime))
      .limit(UPCOMING_PER_PAGE)
      .offset(upcomingOffset),
    db
      .select({
        bookingId: bookings.id,
        startTime: schedule.startTime,
        title: workoutTypes.title,
        category: workoutTypes.category,
        difficultyLevel: workoutTypes.difficultyLevel,
      })
      .from(bookings)
      .innerJoin(schedule, eq(bookings.scheduleId, schedule.id))
      .innerJoin(workoutTypes, eq(schedule.workoutTypeId, workoutTypes.id))
      .where(activeCompletedFilter)
      .orderBy(desc(schedule.startTime))
      .limit(3),
  ]);

  const fullName = profileRows[0]?.fullName ?? viewer.fullName;
  const breakdown = breakdownRows.map((item) => ({
    label: item.title,
    sessions: Number(item.sessions),
  }));

  return (
    <div className="bg-slate-50 pb-16">
      <main className="mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6 lg:px-10">
        <div className="rounded-3xl bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.24),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.22),_transparent_42%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_45%,_#faf5ff_100%)] p-4 shadow-xl shadow-slate-200/70 sm:p-8">
          <section className="rounded-3xl border border-white/70 bg-white/78 px-8 py-10 shadow-sm backdrop-blur sm:px-10">
            <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-600">
              Dashboard
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Welcome back, {fullName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
              Track your bookings, training rhythm, and recent progress in one
              place.
            </p>
          </section>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <aside className="space-y-6 lg:col-span-1">
            <section className="rounded-3xl border border-white/70 bg-white/88 p-5 shadow-sm backdrop-blur sm:p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                Quick Actions
              </p>
              <h2 className="mt-2 text-base font-medium text-slate-900">
                Ready for your next workout?
              </h2>
              <Link
                href="/schedule"
                prefetch={false}
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              >
                Book a New Class
              </Link>
            </section>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <StatCard
                value={workoutsThisMonth}
                title="Workouts this Month"
                description="Sessions scheduled in the current month."
              />
              <StatCard
                value={totalWorkouts}
                title="Total Workouts"
                description="Completed sessions in your training history."
              />
            </div>

            <TrainingBreakdown items={breakdown} />
          </aside>

          <section className="space-y-6 lg:col-span-2">
            <section className="rounded-3xl border border-white/70 bg-white/88 p-5 shadow-sm backdrop-blur sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                    Upcoming Bookings
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900">
                    Next sessions
                  </h2>
                </div>
                <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-violet-100 px-2 text-sm font-semibold text-indigo-600">
                  {upcomingTotal}
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {upcomingBookings.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                    <h3 className="text-base font-semibold text-slate-900">
                      No upcoming sessions
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Your next booking will appear here as soon as it is
                      reserved.
                    </p>
                    <Link
                      href="/schedule"
                      prefetch={false}
                      className="mt-5 inline-flex rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                    >
                      Book a New Class
                    </Link>
                  </div>
                ) : (
                  upcomingBookings.map((booking) => (
                    <article
                      key={booking.bookingId}
                      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
                        <div>
                          <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-indigo-600">
                            {booking.category}
                          </span>
                          <h3 className="mt-3 text-base font-bold text-slate-950">
                            {booking.title}
                          </h3>
                          <p className="mt-2 text-sm text-slate-500">
                            {compactDateFormatter.format(booking.startTime)}{' '}
                            &bull; {timeFormatter.format(booking.startTime)}{' '}
                            &bull; {booking.trainerName} &bull; {booking.room}
                          </p>
                        </div>
                        <div className="flex flex-col items-start gap-3 sm:items-end">
                          <DifficultyBadge level={booking.difficultyLevel} />
                          <SessionActionButton
                            scheduleId={booking.scheduleId}
                            variant="cancel"
                            className="mt-0 border-slate-200 bg-white px-4 py-2 text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                          />
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>

              <Pagination currentPage={currentPage} totalPages={totalPages} />
            </section>

            <section className="rounded-3xl border border-white/70 bg-white/88 p-5 shadow-sm backdrop-blur sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                    Workout History
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900">
                    Last 3 sessions
                  </h2>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {workoutHistory.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-500">
                    Completed workouts will appear here after your first class.
                  </div>
                ) : (
                  workoutHistory.map((workout) => (
                    <article
                      key={workout.bookingId}
                      className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 opacity-75"
                    >
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                            {workout.category}
                          </p>
                          <h3 className="mt-1 text-base font-bold text-slate-900">
                            {workout.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {historyDateFormatter.format(workout.startTime)}
                          </p>
                        </div>
                        <DifficultyBadge level={workout.difficultyLevel} />
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </section>
        </div>
        </div>
      </main>
    </div>
  );
}
