'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import DebouncedSearch from '@/components/DebouncedSearch';
import {
  createScheduleSessionAction,
  deleteScheduleSessionAction,
  updateScheduleSessionAction,
} from './actions';

type ScheduleRow = {
  id: number;
  startTime: Date;
  workoutTypeId: number;
  workoutTitle: string;
  trainerName: string;
  room: string;
  capacity: number;
  enrolledCount: number;
};

type WorkoutOption = {
  id: number;
  title: string;
};

type ScheduleFormErrors = Partial<
  Record<'workoutTypeId' | 'startTime' | 'trainerName' | 'room' | 'capacity', string>
>;

type AdminSchedulePanelProps = {
  sessions: ScheduleRow[];
  workoutOptions: WorkoutOption[];
  search: string;
  currentPage: number;
  totalPages: number;
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
const fieldErrorClassName = 'text-xs font-semibold text-rose-500';

const getFormValue = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
};

const validateScheduleForm = (formData: FormData): ScheduleFormErrors => {
  const errors: ScheduleFormErrors = {};
  const workoutTypeId = Number(getFormValue(formData, 'workoutTypeId'));
  const startTimeValue = getFormValue(formData, 'startTime');
  const startTime = new Date(startTimeValue);
  const capacity = Number(getFormValue(formData, 'capacity'));

  if (!Number.isInteger(workoutTypeId) || workoutTypeId <= 0) {
    errors.workoutTypeId = 'Please choose a workout type.';
  }

  if (!startTimeValue || Number.isNaN(startTime.getTime())) {
    errors.startTime = 'Please choose a valid date and time.';
  }

  if (!getFormValue(formData, 'trainerName')) {
    errors.trainerName = 'Please enter a trainer name.';
  }

  if (!getFormValue(formData, 'room')) {
    errors.room = 'Please enter a room name.';
  }

  if (!Number.isInteger(capacity) || capacity <= 0) {
    errors.capacity = 'Please enter a positive capacity.';
  }

  return errors;
};

const toDateTimeLocalValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

function ScheduleModal({
  title,
  session,
  workoutOptions,
  onClose,
  onSubmit,
  isSubmitting,
  errors,
}: {
  title: string;
  session: ScheduleRow | null;
  workoutOptions: WorkoutOption[];
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  isSubmitting: boolean;
  errors: ScheduleFormErrors;
}) {
  const inputClassName =
    'w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100';
  const getInputClassName = (field: keyof ScheduleFormErrors) =>
    `${inputClassName} ${
      errors[field] ? 'border-rose-300' : 'border-slate-200'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-white/80 bg-white p-6 shadow-2xl shadow-slate-950/20">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xl font-bold tracking-tight text-slate-950">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Close modal"
          >
            x
          </button>
        </div>

        <form
          className="mt-6 grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(new FormData(event.currentTarget));
          }}
        >
          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            <span>Workout Type</span>
            <select
              name="workoutTypeId"
              defaultValue={session?.workoutTypeId ?? workoutOptions[0]?.id}
              aria-invalid={Boolean(errors.workoutTypeId)}
              className={getInputClassName('workoutTypeId')}
            >
              {workoutOptions.map((workout) => (
                <option key={workout.id} value={workout.id}>
                  {workout.title}
                </option>
              ))}
            </select>
            {errors.workoutTypeId ? (
              <p className={fieldErrorClassName}>{errors.workoutTypeId}</p>
            ) : null}
          </label>

          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            <span>Date & Time</span>
            <input
              name="startTime"
              type="datetime-local"
              defaultValue={
                session ? toDateTimeLocalValue(session.startTime) : undefined
              }
              aria-invalid={Boolean(errors.startTime)}
              className={getInputClassName('startTime')}
            />
            {errors.startTime ? (
              <p className={fieldErrorClassName}>{errors.startTime}</p>
            ) : null}
          </label>

          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            <span>Trainer Name</span>
            <input
              name="trainerName"
              defaultValue={session?.trainerName ?? ''}
              aria-invalid={Boolean(errors.trainerName)}
              className={getInputClassName('trainerName')}
              placeholder="Daniel"
            />
            {errors.trainerName ? (
              <p className={fieldErrorClassName}>{errors.trainerName}</p>
            ) : null}
          </label>

          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            <span>Room Name</span>
            <input
              name="room"
              defaultValue={session?.room ?? ''}
              aria-invalid={Boolean(errors.room)}
              className={getInputClassName('room')}
              placeholder="Arena"
            />
            {errors.room ? (
              <p className={fieldErrorClassName}>{errors.room}</p>
            ) : null}
          </label>

          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            <span>Max Capacity</span>
            <input
              name="capacity"
              type="number"
              min={1}
              defaultValue={session?.capacity ?? ''}
              aria-invalid={Boolean(errors.capacity)}
              className={getInputClassName('capacity')}
              placeholder="20"
            />
            {errors.capacity ? (
              <p className={fieldErrorClassName}>{errors.capacity}</p>
            ) : null}
          </label>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:col-span-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200/70 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isSubmitting
                ? 'Saving...'
                : session
                  ? 'Save Changes'
                  : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminSchedulePanel({
  sessions,
  workoutOptions,
  search,
  currentPage,
  totalPages,
}: AdminSchedulePanelProps) {
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [isEditSessionOpen, setIsEditSessionOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ScheduleRow | null>(
    null
  );
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<ScheduleFormErrors>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const buildHref = (page: number) => {
    const params = new URLSearchParams({ tab: 'schedule' });

    if (search) {
      params.set('search', search);
    }

    if (page > 1) {
      params.set('page', String(page));
    }

    return `/admin?${params.toString()}`;
  };

  const pageItems =
    totalPages <= 5
      ? Array.from({ length: totalPages }, (_, index) => index + 1)
      : Array.from(
          new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])
        ).filter((page) => page >= 1 && page <= totalPages);

  const handleDelete = (sessionId: number) => {
    setError(null);
    setDeletingSessionId(sessionId);

    startTransition(() => {
      void (async () => {
        const result = await deleteScheduleSessionAction(sessionId);

        if ('error' in result) {
          setError(result.error);
          setDeletingSessionId(null);
          return;
        }

        setDeletingSessionId(null);
        router.refresh();
      })();
    });
  };

  const handleSave = (formData: FormData, session: ScheduleRow | null) => {
    setError(null);
    const nextErrors = validateScheduleForm(formData);
    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    startTransition(() => {
      void (async () => {
        const result = session
          ? await updateScheduleSessionAction(session.id, formData)
          : await createScheduleSessionAction(formData);

        if ('error' in result) {
          if (result.error === 'Capacity cannot be lower than current enrollments') {
            setFormErrors({ capacity: result.error });
          } else {
            setError(result.error);
          }
          return;
        }

        setIsAddSessionOpen(false);
        setIsEditSessionOpen(false);
        setEditingSession(null);
        setFormErrors({});
        router.refresh();
      })();
    });
  };

  return (
    <>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Upcoming Sessions
        </h2>
        <button
          type="button"
          onClick={() => setIsAddSessionOpen(true)}
          className="cursor-pointer rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200/70 transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          + Add New Session
        </button>
      </div>

      <div className="mt-4">
        <label
          htmlFor="admin-schedule-search"
          className="text-sm font-medium text-slate-800"
        >
          Search sessions
        </label>
        <div className="mt-1.5">
          <DebouncedSearch
            placeholder="Search by workout, trainer, or room..."
            paramKey="search"
            className="h-9 w-full rounded-full border border-indigo-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
          />
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
          {error}
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-white text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3">Date &amp; Time</th>
                <th className="px-6 py-3">Workout</th>
                <th className="px-6 py-3">Trainer</th>
                <th className="px-6 py-3">Room</th>
                <th className="px-6 py-3">Capacity</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-sm font-medium text-slate-500"
                  >
                    No upcoming sessions found.
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr
                    key={session.id}
                    className="bg-white transition hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-3.5 text-sm font-bold text-slate-950">
                      {dateFormatter.format(session.startTime)}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-bold text-slate-950">
                      {session.workoutTitle}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-medium text-slate-900">
                      {session.trainerName}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-medium text-slate-900">
                      {session.room}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-medium text-slate-900">
                      {session.enrolledCount}/{session.capacity}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSession(session);
                            setIsEditSessionOpen(true);
                          }}
                          className="mx-1 cursor-pointer rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-blue-600 shadow-sm ring-1 ring-slate-100 transition hover:bg-blue-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(session.id)}
                          disabled={isPending && deletingSessionId === session.id}
                          className="mx-1 cursor-pointer rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-slate-100 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isPending && deletingSessionId === session.id
                            ? 'Deleting...'
                            : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 ? (
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
            const showGap =
              previousPage !== undefined && page - previousPage > 1;

            return (
              <span
                key={`admin-schedule-page-${page}`}
                className="flex items-center gap-2"
              >
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
      ) : null}

      {isAddSessionOpen ? (
        <ScheduleModal
          title="Add New Session"
          session={null}
          workoutOptions={workoutOptions}
          onClose={() => {
            setIsAddSessionOpen(false);
            setFormErrors({});
          }}
          onSubmit={(formData) => handleSave(formData, null)}
          isSubmitting={isPending}
          errors={formErrors}
        />
      ) : null}

      {isEditSessionOpen ? (
        <ScheduleModal
          title="Edit Session"
          session={editingSession}
          workoutOptions={workoutOptions}
          onClose={() => {
            setIsEditSessionOpen(false);
            setEditingSession(null);
            setFormErrors({});
          }}
          onSubmit={(formData) => handleSave(formData, editingSession)}
          isSubmitting={isPending}
          errors={formErrors}
        />
      ) : null}
    </>
  );
}
