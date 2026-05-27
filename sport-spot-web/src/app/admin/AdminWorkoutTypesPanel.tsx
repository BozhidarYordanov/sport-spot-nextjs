'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import {
  createWorkoutTypeAction,
  deleteWorkoutTypeAction,
  updateWorkoutTypeAction,
} from './actions';

type WorkoutTypeRow = {
  id: number;
  title: string;
  slug: string;
  category: string;
  difficultyLevel: number;
  durationMinutes: number;
  description: string;
  descriptionLong: string;
  suitableFor: string;
  whatToBring: string;
};

type WorkoutFormErrors = Partial<
  Record<
    | 'title'
    | 'slug'
    | 'category'
    | 'difficultyLevel'
    | 'durationMinutes'
    | 'description'
    | 'descriptionLong'
    | 'suitableFor'
    | 'whatToBring',
    string
  >
>;

type AdminWorkoutTypesPanelProps = {
  workouts: WorkoutTypeRow[];
  currentPage: number;
  totalPages: number;
};

const categoryBadgeClasses: Record<string, string> = {
  Cardio: 'bg-purple-50 text-purple-700',
  Combat: 'bg-blue-50 text-blue-700',
  Strength: 'bg-indigo-50 text-indigo-700',
  'Mind & Body': 'bg-violet-50 text-violet-700',
};

const difficultyOptions = [1, 2, 3];
const categoryOptions = ['Cardio', 'Combat', 'Strength', 'Mind & Body'];
const fieldErrorClassName = 'text-xs font-semibold text-rose-500';

const getFormValue = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
};

const validateWorkoutForm = (formData: FormData): WorkoutFormErrors => {
  const errors: WorkoutFormErrors = {};
  const difficultyLevel = Number(getFormValue(formData, 'difficultyLevel'));
  const durationMinutes = Number(getFormValue(formData, 'durationMinutes'));

  if (!getFormValue(formData, 'title')) {
    errors.title = 'Please enter a workout title.';
  }

  if (!getFormValue(formData, 'slug')) {
    errors.slug = 'Please enter a URL slug.';
  }

  if (!getFormValue(formData, 'category')) {
    errors.category = 'Please choose a category.';
  }

  if (!difficultyOptions.includes(difficultyLevel)) {
    errors.difficultyLevel = 'Please choose a difficulty level.';
  }

  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    errors.durationMinutes = 'Please enter a positive duration.';
  }

  if (!getFormValue(formData, 'description')) {
    errors.description = 'Please enter a short description.';
  }

  if (!getFormValue(formData, 'suitableFor')) {
    errors.suitableFor = 'Please enter who this workout is suitable for.';
  }

  if (!getFormValue(formData, 'whatToBring')) {
    errors.whatToBring = 'Please enter what members should bring.';
  }

  if (!getFormValue(formData, 'descriptionLong')) {
    errors.descriptionLong = 'Please enter a long description.';
  }

  return errors;
};

function WorkoutModal({
  title,
  workout,
  onClose,
  onSubmit,
  isSubmitting,
  errors,
}: {
  title: string;
  workout: WorkoutTypeRow | null;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  isSubmitting: boolean;
  errors: WorkoutFormErrors;
}) {
  const inputClassName =
    'w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100';
  const getInputClassName = (field: keyof WorkoutFormErrors) =>
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
            <span>Title</span>
            <input
              name="title"
              defaultValue={workout?.title ?? ''}
              aria-invalid={Boolean(errors.title)}
              className={getInputClassName('title')}
              placeholder="Basketball"
            />
            {errors.title ? (
              <p className={fieldErrorClassName}>{errors.title}</p>
            ) : null}
          </label>

          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            <span>Slug</span>
            <input
              name="slug"
              defaultValue={workout?.slug ?? ''}
              aria-invalid={Boolean(errors.slug)}
              className={getInputClassName('slug')}
              placeholder="basketball"
            />
            {errors.slug ? (
              <p className={fieldErrorClassName}>{errors.slug}</p>
            ) : null}
          </label>

          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            <span>Category</span>
            <select
              name="category"
              defaultValue={workout?.category ?? categoryOptions[0]}
              aria-invalid={Boolean(errors.category)}
              className={getInputClassName('category')}
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category ? (
              <p className={fieldErrorClassName}>{errors.category}</p>
            ) : null}
          </label>

          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            <span>Difficulty</span>
            <select
              name="difficultyLevel"
              defaultValue={workout?.difficultyLevel ?? 1}
              aria-invalid={Boolean(errors.difficultyLevel)}
              className={getInputClassName('difficultyLevel')}
            >
              {difficultyOptions.map((level) => (
                <option key={level} value={level}>
                  {level}/3
                </option>
              ))}
            </select>
            {errors.difficultyLevel ? (
              <p className={fieldErrorClassName}>{errors.difficultyLevel}</p>
            ) : null}
          </label>

          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            <span>Duration</span>
            <input
              name="durationMinutes"
              type="number"
              min={1}
              defaultValue={workout?.durationMinutes ?? ''}
              aria-invalid={Boolean(errors.durationMinutes)}
              className={getInputClassName('durationMinutes')}
              placeholder="60"
            />
            {errors.durationMinutes ? (
              <p className={fieldErrorClassName}>{errors.durationMinutes}</p>
            ) : null}
          </label>

          <label className="space-y-1.5 text-sm font-semibold text-slate-700 sm:col-span-2">
            <span>Short Description</span>
            <input
              name="description"
              defaultValue={workout?.description ?? ''}
              aria-invalid={Boolean(errors.description)}
              className={getInputClassName('description')}
              placeholder="Short workout summary"
            />
            {errors.description ? (
              <p className={fieldErrorClassName}>{errors.description}</p>
            ) : null}
          </label>

          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            <span>Suitable For</span>
            <input
              name="suitableFor"
              defaultValue={workout?.suitableFor ?? ''}
              aria-invalid={Boolean(errors.suitableFor)}
              className={getInputClassName('suitableFor')}
              placeholder="All fitness levels"
            />
            {errors.suitableFor ? (
              <p className={fieldErrorClassName}>{errors.suitableFor}</p>
            ) : null}
          </label>

          <label className="space-y-1.5 text-sm font-semibold text-slate-700">
            <span>What to Bring</span>
            <input
              name="whatToBring"
              defaultValue={workout?.whatToBring ?? ''}
              aria-invalid={Boolean(errors.whatToBring)}
              className={getInputClassName('whatToBring')}
              placeholder="Water bottle, towel"
            />
            {errors.whatToBring ? (
              <p className={fieldErrorClassName}>{errors.whatToBring}</p>
            ) : null}
          </label>

          <label className="space-y-1.5 text-sm font-semibold text-slate-700 sm:col-span-2">
            <span>Long Description</span>
            <textarea
              name="descriptionLong"
              defaultValue={workout?.descriptionLong ?? ''}
              rows={5}
              aria-invalid={Boolean(errors.descriptionLong)}
              className={`${getInputClassName('descriptionLong')} resize-none`}
              placeholder="Detailed workout description"
            />
            {errors.descriptionLong ? (
              <p className={fieldErrorClassName}>{errors.descriptionLong}</p>
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
              className="cursor-pointer rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200/70 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              {isSubmitting
                ? 'Saving...'
                : workout
                  ? 'Save Changes'
                  : 'Create Workout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminWorkoutTypesPanel({
  workouts,
  currentPage,
  totalPages,
}: AdminWorkoutTypesPanelProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutTypeRow | null>(
    null
  );
  const [deletingWorkoutId, setDeletingWorkoutId] = useState<number | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<WorkoutFormErrors>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const buildHref = (page: number) => {
    const params = new URLSearchParams({ tab: 'workouts' });

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

  const handleDelete = (workoutId: number) => {
    setError(null);
    setDeletingWorkoutId(workoutId);

    startTransition(() => {
      void (async () => {
        const result = await deleteWorkoutTypeAction(workoutId);

        if ('error' in result) {
          setError(result.error);
          setDeletingWorkoutId(null);
          return;
        }

        setDeletingWorkoutId(null);
        router.refresh();
      })();
    });
  };

  const handleSave = (formData: FormData, workout: WorkoutTypeRow | null) => {
    setError(null);
    const nextErrors = validateWorkoutForm(formData);
    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    startTransition(() => {
      void (async () => {
        const result = workout
          ? await updateWorkoutTypeAction(workout.id, formData)
          : await createWorkoutTypeAction(formData);

        if ('error' in result) {
          setError(result.error);
          return;
        }

        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setEditingWorkout(null);
        setFormErrors({});
        router.refresh();
      })();
    });
  };

  return (
    <>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Workout Types
        </h2>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="cursor-pointer rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200/70 transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          + Add New Workout
        </button>
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
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Difficulty</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workouts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm font-medium text-slate-500"
                  >
                    No workout types found.
                  </td>
                </tr>
              ) : (
                workouts.map((workout) => (
                  <tr
                    key={workout.id}
                    className="bg-white transition hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-3.5 text-sm font-bold text-slate-950">
                      {workout.title}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          categoryBadgeClasses[workout.category] ??
                          'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {workout.category}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm font-medium text-slate-900">
                      {workout.difficultyLevel}/3
                    </td>
                    <td className="max-w-sm px-6 py-3.5 text-sm font-medium text-slate-500">
                      <p className="line-clamp-2">{workout.description}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingWorkout(workout);
                            setIsEditModalOpen(true);
                          }}
                          className="mx-1 cursor-pointer rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-blue-600 shadow-sm ring-1 ring-slate-100 transition hover:bg-blue-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(workout.id)}
                          disabled={isPending && deletingWorkoutId === workout.id}
                          className="mx-1 cursor-pointer rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-slate-100 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isPending && deletingWorkoutId === workout.id
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
                key={`admin-workouts-page-${page}`}
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

      {isAddModalOpen ? (
        <WorkoutModal
          title="Add New Workout"
          workout={null}
          onClose={() => {
            setIsAddModalOpen(false);
            setFormErrors({});
          }}
          onSubmit={(formData) => handleSave(formData, null)}
          isSubmitting={isPending}
          errors={formErrors}
        />
      ) : null}

      {isEditModalOpen ? (
        <WorkoutModal
          title="Edit Workout"
          workout={editingWorkout}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingWorkout(null);
            setFormErrors({});
          }}
          onSubmit={(formData) => handleSave(formData, editingWorkout)}
          isSubmitting={isPending}
          errors={formErrors}
        />
      ) : null}
    </>
  );
}
