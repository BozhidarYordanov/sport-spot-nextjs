import { and, asc, ilike, inArray, sql } from 'drizzle-orm';
import Link from 'next/link';
import type { SQL } from 'drizzle-orm';

import { db } from '@/db';
import { workoutTypes } from '@/db/schema';
import EmptyState from './EmptyState';
import FiltersClient from './FiltersClient';

const CATEGORY_OPTIONS = [
  'Cardio',
  'Strength',
  'Mind & Body',
  'Combat',
] as const;

const DIFFICULTY_OPTIONS = [
  { label: 'Easy', value: '1' },
  { label: 'Intermediate', value: '2' },
  { label: 'Advanced', value: '3' },
] as const;

const DIFFICULTY_META: Record<
  number,
  { label: string; badgeClass: string }
> = {
  1: { label: 'Easy', badgeClass: 'bg-emerald-50 text-emerald-700' },
  2: { label: 'Intermediate', badgeClass: 'bg-amber-50 text-amber-700' },
  3: { label: 'Advanced', badgeClass: 'bg-rose-50 text-rose-700' },
};

type ClassesSearchParams = {
  search?: string | string[];
  category?: string | string[];
  difficulty?: string | string[];
};

type ClassesPageProps = {
  searchParams?: Promise<ClassesSearchParams>;
};

const normalizeParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

const normalizeParamArray = (value?: string | string[]) =>
  Array.isArray(value) ? value : value ? [value] : [];

const isCategory = (value: string) =>
  CATEGORY_OPTIONS.includes(value as (typeof CATEGORY_OPTIONS)[number]);

const isDifficulty = (value: string) =>
  DIFFICULTY_OPTIONS.some((option) => option.value === value);

export default async function ClassesPage({ searchParams }: ClassesPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const searchValue = normalizeParam(resolvedParams?.search).trim();
  const categoryValues = normalizeParamArray(resolvedParams?.category)
    .map((value) => value.trim())
    .filter(Boolean);
  const difficultyValues = normalizeParamArray(resolvedParams?.difficulty)
    .map((value) => value.trim())
    .filter(Boolean);

  const selectedCategories = categoryValues.filter(isCategory);
  const selectedDifficulties = difficultyValues.filter(isDifficulty);
  const selectedDifficultyNumbers = selectedDifficulties.map((value) =>
    Number(value)
  );

  const filters = [
    searchValue
      ? ilike(workoutTypes.title, `%${searchValue}%`)
      : undefined,
    selectedCategories.length > 0
      ? inArray(workoutTypes.category, selectedCategories)
      : undefined,
    selectedDifficultyNumbers.length > 0
      ? inArray(workoutTypes.difficultyLevel, selectedDifficultyNumbers)
      : undefined,
  ].filter((filter): filter is SQL => Boolean(filter));

  const whereClause =
    filters.length === 0
      ? undefined
      : filters.length === 1
        ? filters[0]
        : and(...filters);

  const [workouts, totalRows] = await Promise.all([
    db
      .select({
        id: workoutTypes.id,
        slug: workoutTypes.slug,
        title: workoutTypes.title,
        description: workoutTypes.description,
        category: workoutTypes.category,
        difficultyLevel: workoutTypes.difficultyLevel,
      })
      .from(workoutTypes)
      .where(whereClause)
      .orderBy(asc(workoutTypes.title)),
    db
      .select({ value: sql<number>`count(*)` })
      .from(workoutTypes)
      .then((rows) => rows[0]?.value ?? 0),
  ]);

  const totalCount = Number(totalRows);

  return (
    <div className="bg-slate-50 pb-16">
      <main className="mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6 lg:px-10">
        <div className="rounded-3xl bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.24),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.22),_transparent_42%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_45%,_#faf5ff_100%)] p-4 shadow-xl shadow-slate-200/70 sm:p-8">
          <section className="rounded-3xl border border-white/70 bg-white/78 px-8 py-10 shadow-sm backdrop-blur sm:px-10">
            <span className="inline-flex w-fit items-center rounded-full bg-violet-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-600">
              Class Browsing
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Find your next workout
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
              Use search and difficulty filters to quickly discover sessions that
              match your pace.
            </p>
          </section>

      <section className="mt-5">
        <div className="rounded-3xl border border-white/70 bg-white/88 p-5 shadow-sm backdrop-blur sm:p-6">
          <FiltersClient
            search={searchValue}
            category={selectedCategories}
            difficulty={selectedDifficulties}
            categories={CATEGORY_OPTIONS}
            difficulties={DIFFICULTY_OPTIONS}
          />
        </div>

        <div className="mt-4 flex items-center justify-end text-sm text-slate-500">
          <span>
            {workouts.length} classes shown &#8226; {totalCount} total
          </span>
        </div>

        {workouts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-4">
            {workouts.map((workout) => {
              const meta = DIFFICULTY_META[workout.difficultyLevel] ??
                DIFFICULTY_META[1];
              const filledBars = Math.min(
                3,
                Math.max(1, workout.difficultyLevel)
              );

              return (
                <Link
                  key={workout.id}
                  href={`/classes/${workout.slug}`}
                  className="group flex h-full cursor-pointer flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {workout.category}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">
                      {workout.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {workout.description}
                    </p>
                  </div>

                  <div
                    className={`mt-6 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}
                  >
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <span
                          key={`difficulty-bar-${workout.id}-${index}`}
                          className={`h-2 w-1 rounded-full ${
                            index < filledBars ? 'bg-current' : 'bg-current/20'
                          }`}
                        />
                      ))}
                    </span>
                    {meta.label}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
        </div>
      </main>
    </div>
  );
}
