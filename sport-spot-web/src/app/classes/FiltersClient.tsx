'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

import DebouncedSearch from '@/components/DebouncedSearch';

type DifficultyOption = {
  label: string;
  value: string;
};

type FiltersClientProps = {
  search: string;
  category: string[];
  difficulty: string[];
  categories: readonly string[];
  difficulties: readonly DifficultyOption[];
};

export default function FiltersClient({
  category,
  difficulty,
  categories,
  difficulties,
}: FiltersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const applyParams = (nextParams: URLSearchParams) => {
    const query = nextParams.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;
    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  };

  const toggleMultiParam = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    const existingValues = nextParams.getAll(key);
    const hasValue = existingValues.includes(value);
    const nextValues = hasValue
      ? existingValues.filter((item) => item !== value)
      : [...existingValues, value];

    nextParams.delete(key);
    Array.from(new Set(nextValues)).forEach((item) => {
      nextParams.append(key, item);
    });
    applyParams(nextParams);
  };

  const basePillClass =
    'cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200';
  const inactivePillClass =
    'border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-700';
  const activePillClass =
    'border-transparent bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-200';

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-700">Search by title</p>
        <DebouncedSearch
          placeholder="Try: Yoga, Pilates, Boxing..."
          paramKey="search"
          className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-700 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div className="grid gap-5">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">Difficulty</p>
          <div className="flex flex-wrap gap-2">
            {difficulties.map((option) => {
              const isActive = difficulty.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => toggleMultiParam('difficulty', option.value)}
                  className={`${basePillClass} ${
                    isActive ? activePillClass : inactivePillClass
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">Category</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((option) => {
              const isActive = category.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => toggleMultiParam('category', option)}
                  className={`${basePillClass} ${
                    isActive ? activePillClass : inactivePillClass
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
