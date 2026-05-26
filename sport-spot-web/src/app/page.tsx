import { and, asc, eq, gt, gte, lt } from "drizzle-orm";
import Link from "next/link";
import { cookies } from "next/headers";

import SessionActionButton from "@/app/classes/SessionActionButton";
import { db } from "@/db";
import { bookings, schedule, workoutTypes } from "@/db/schema";
import { verifyToken } from "@/lib/auth";

type SessionSummary = {
  scheduleId: number;
  workoutTitle: string;
  startTime: Date;
  trainerName: string;
  room: string;
  capacity: number;
  enrolledCount: number;
};

const testimonials = [
  {
    quote: "Booking classes is super easy and the trainers are always excellent.",
    name: "Maya S.",
  },
  {
    quote: "I found the perfect mix of Yoga and Boxing for my weekly routine.",
    name: "Jordan K.",
  },
];

const features = [
  {
    title: "Yoga",
    description:
      "Improve flexibility, reduce stress, and reconnect with your breath.",
    dotClass: "bg-violet-500",
  },
  {
    title: "Box",
    description: "Build stamina and confidence with dynamic, full-body workouts.",
    dotClass: "bg-indigo-500",
  },
  {
    title: "Pilates",
    description:
      "Strengthen your core and improve posture with controlled movement.",
    dotClass: "bg-rose-500",
  },
  {
    title: "Spinning",
    description:
      "Push your cardio limits with motivating, music-driven classes.",
    dotClass: "bg-amber-500",
  },
];

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getSessionDayLabel(value: Date, now = new Date()) {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfSession = new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate()
  );
  const diffDays = Math.floor(
    (startOfSession.getTime() - startOfToday.getTime()) / MS_PER_DAY
  );

  if (diffDays <= 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "Tomorrow";
  }

  return dateFormatter.format(value);
}

function formatSessionTime(value: Date, now = new Date()) {
  const dayLabel = getSessionDayLabel(value, now);
  return `${dayLabel} - ${timeFormatter.format(value)}`;
}

function FeaturedActivityCard({
  session,
  isAuthenticated,
  isBooked,
}: {
  session: SessionSummary | null;
  isAuthenticated: boolean;
  isBooked: boolean;
}) {
  const reserveButtonClass =
    "w-fit cursor-pointer rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-1 hover:bg-indigo-700 hover:shadow-2xl";

  return (
    <div className="rounded-2xl border border-white/70 bg-white/70 p-6 shadow-xl shadow-slate-100/50 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <p className="text-xs font-semibold tracking-[0.25em] text-slate-500">
        FEATURED ACTIVITY
      </p>
      {session ? (
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">
              {session.workoutTitle}
            </h3>
            <p className="text-sm text-slate-600">
              {formatSessionTime(session.startTime)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white/80 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Trainer
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {session.trainerName}
            </p>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>
              {session.enrolledCount}/{session.capacity} spots filled
            </span>
            <span className="font-semibold text-indigo-600">Room {session.room}</span>
          </div>
          {isAuthenticated ? (
            <SessionActionButton
              scheduleId={session.scheduleId}
              variant={isBooked ? 'cancel' : 'book'}
              labelIdle={isBooked ? 'Cancel Booking' : 'Reserve spot'}
              labelPending={isBooked ? 'Cancelling...' : 'Reserving...'}
              className="mt-0"
            />
          ) : (
            <Link href="/login" className={reserveButtonClass}>
              Reserve spot
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-base font-semibold text-slate-950">
            No upcoming sessions yet
          </p>
          <p className="text-sm text-slate-600">
            Check back soon for the next available class.
          </p>
          <Link
            href="/classes"
            className="mt-2 cursor-pointer rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-1 hover:bg-indigo-700 hover:shadow-2xl"
          >
            Browse classes
          </Link>
        </div>
      )}
    </div>
  );
}

function TestimonialCard({ quote, name }: { quote: string; name: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xl shadow-slate-100/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <p className="text-sm text-slate-600">"{quote}"</p>
      <p className="mt-3 text-sm font-semibold text-slate-950">{name}</p>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  dotClass,
}: {
  title: string;
  description: string;
  dotClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-100/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dotClass}`} />
        <p className="text-sm font-semibold text-slate-950">{title}</p>
      </div>
      <p className="mt-3 text-sm text-slate-600">{description}</p>
    </div>
  );
}

export default async function Home() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  const viewer = sessionToken ? await verifyToken(sessionToken) : null;
  const isAuthenticated = Boolean(viewer);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayAt1800 = new Date(startOfToday);
  todayAt1800.setHours(18, 0, 0, 0);
  const tomorrowAt1800 = new Date(startOfToday);
  tomorrowAt1800.setDate(tomorrowAt1800.getDate() + 1);
  tomorrowAt1800.setHours(18, 0, 0, 0);
  const eveningStart = now >= todayAt1800 ? tomorrowAt1800 : todayAt1800;

  const sessions = await db
    .select({
      scheduleId: schedule.id,
      workoutTitle: workoutTypes.title,
      startTime: schedule.startTime,
      trainerName: schedule.trainerName,
      room: schedule.room,
      capacity: schedule.capacity,
      enrolledCount: schedule.enrolledCount,
    })
    .from(schedule)
    .innerJoin(workoutTypes, eq(schedule.workoutTypeId, workoutTypes.id))
    .where(
      and(
        gte(schedule.startTime, eveningStart),
        gte(schedule.startTime, now),
        lt(schedule.enrolledCount, schedule.capacity),
        gt(schedule.capacity, schedule.enrolledCount)
      )
    )
    .orderBy(asc(schedule.startTime))
    .limit(1);

  const nextSession = sessions[0] ?? null;
  const isNextSessionBooked =
    viewer && nextSession
      ? (
          await db
            .select({ id: bookings.id })
            .from(bookings)
            .where(
              and(
                eq(bookings.status, 'active'),
                eq(bookings.userId, viewer.id),
                eq(bookings.scheduleId, nextSession.scheduleId)
              )
            )
            .limit(1)
        ).length > 0
      : false;

  return (
    <div className="bg-slate-50 pb-20">
      <section className="mx-auto w-full max-w-6xl px-6 pt-10">
        <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-100/50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.18),_transparent_60%)]" />
          <div className="absolute -top-20 -left-16 h-56 w-56 rounded-full bg-indigo-200/50 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-violet-200/50 blur-3xl" />

          <div className="relative grid gap-10 p-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="flex flex-col justify-center">
              <span className="w-fit rounded-full border border-indigo-100 bg-white/80 px-3 py-1 text-xs font-semibold text-indigo-600">
                Welcome to SportSpot
              </span>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                Train smarter with your{" "}
                <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  premium fitness hub
                </span>
              </h1>
              <p className="mt-4 text-base text-slate-600 sm:text-lg">
                Discover elite classes, expert trainers, and seamless booking
                designed for your healthiest routine.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {!isAuthenticated ? (
                  <Link
                    href="/login"
                    className="cursor-pointer rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-1 hover:bg-indigo-700 hover:shadow-2xl"
                  >
                    Get Started
                  </Link>
                ) : null}
                <Link
                  href="/classes"
                  className="cursor-pointer rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-[#1a1a1b] shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
                >
                  Browse Classes
                </Link>
              </div>
            </div>

            <FeaturedActivityCard
              session={nextSession}
              isAuthenticated={isAuthenticated}
              isBooked={isNextSessionBooked}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 w-full max-w-6xl px-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-100/50">
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_2fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Social Proof
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
                Trusted by active members
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Join a growing community that consistently trains with SportSpot.
              </p>
              <div className="mt-6 w-full max-w-xs rounded-2xl border border-slate-100 bg-white p-4 shadow-xl shadow-slate-100/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                <p className="text-2xl font-bold text-slate-950">12,000+</p>
                <p className="text-sm text-slate-600">Classes booked</p>
              </div>
            </div>
            <div className="grid auto-rows-min items-start gap-4 sm:grid-cols-2">
              {testimonials.map((testimonial) => (
                <TestimonialCard
                  key={testimonial.name}
                  quote={testimonial.quote}
                  name={testimonial.name}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 w-full max-w-6xl px-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-100/50">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            Why Us
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            From calm sessions to intense training, SportSpot offers activities for every goal.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                description={feature.description}
                dotClass={feature.dotClass}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
