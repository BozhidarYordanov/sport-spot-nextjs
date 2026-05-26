import { and, asc, eq, gte, inArray, sql } from 'drizzle-orm';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import SessionActionButton from '@/app/classes/SessionActionButton';
import { db } from '@/db';
import { bookings, schedule, workoutTypes } from '@/db/schema';
import { verifyToken } from '@/lib/auth';

type ClassDetailsPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string | string[] }>;
};

const DIFFICULTY_META: Record<
  number,
  { label: string; badgeClass: string }
> = {
  1: { label: 'Easy', badgeClass: 'bg-emerald-50 text-emerald-700' },
  2: { label: 'Intermediate', badgeClass: 'bg-amber-50 text-amber-700' },
  3: { label: 'Advanced', badgeClass: 'bg-rose-50 text-rose-700' },
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const formatSessionDateTime = (value: Date) =>
  `${dateFormatter.format(value)}, ${timeFormatter.format(value)}`;

const parseList = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return [] as string[];
  }

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // Fall back to string splitting when JSON parsing fails.
    }
  }

  return trimmed
    .split(/[\n,;|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const ensureList = (value: string) => {
  const items = parseList(value);
  if (items.length > 0) {
    return items;
  }

  const trimmed = value.trim();
  return trimmed ? [trimmed] : [];
};

const normalizeParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

export default async function ClassDetailsPage({
  params,
  searchParams,
}: ClassDetailsPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const pageValue = normalizeParam(resolvedSearchParams?.page).trim();

  const workout = await db
    .select({
      id: workoutTypes.id,
      title: workoutTypes.title,
      description: workoutTypes.description,
      descriptionLong: workoutTypes.descriptionLong,
      durationMinutes: workoutTypes.durationMinutes,
      difficultyLevel: workoutTypes.difficultyLevel,
      suitableFor: workoutTypes.suitableFor,
      whatToBring: workoutTypes.whatToBring,
      category: workoutTypes.category,
      imageUrl: workoutTypes.imageUrl,
    })
    .from(workoutTypes)
    .where(eq(workoutTypes.slug, slug))
    .limit(1)
    .then((rows) => rows[0]);

  if (!workout) {
    notFound();
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const viewer = sessionToken ? await verifyToken(sessionToken) : null;

  const now = new Date();
  const sessionsPerPage = 4;
  const totalRows = await db
    .select({ value: sql<number>`count(*)` })
    .from(schedule)
    .innerJoin(workoutTypes, eq(schedule.workoutTypeId, workoutTypes.id))
    .where(
      and(eq(workoutTypes.id, workout.id), gte(schedule.startTime, now))
    )
    .then((rows) => rows[0]?.value ?? 0);

  const totalSessions = Number(totalRows);
  const totalPages = Math.max(1, Math.ceil(totalSessions / sessionsPerPage));
  const currentPage = Math.min(
    totalPages,
    Math.max(1, Number(pageValue) || 1)
  );
  const offset = (currentPage - 1) * sessionsPerPage;

  const upcomingSessions = await db
    .select({
      id: schedule.id,
      startTime: schedule.startTime,
      trainerName: schedule.trainerName,
      room: schedule.room,
      capacity: schedule.capacity,
      enrolledCount: schedule.enrolledCount,
    })
    .from(schedule)
    .innerJoin(workoutTypes, eq(schedule.workoutTypeId, workoutTypes.id))
    .where(
      and(eq(workoutTypes.id, workout.id), gte(schedule.startTime, now))
    )
    .orderBy(asc(schedule.startTime))
    .limit(sessionsPerPage)
    .offset(offset);

  const scheduleIds = upcomingSessions.map((session) => session.id);
  const activeBookings = viewer && scheduleIds.length > 0
    ? await db
        .select({ scheduleId: bookings.scheduleId })
        .from(bookings)
        .where(
          and(
            eq(bookings.status, 'active'),
            eq(bookings.userId, viewer.id),
            inArray(bookings.scheduleId, scheduleIds)
          )
        )
    : [];
  const bookedScheduleIds = new Set(
    activeBookings.map((booking) => booking.scheduleId)
  );
  const difficulty = DIFFICULTY_META[workout.difficultyLevel] ??
    DIFFICULTY_META[1];
  const filledBars = Math.min(3, Math.max(1, workout.difficultyLevel));
  const suitableForItems = ensureList(workout.suitableFor);
  const whatToBringItems = ensureList(workout.whatToBring);
  const paginationWindow = 3;
  const halfWindow = Math.floor(paginationWindow / 2);
  let startPage = Math.max(1, currentPage - halfWindow);
  const endPage = Math.min(totalPages, startPage + paginationWindow - 1);
  startPage = Math.max(1, endPage - paginationWindow + 1);
  const pageNumbers = Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => startPage + index
  );
  const showFirst = startPage > 1;
  const showLast = endPage < totalPages;
  const buildPageHref = (page: number) =>
    page === 1 ? `/classes/${slug}` : `/classes/${slug}?page=${page}`;
  const isLoggedIn = Boolean(viewer);

  return (
    <div className="bg-slate-50 pb-20">
      <section className="mx-auto w-full max-w-6xl px-6 pt-10">
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-slate-900/5 shadow-xl shadow-slate-100/60">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${workout.imageUrl})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/35 to-transparent" />
              <div className="relative px-8 py-10 sm:px-10">
                <span className="inline-flex w-fit items-center rounded-full border border-white/50 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
                  Class Details
                </span>
                <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {workout.title}
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-white/80 sm:text-base">
                  {workout.description}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-100/50">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                What is this workout?
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                {workout.descriptionLong}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-100/50">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Suitable For
                </p>
                <div className="mt-4 space-y-3">
                  {suitableForItems.map((item, index) => (
                    <div
                      key={`suitable-for-${index}`}
                      className="flex items-start gap-3 text-sm text-slate-700"
                    >
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-3.5 w-3.5"
                        >
                          <path
                            d="m5 12 4 4L19 6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-100/50">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  What to Bring
                </p>
                <div className="mt-4 space-y-3">
                  {whatToBringItems.map((item, index) => (
                    <div
                      key={`what-to-bring-${index}`}
                      className="flex items-start gap-3 text-sm text-slate-700"
                    >
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-3.5 w-3.5"
                        >
                          <path
                            d="m5 12 4 4L19 6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-100/50">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                Upcoming Sessions
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${difficulty.badgeClass}`}
                >
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <span
                        key={`difficulty-bar-${index}`}
                        className={`h-2 w-1 rounded-full ${
                          index < filledBars ? 'bg-current' : 'bg-current/20'
                        }`}
                      />
                    ))}
                  </span>
                  {difficulty.label}
                </span>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  {workout.durationMinutes} min
                </span>
              </div>

              {upcomingSessions.length > 0 ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {upcomingSessions.map((session) => {
                    const availability = Math.max(
                      0,
                      session.capacity - session.enrolledCount
                    );
                    const isBooked = bookedScheduleIds.has(session.id);
                    const guestButtonClass =
                      'mt-4 w-fit cursor-pointer rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl';

                    return (
                      <div
                        key={session.id}
                        className="flex h-full w-full flex-col rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {formatSessionDateTime(session.startTime)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {session.trainerName} | {session.room}
                        </p>
                        <p className="mt-3 text-sm font-semibold text-emerald-600">
                          {availability} spots available
                        </p>
                        {isLoggedIn ? (
                          <SessionActionButton
                            scheduleId={session.id}
                            variant={isBooked ? 'cancel' : 'book'}
                          />
                        ) : (
                          <Link href="/login" className={guestButtonClass}>
                            Book Session
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-sky-200 bg-sky-50/40 px-4 py-4 text-sm text-slate-600">
                  No upcoming sessions for this class right now.
                </div>
              )}

              {totalPages > 1 ? (
                <div className="mt-5 flex items-center justify-between gap-3 text-sm">
                  {currentPage > 1 ? (
                    <Link
                      href={buildPageHref(currentPage - 1)}
                      scroll={false}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-700"
                    >
                      Prev
                    </Link>
                  ) : (
                    <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 font-semibold text-slate-400">
                      Prev
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    {showFirst ? (
                      <>
                        <Link
                          href={buildPageHref(1)}
                          scroll={false}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-700"
                        >
                          1
                        </Link>
                        <span className="text-slate-400">...</span>
                      </>
                    ) : null}

                    {pageNumbers.map((page) => (
                      <Link
                        key={`session-page-${page}`}
                        href={buildPageHref(page)}
                        scroll={false}
                        className={`rounded-full border px-3 py-1.5 font-semibold transition ${
                          page === currentPage
                            ? 'border-transparent bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-200'
                            : 'border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-700'
                        }`}
                      >
                        {page}
                      </Link>
                    ))}

                    {showLast ? (
                      <>
                        <span className="text-slate-400">...</span>
                        <Link
                          href={buildPageHref(totalPages)}
                          scroll={false}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-700"
                        >
                          {totalPages}
                        </Link>
                      </>
                    ) : null}
                  </div>

                  {currentPage < totalPages ? (
                    <Link
                      href={buildPageHref(currentPage + 1)}
                      scroll={false}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-700"
                    >
                      Next
                    </Link>
                  ) : (
                    <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 font-semibold text-slate-400">
                      Next
                    </span>
                  )}
                </div>
              ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
