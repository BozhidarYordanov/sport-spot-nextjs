'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

type RollingCalendarProps = {
  selectedDate: string;
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
});

const monthDayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const parseDateKey = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};

export default function RollingCalendar({ selectedDate }: RollingCalendarProps) {
  const router = useRouter();
  const [baseDate] = useState(() => parseDateKey(toDateKey(new Date())));
  const [offset, setOffset] = useState(0);

  const days = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => addDays(baseDate, offset + index)),
    [baseDate, offset]
  );
  const firstDay = days[0];
  const lastDay = days[days.length - 1];

  const handleSelect = (date: Date) => {
    router.push(`/schedule?date=${toDateKey(date)}`, { scroll: false });
  };

  return (
    <section className="rounded-3xl border border-white/70 bg-white/88 p-5 shadow-xl shadow-indigo-100/40 backdrop-blur">
      <div className="mb-4 flex items-center justify-between gap-4">
        <button
          type="button"
          aria-label="Previous dates"
          disabled={offset === 0}
          onClick={() => setOffset((current) => Math.max(0, current - 3))}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-lg leading-none shadow-sm transition-all ${
            offset === 0
              ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
              : 'border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-700'
          }`}
        >
          &lt;
        </button>
        <p className="text-sm font-semibold text-slate-600">
          {monthDayFormatter.format(firstDay)} - {monthDayFormatter.format(lastDay)}
        </p>
        <button
          type="button"
          aria-label="Next dates"
          onClick={() => setOffset((current) => current + 3)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-lg leading-none text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-700"
        >
          &gt;
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6 lg:grid-cols-12">
        {days.map((date, index) => {
          const key = toDateKey(date);
          const [weekday, day, month] = dateFormatter
            .format(date)
            .replace(',', '')
            .split(' ');
          const isActive = key === selectedDate;
          const mobileVisibility = index < 3 ? '' : 'hidden sm:flex';

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelect(date)}
              className={[
                'flex min-h-16 cursor-pointer flex-col items-start justify-center rounded-2xl border px-3 py-2 text-left transition-all duration-300 hover:-translate-y-0.5',
                mobileVisibility,
                isActive
                  ? 'border-transparent bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-200'
                  : 'border-slate-100 bg-white text-slate-900 hover:border-violet-200 hover:shadow-md',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="text-[10px] font-bold uppercase leading-none">
                {weekday}
              </span>
              <span className="mt-1 text-lg font-bold leading-none">{month}</span>
              <span
                className={`mt-1 text-[11px] leading-none ${
                  isActive ? 'text-white/80' : 'text-slate-500'
                }`}
              >
                {day}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
