'use client';

import Link from 'next/link';
import { useState } from 'react';

import SessionActionButton from '@/app/classes/SessionActionButton';

type ScheduleSessionCardProps = {
  session: {
    id: number;
    formattedTime: string;
    trainerName: string;
    room: string;
    capacity: number;
    enrolledCount: number;
    title: string;
    difficultyLevel: number;
    isBooked: boolean;
  };
  isAuthenticated: boolean;
};

const DIFFICULTY_META: Record<
  number,
  { label: string; badgeClass: string }
> = {
  1: { label: 'Easy', badgeClass: 'bg-emerald-50 text-emerald-700' },
  2: { label: 'Intermediate', badgeClass: 'bg-amber-50 text-amber-700' },
  3: { label: 'Advanced', badgeClass: 'bg-rose-50 text-rose-700' },
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
            key={`schedule-card-difficulty-bar-${level}-${index}`}
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

export default function ScheduleSessionCard({
  session,
  isAuthenticated,
}: ScheduleSessionCardProps) {
  const [isEnrolled, setIsEnrolled] = useState(session.isBooked);
  const [enrolledCount, setEnrolledCount] = useState(session.enrolledCount);
  const availability = Math.max(0, session.capacity - enrolledCount);

  const handleActionSuccess = ({
    variant,
    enrolledCount: nextEnrolledCount,
  }: {
    variant: 'book' | 'cancel';
    enrolledCount: number;
  }) => {
    setIsEnrolled(variant === 'book');
    setEnrolledCount(nextEnrolledCount);
  };

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-sm font-semibold text-violet-600">
            {session.formattedTime}
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
          {isEnrolled ? (
            <>
              <span className="text-xs font-bold text-fuchsia-600">
                Booked
              </span>
              <SessionActionButton
                scheduleId={session.id}
                variant="cancel"
                refreshOnSuccess={false}
                revalidatePathsOnSuccess={false}
                onSuccess={handleActionSuccess}
                className="mt-0 border-rose-400 bg-white px-4 py-2 text-rose-600 hover:bg-rose-50"
              />
            </>
          ) : isAuthenticated ? (
            <SessionActionButton
              scheduleId={session.id}
              variant="book"
              refreshOnSuccess={false}
              revalidatePathsOnSuccess={false}
              onSuccess={handleActionSuccess}
              className="mt-0 min-w-32 justify-center px-7 py-2"
            />
          ) : (
            <Link
              href="/login"
              prefetch={false}
              className="mt-0 inline-flex min-w-32 justify-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            >
              Reserve
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
