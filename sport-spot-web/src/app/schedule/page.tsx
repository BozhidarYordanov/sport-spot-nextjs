import { and, asc, eq, gte, lt, lte, sql } from 'drizzle-orm';
import Link from 'next/link';
import { cookies } from 'next/headers';

import SessionActionButton from '@/app/classes/SessionActionButton';
import { db } from '@/db';
import { bookings, schedule, workoutTypes } from '@/db/schema';
import { verifyToken } from '@/lib/auth';
import RollingCalendar from './RollingCalendar';

type SchedulePageProps = {
  searchParams?: Promise<{
    date?: string | string[];
    sessionsPage?: string | string[];
    reservationsPage?: string | string[];
  }>;
};

const SESSIONS_PER_PAGE = 4;
const RESERVATIONS_PER_PAGE = 7;

const DIFFICULTY_META: Record<
  number,
  { label: string; badgeClass: string }
> = {
  1: { label: 'Easy', badgeClass: 'bg-emerald-50 text-emerald-700' },
  2: { label: 'Intermediate', badgeClass: 'bg-amber-50 text-amber-700' },
  3: { label: 'Advanced', badgeClass: 'bg-rose-50 text-rose-700' },
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

const normalizePageParam = (value?: string | string[]) => {
  const page = Number(normalizeParam(value));
  return Number.isInteger(page) && page > 0 ? page : 1;
};

const isDateKey = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const parseDateKey = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};

const getDayRange = (dateKey: string) => {
  const start = parseDateKey(dateKey);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const selectedDateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

const compactDateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

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
            key={`difficulty-bar-${level}-${index}`}
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

function Pagination({
  currentPage,
  totalPages,
  buildHref,
}: {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
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
        href={buildHref(Math.max(1, currentPage - 1))}
        scroll={false}
        aria-disabled={currentPage === 1}
        className={`rounded-full border px-3 py-1.5 font-semibold transition ${
          currentPage === 1
            ? 'pointer-events-none border-slate-100 bg-slate-50 text-slate-400'
            : 'border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-700'
        }`}
      >
        Prev
      </Link>

      {pageItems.map((page, index) => {
        const previousPage = pageItems[index - 1];
        const showGap = previousPage !== undefined && page - previousPage > 1;

        return (
          <span key={`schedule-page-item-${page}`} className="flex items-center gap-2">
            {showGap ? (
              <span className="px-1 text-sm font-semibold text-slate-400">
                ...
              </span>
            ) : null}
            <Link
              href={buildHref(page)}
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
        href={buildHref(Math.min(totalPages, currentPage + 1))}
        scroll={false}
        aria-disabled={currentPage === totalPages}
        className={`rounded-full border px-3 py-1.5 font-semibold transition ${
          currentPage === totalPages
            ? 'pointer-events-none border-slate-100 bg-slate-50 text-slate-400'
            : 'border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-700'
        }`}
      >
        Next
      </Link>
    </nav>
  );
}

export default async function SchedulePage({ searchParams }: SchedulePageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const today = toDateKey(new Date());
  const requestedDate = normalizeParam(resolvedParams?.date).trim();
  const normalizedRequestedDate = isDateKey(requestedDate)
    ? requestedDate
    : toDateKey(new Date());
  const selectedDate =
    normalizedRequestedDate < today ? today : normalizedRequestedDate;
  const { start: selectedDayStart, end: selectedDayEnd } =
    getDayRange(selectedDate);

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const viewer = sessionToken ? await verifyToken(sessionToken) : null;
  const now = new Date();
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const selectedDateLabel = selectedDateFormatter.format(selectedDayStart);
  const sessionStartBoundary = selectedDate === today ? now : selectedDayStart;
  const requestedSessionsPage = normalizePageParam(
    resolvedParams?.sessionsPage
  );
  const requestedReservationsPage = normalizePageParam(
    resolvedParams?.reservationsPage
  );

  const [sessionsTotalRows, reservationsTotalRows] = await Promise.all([
    db
      .select({ value: sql<number>`count(*)` })
      .from(schedule)
      .where(
        and(
          gte(schedule.startTime, sessionStartBoundary),
          lt(schedule.startTime, selectedDayEnd)
        )
      )
      .then((rows) => rows[0]?.value ?? 0),
    viewer
      ? db
          .select({ value: sql<number>`count(*)` })
          .from(bookings)
          .innerJoin(schedule, eq(bookings.scheduleId, schedule.id))
          .where(
            and(
              eq(bookings.userId, viewer.id),
              eq(bookings.status, 'active'),
              gte(schedule.startTime, now),
              lte(schedule.startTime, sevenDaysFromNow)
            )
          )
          .then((rows) => rows[0]?.value ?? 0)
      : Promise.resolve(0),
  ]);
  const totalSessions = Number(sessionsTotalRows);
  const totalReservations = Number(reservationsTotalRows);
  const sessionsTotalPages = Math.max(
    1,
    Math.ceil(totalSessions / SESSIONS_PER_PAGE)
  );
  const reservationsTotalPages = Math.max(
    1,
    Math.ceil(totalReservations / RESERVATIONS_PER_PAGE)
  );
  const sessionsPage = Math.min(requestedSessionsPage, sessionsTotalPages);
  const reservationsPage = Math.min(
    requestedReservationsPage,
    reservationsTotalPages
  );
  const sessionsOffset = (sessionsPage - 1) * SESSIONS_PER_PAGE;
  const reservationsOffset = (reservationsPage - 1) * RESERVATIONS_PER_PAGE;
  const buildPageHref = (
    pageType: 'sessionsPage' | 'reservationsPage',
    page: number
  ) => {
    const params = new URLSearchParams({ date: selectedDate });
    const nextSessionsPage =
      pageType === 'sessionsPage' ? page : sessionsPage;
    const nextReservationsPage =
      pageType === 'reservationsPage' ? page : reservationsPage;

    if (nextSessionsPage > 1) {
      params.set('sessionsPage', String(nextSessionsPage));
    }

    if (nextReservationsPage > 1) {
      params.set('reservationsPage', String(nextReservationsPage));
    }

    return `/schedule?${params.toString()}`;
  };

  const [sessions, upcomingBookings] = await Promise.all([
    db
      .select({
        id: schedule.id,
        startTime: schedule.startTime,
        trainerName: schedule.trainerName,
        room: schedule.room,
        capacity: schedule.capacity,
        enrolledCount: schedule.enrolledCount,
        title: workoutTypes.title,
        difficultyLevel: workoutTypes.difficultyLevel,
        bookingId: bookings.id,
      })
      .from(schedule)
      .innerJoin(workoutTypes, eq(schedule.workoutTypeId, workoutTypes.id))
      .leftJoin(
        bookings,
        viewer
          ? and(
              eq(bookings.scheduleId, schedule.id),
              eq(bookings.userId, viewer.id),
              eq(bookings.status, 'active')
            )
          : sql`false`
      )
      .where(
        and(
          gte(schedule.startTime, sessionStartBoundary),
          lt(schedule.startTime, selectedDayEnd)
        )
      )
      .orderBy(asc(schedule.startTime))
      .limit(SESSIONS_PER_PAGE)
      .offset(sessionsOffset),
    viewer
      ? db
          .select({
            id: bookings.id,
            startTime: schedule.startTime,
            trainerName: schedule.trainerName,
            title: workoutTypes.title,
            difficultyLevel: workoutTypes.difficultyLevel,
          })
          .from(bookings)
          .innerJoin(schedule, eq(bookings.scheduleId, schedule.id))
          .innerJoin(workoutTypes, eq(schedule.workoutTypeId, workoutTypes.id))
          .where(
            and(
              eq(bookings.userId, viewer.id),
              eq(bookings.status, 'active'),
              gte(schedule.startTime, now),
              lte(schedule.startTime, sevenDaysFromNow)
            )
          )
          .orderBy(asc(schedule.startTime))
          .limit(RESERVATIONS_PER_PAGE)
          .offset(reservationsOffset)
      : Promise.resolve([]),
  ]);

  return (
    <div className="bg-slate-50 pb-16">
      <main className="mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6 lg:px-10">
        <div className="rounded-3xl bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.24),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.22),_transparent_42%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_45%,_#faf5ff_100%)] p-4 shadow-xl shadow-slate-200/70 sm:p-8">
          <section className="rounded-3xl border border-white/70 bg-white/78 px-8 py-10 shadow-sm backdrop-blur sm:px-10">
            <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-600">
              Weekly Rolling Calendar
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Book your next training session
            </h1>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Switch days quickly and reserve slots in one flow.
            </p>
          </section>

          <div className="mt-5">
            <RollingCalendar selectedDate={selectedDate} />
          </div>

          <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <div className="rounded-3xl border border-white/70 bg-white/88 p-5 shadow-sm backdrop-blur sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  Sessions &bull; {selectedDateLabel}
                </h2>
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-indigo-600">
                  {totalSessions} {totalSessions === 1 ? 'session' : 'sessions'}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {sessions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-500">
                    No sessions are scheduled for this day.
                  </div>
                ) : (
                  sessions.map((session) => {
                    const availability = Math.max(
                      0,
                      session.capacity - session.enrolledCount
                    );
                    const isBooked = Boolean(session.bookingId);

                    return (
                      <article
                        key={session.id}
                        className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
                          <div>
                            <p className="text-sm font-semibold text-violet-600">
                              {timeFormatter.format(session.startTime)}
                            </p>
                            <h3 className="mt-1 text-base font-bold text-slate-950">
                              {session.title}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {session.trainerName} &bull; {session.room}
                            </p>
                            <div className="mt-3">
                              <DifficultyBadge level={session.difficultyLevel} />
                            </div>
                          </div>

                          <div className="flex flex-col items-start gap-3 sm:items-end">
                            <span className="rounded-full border border-indigo-100 bg-white px-4 py-1 text-xs font-medium text-indigo-600">
                              {availability} spots available
                            </span>
                            {isBooked ? (
                              <>
                                <span className="text-xs font-bold text-fuchsia-600">
                                  Booked
                                </span>
                                <SessionActionButton
                                  scheduleId={session.id}
                                  variant="cancel"
                                  className="mt-0 border-rose-400 bg-white px-4 py-2 text-rose-600 hover:bg-rose-50"
                                />
                              </>
                            ) : viewer ? (
                              <SessionActionButton
                                scheduleId={session.id}
                                variant="book"
                                className="mt-0 min-w-32 justify-center px-7 py-2"
                              />
                            ) : (
                              <Link
                                href="/login"
                                className="mt-0 inline-flex min-w-32 justify-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                              >
                                Reserve
                              </Link>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>

              <Pagination
                currentPage={sessionsPage}
                totalPages={sessionsTotalPages}
                buildHref={(page) => buildPageHref('sessionsPage', page)}
              />
            </div>

            <aside className="rounded-3xl border border-white/70 bg-white/88 p-5 shadow-sm backdrop-blur sm:p-6 lg:sticky lg:top-6 lg:self-start">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-medium text-slate-900">
                  Your Next 7 Days
                </h2>
                <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-violet-100 px-2 text-sm font-semibold text-indigo-600">
                  {totalReservations}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {upcomingBookings.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    No upcoming reservations yet.
                  </div>
                ) : (
                  upcomingBookings.map((booking) => (
                    <article
                      key={booking.id}
                      className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs font-bold uppercase text-violet-600">
                          {compactDateFormatter.format(booking.startTime)},{' '}
                          {timeFormatter.format(booking.startTime)}
                        </p>
                        <DifficultyBadge level={booking.difficultyLevel} />
                      </div>
                      <h3 className="mt-2 text-sm font-bold text-slate-950">
                        {booking.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {booking.trainerName}
                      </p>
                    </article>
                  ))
                )}
              </div>

              <Pagination
                currentPage={reservationsPage}
                totalPages={reservationsTotalPages}
                buildHref={(page) => buildPageHref('reservationsPage', page)}
              />
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
}
