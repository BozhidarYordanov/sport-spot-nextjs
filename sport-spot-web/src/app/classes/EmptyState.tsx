'use client';

import { usePathname, useRouter } from 'next/navigation';

export default function EmptyState() {
  const router = useRouter();
  const pathname = usePathname();

  const handleReset = () => {
    router.replace(pathname, { scroll: false });
  };

  return (
    <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-xl shadow-slate-100/50">
      <h2 className="text-lg font-semibold text-slate-900">
        No classes found
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        No workouts found for this criteria. Try clearing the filters.
      </p>
      <button
        type="button"
        onClick={handleReset}
        className="mt-6 cursor-pointer rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-2xl"
      >
        Reset Filters
      </button>
    </div>
  );
}
