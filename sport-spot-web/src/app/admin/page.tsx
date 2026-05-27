import Link from 'next/link';
import { redirect } from 'next/navigation';
import { and, asc, desc, eq, gte, ilike, or, sql } from 'drizzle-orm';

import { db } from '@/db';
import { bookings, profiles, schedule, workoutTypes } from '@/db/schema';
import { getSession } from '@/lib/auth';
import DebouncedSearch from '@/components/DebouncedSearch';
import AdminCancelBookingButton from './AdminCancelBookingButton';
import AdminDeleteUserButton from './AdminDeleteUserButton';
import AdminSchedulePanel from './AdminSchedulePanel';
import AdminWorkoutTypesPanel from './AdminWorkoutTypesPanel';

type AdminPageProps = {
  searchParams?: Promise<{
    tab?: string | string[];
    search?: string | string[];
    page?: string | string[];
  }>;
};

const BOOKINGS_PER_PAGE = 10;
const REGISTRATIONS_PER_PAGE = 10;
const WORKOUT_TYPES_PER_PAGE = 10;
const SCHEDULE_SESSIONS_PER_PAGE = 10;

const tabs = [
  { label: 'Bookings', value: 'bookings', href: '/admin' },
  {
    label: 'Registrations',
    value: 'registrations',
    href: '/admin?tab=registrations',
  },
  {
    label: 'Manage Workout Types',
    value: 'workouts',
    href: '/admin?tab=workouts',
  },
  { label: 'Manage Schedule', value: 'schedule', href: '/admin?tab=schedule' },
];

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const normalizeParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

const normalizePageParam = (value?: string | string[]) => {
  const page = Number(normalizeParam(value));
  return Number.isInteger(page) && page > 0 ? page : 1;
};

const formatBookingDate = (date: Date) =>
  dateFormatter.format(date).replace(',', ',');

const registrationDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function Pagination({
  currentPage,
  totalPages,
  search = '',
  tab = 'bookings',
}: {
  currentPage: number;
  totalPages: number;
  search?: string;
  tab?: string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const buildHref = (page: number) => {
    const params = new URLSearchParams();

    if (tab !== 'bookings') {
      params.set('tab', tab);
    }

    if (search) {
      params.set('search', search);
    }

    if (page > 1) {
      params.set('page', String(page));
    }

    const queryString = params.toString();
    return queryString ? `/admin?${queryString}` : '/admin';
  };

  const pageItems =
    totalPages <= 5
      ? Array.from({ length: totalPages }, (_, index) => index + 1)
      : Array.from(
          new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])
        ).filter((page) => page >= 1 && page <= totalPages);

  return (
    <nav className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm">
      <Link
        href={buildHref(Math.max(1, currentPage - 1))}
        scroll={false}
        aria-disabled={currentPage === 1}
        aria-label="Previous page"
        className={`flex h-8 min-w-8 items-center justify-center rounded-full border px-2 font-semibold transition ${
          currentPage === 1
            ? 'pointer-events-none border-slate-100 bg-slate-50 text-slate-300'
            : 'border-indigo-100 bg-white text-violet-700 hover:-translate-y-0.5 hover:bg-violet-50'
        }`}
      >
        &lt;
      </Link>

      {pageItems.map((page, index) => {
        const previousPage = pageItems[index - 1];
        const showGap = previousPage !== undefined && page - previousPage > 1;

        return (
          <span key={`admin-bookings-page-${page}`} className="flex items-center gap-2">
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
                  ? 'border-transparent bg-violet-600 text-white shadow-md shadow-violet-200'
                  : 'border-indigo-100 bg-white text-violet-700 hover:-translate-y-0.5 hover:bg-violet-50'
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
        aria-label="Next page"
        className={`flex h-8 min-w-8 items-center justify-center rounded-full border px-2 font-semibold transition ${
          currentPage === totalPages
            ? 'pointer-events-none border-slate-100 bg-slate-50 text-slate-300'
            : 'border-indigo-100 bg-white text-violet-700 hover:-translate-y-0.5 hover:bg-violet-50'
        }`}
      >
        &gt;
      </Link>
    </nav>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await getSession();

  if (session?.role !== 'admin') {
    redirect(session ? '/' : '/login');
  }

  const resolvedParams = searchParams ? await searchParams : undefined;
  const requestedTab = normalizeParam(resolvedParams?.tab);
  const activeTab = ['registrations', 'workouts', 'schedule'].includes(requestedTab)
    ? requestedTab
    : 'bookings';
  const search = normalizeParam(resolvedParams?.search).trim();
  const requestedPage = normalizePageParam(resolvedParams?.page);
  const now = new Date();
  const last24Hours = new Date(now);
  last24Hours.setHours(last24Hours.getHours() - 24);
  const last7Days = new Date(now);
  last7Days.setDate(last7Days.getDate() - 7);
  const last30Days = new Date(now);
  last30Days.setDate(last30Days.getDate() - 30);
  const searchCondition = search
    ? or(
        ilike(profiles.fullName, `%${search}%`),
        ilike(workoutTypes.title, `%${search}%`)
      )
    : undefined;
  const bookingFilters = and(
    eq(bookings.status, 'active'),
    gte(schedule.startTime, now),
    searchCondition
  );

  const totalRows = await db
    .select({ value: sql<number>`count(*)` })
    .from(bookings)
    .innerJoin(profiles, eq(bookings.userId, profiles.id))
    .innerJoin(schedule, eq(bookings.scheduleId, schedule.id))
    .innerJoin(workoutTypes, eq(schedule.workoutTypeId, workoutTypes.id))
    .where(bookingFilters)
    .then((rows) => rows[0]?.value ?? 0);

  const totalBookings = Number(totalRows);
  const totalPages = Math.max(1, Math.ceil(totalBookings / BOOKINGS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * BOOKINGS_PER_PAGE;

  const upcomingBookings = await db
    .select({
      id: bookings.id,
      startTime: schedule.startTime,
      userName: profiles.fullName,
      workoutTitle: workoutTypes.title,
    })
    .from(bookings)
    .innerJoin(profiles, eq(bookings.userId, profiles.id))
    .innerJoin(schedule, eq(bookings.scheduleId, schedule.id))
    .innerJoin(workoutTypes, eq(schedule.workoutTypeId, workoutTypes.id))
    .where(bookingFilters)
    .orderBy(asc(schedule.startTime), asc(profiles.fullName))
    .limit(BOOKINGS_PER_PAGE)
    .offset(offset);

  const [
    registrationsLast24Hours,
    registrationsLast7Days,
    registrationsLast30Days,
    registrationsLifetime,
  ] = await Promise.all([
    db
      .select({ value: sql<number>`count(*)` })
      .from(profiles)
      .where(gte(profiles.createdAt, last24Hours))
      .then((rows) => Number(rows[0]?.value ?? 0)),
    db
      .select({ value: sql<number>`count(*)` })
      .from(profiles)
      .where(gte(profiles.createdAt, last7Days))
      .then((rows) => Number(rows[0]?.value ?? 0)),
    db
      .select({ value: sql<number>`count(*)` })
      .from(profiles)
      .where(gte(profiles.createdAt, last30Days))
      .then((rows) => Number(rows[0]?.value ?? 0)),
    db
      .select({ value: sql<number>`count(*)` })
      .from(profiles)
      .then((rows) => Number(rows[0]?.value ?? 0)),
  ]);
  const registrationsTotalPages = Math.max(
    1,
    Math.ceil(registrationsLifetime / REGISTRATIONS_PER_PAGE)
  );
  const registrationsPage = Math.min(requestedPage, registrationsTotalPages);
  const registrationsOffset = (registrationsPage - 1) * REGISTRATIONS_PER_PAGE;
  const recentRegistrations = await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      email: profiles.email,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .orderBy(desc(profiles.createdAt), desc(profiles.id))
    .limit(REGISTRATIONS_PER_PAGE)
    .offset(registrationsOffset);
  const registrationStats = [
    { label: 'Last 24 Hours', value: registrationsLast24Hours },
    { label: 'Last 7 Days', value: registrationsLast7Days },
    { label: 'Last 30 Days', value: registrationsLast30Days },
    { label: 'Lifetime Total', value: registrationsLifetime },
  ];
  const workoutTypesTotalRows = await db
    .select({ value: sql<number>`count(*)` })
    .from(workoutTypes)
    .then((rows) => rows[0]?.value ?? 0);
  const workoutTypesTotal = Number(workoutTypesTotalRows);
  const workoutTypesTotalPages = Math.max(
    1,
    Math.ceil(workoutTypesTotal / WORKOUT_TYPES_PER_PAGE)
  );
  const workoutTypesPage = Math.min(requestedPage, workoutTypesTotalPages);
  const workoutTypesOffset = (workoutTypesPage - 1) * WORKOUT_TYPES_PER_PAGE;
  const workoutTypeRows = await db
    .select({
      id: workoutTypes.id,
      title: workoutTypes.title,
      slug: workoutTypes.slug,
      category: workoutTypes.category,
      difficultyLevel: workoutTypes.difficultyLevel,
      durationMinutes: workoutTypes.durationMinutes,
      description: workoutTypes.description,
      descriptionLong: workoutTypes.descriptionLong,
      suitableFor: workoutTypes.suitableFor,
      whatToBring: workoutTypes.whatToBring,
    })
    .from(workoutTypes)
    .orderBy(asc(workoutTypes.title))
    .limit(WORKOUT_TYPES_PER_PAGE)
    .offset(workoutTypesOffset);
  const scheduleSearchCondition = search
    ? or(
        ilike(workoutTypes.title, `%${search}%`),
        ilike(schedule.trainerName, `%${search}%`),
        ilike(schedule.room, `%${search}%`)
      )
    : undefined;
  const scheduleFilters = and(
    gte(schedule.startTime, now),
    scheduleSearchCondition
  );
  const scheduleTotalRows = await db
    .select({ value: sql<number>`count(*)` })
    .from(schedule)
    .innerJoin(workoutTypes, eq(schedule.workoutTypeId, workoutTypes.id))
    .where(scheduleFilters)
    .then((rows) => rows[0]?.value ?? 0);
  const scheduleTotal = Number(scheduleTotalRows);
  const scheduleTotalPages = Math.max(
    1,
    Math.ceil(scheduleTotal / SCHEDULE_SESSIONS_PER_PAGE)
  );
  const schedulePage = Math.min(requestedPage, scheduleTotalPages);
  const scheduleOffset = (schedulePage - 1) * SCHEDULE_SESSIONS_PER_PAGE;
  const [scheduleRows, scheduleWorkoutOptions] = await Promise.all([
    db
      .select({
        id: schedule.id,
        startTime: schedule.startTime,
        workoutTypeId: schedule.workoutTypeId,
        workoutTitle: workoutTypes.title,
        trainerName: schedule.trainerName,
        room: schedule.room,
        capacity: schedule.capacity,
        enrolledCount: schedule.enrolledCount,
      })
      .from(schedule)
      .innerJoin(workoutTypes, eq(schedule.workoutTypeId, workoutTypes.id))
      .where(scheduleFilters)
      .orderBy(asc(schedule.startTime))
      .limit(SCHEDULE_SESSIONS_PER_PAGE)
      .offset(scheduleOffset),
    db
      .select({ id: workoutTypes.id, title: workoutTypes.title })
      .from(workoutTypes)
      .orderBy(asc(workoutTypes.title)),
  ]);

  return (
    <div className="bg-slate-50 pb-16">
      <main className="mx-auto w-full max-w-7xl px-1 pt-2 sm:px-4 lg:px-8">
        <div className="rounded-3xl bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.22),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(236,72,153,0.14),_transparent_42%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_44%,_#faf5ff_100%)] p-4 shadow-xl shadow-slate-200/70 sm:p-8 lg:p-11">
          <section className="rounded-3xl border border-white/70 bg-white/82 px-8 py-11 shadow-sm backdrop-blur sm:px-11">
            <span className="text-sm font-bold uppercase tracking-wider text-indigo-600">
              Admin Console
            </span>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
              Club Operations
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500 sm:text-base">
              Monitor growth, optimize schedule, and manage workouts in one place.
            </p>
          </section>

          <section className="mt-6 rounded-3xl border border-white/70 bg-white/88 p-6 shadow-sm backdrop-blur sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              {tabs.map((tab) =>
                tab.href ? (
                  <Link
                    key={tab.value}
                    href={tab.href}
                    scroll={false}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activeTab === tab.value
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-200'
                        : 'border border-indigo-100 bg-white text-violet-700 hover:-translate-y-0.5 hover:bg-violet-50'
                    }`}
                  >
                    {tab.label}
                  </Link>
                ) : (
                  <button
                    key={tab.value}
                    type="button"
                    disabled
                    className="rounded-full border border-indigo-100 bg-white px-4 py-2 text-sm font-semibold text-violet-700 opacity-90"
                  >
                    {tab.label}
                  </button>
                )
              )}
            </div>

            {activeTab === 'bookings' ? (
              <>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                    Upcoming Bookings
                  </h2>
                  <p className="text-sm font-bold text-indigo-900">
                    Total Upcoming Bookings: {totalBookings}
                  </p>
                </div>

                <div className="mt-4">
                  <label
                    htmlFor="admin-booking-search"
                    className="text-sm font-medium text-slate-800"
                  >
                    Search bookings
                  </label>
                  <div className="mt-1.5">
                    <DebouncedSearch
                      placeholder="Search by user name or workout title"
                      paramKey="search"
                      className="h-9 w-full rounded-full border border-indigo-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    />
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-slate-100 bg-white text-xs font-bold uppercase tracking-wider text-slate-500">
                          <th className="px-6 py-3">Date &amp; Time</th>
                          <th className="px-6 py-3">User Name</th>
                          <th className="px-6 py-3">Workout</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {upcomingBookings.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-6 py-10 text-center text-sm font-medium text-slate-500"
                            >
                              No upcoming bookings found.
                            </td>
                          </tr>
                        ) : (
                          upcomingBookings.map((booking) => (
                            <tr
                              key={booking.id}
                              className="bg-white transition hover:bg-slate-50/70"
                            >
                              <td className="px-6 py-3.5 text-sm font-bold text-slate-950">
                                {formatBookingDate(booking.startTime)}
                              </td>
                              <td className="px-6 py-3.5 text-sm font-medium text-slate-900">
                                {booking.userName}
                              </td>
                              <td className="px-6 py-3.5 text-sm font-bold text-slate-950">
                                {booking.workoutTitle}
                              </td>
                              <td className="px-6 py-3.5">
                                <div className="flex justify-end">
                                  <AdminCancelBookingButton bookingId={booking.id} />
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  search={search}
                />
              </>
            ) : activeTab === 'registrations' ? (
              <>
                <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {registrationStats.map((stat) => (
                    <article
                      key={stat.label}
                      className="rounded-2xl bg-white px-4 py-5 shadow-sm shadow-slate-200/70"
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                        {stat.label}
                      </p>
                      <p className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
                        {stat.value}
                      </p>
                    </article>
                  ))}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                    Recent Registrations
                  </h2>
                  <p className="text-sm font-bold text-slate-500">
                    Latest {recentRegistrations.length} members
                  </p>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-slate-100 bg-white text-xs font-bold uppercase tracking-wider text-slate-500">
                          <th className="px-6 py-3">Name</th>
                          <th className="px-6 py-3">Email</th>
                          <th className="px-6 py-3">Joined</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {recentRegistrations.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-6 py-10 text-center text-sm font-medium text-slate-500"
                            >
                              No registrations found.
                            </td>
                          </tr>
                        ) : (
                          recentRegistrations.map((member) => (
                            <tr
                              key={member.id}
                              className="bg-white transition hover:bg-slate-50/70"
                            >
                              <td className="px-6 py-3.5 text-sm font-bold text-slate-950">
                                {member.fullName}
                              </td>
                              <td className="px-6 py-3.5 text-sm font-medium text-slate-600">
                                {member.email}
                              </td>
                              <td className="px-6 py-3.5 text-sm font-medium text-slate-700">
                                {registrationDateFormatter.format(member.createdAt)}
                              </td>
                              <td className="px-6 py-3.5">
                                <div className="flex justify-end">
                                  <AdminDeleteUserButton userId={member.id} />
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <Pagination
                  currentPage={registrationsPage}
                  totalPages={registrationsTotalPages}
                  tab="registrations"
                />
              </>
            ) : activeTab === 'workouts' ? (
              <AdminWorkoutTypesPanel
                workouts={workoutTypeRows}
                currentPage={workoutTypesPage}
                totalPages={workoutTypesTotalPages}
              />
            ) : (
              <AdminSchedulePanel
                sessions={scheduleRows}
                workoutOptions={scheduleWorkoutOptions}
                search={search}
                currentPage={schedulePage}
                totalPages={scheduleTotalPages}
              />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
