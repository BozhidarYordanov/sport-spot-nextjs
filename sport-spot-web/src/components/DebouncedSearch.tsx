'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

type DebouncedSearchProps = {
  placeholder: string;
  paramKey: string;
  className?: string;
};

const defaultInputClassName =
  'w-full rounded-full border border-indigo-200 bg-white py-2.5 pl-11 pr-4 text-sm font-medium text-slate-800 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100';

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path
        d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m21 21-4.3-4.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DebouncedSearch({
  placeholder,
  paramKey,
  className,
}: DebouncedSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const currentValue = searchParams.get(paramKey) ?? '';
  const [value, setValue] = useState(currentValue);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setValue(currentValue);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [currentValue]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const trimmedValue = value.trim();

      if (trimmedValue === currentValue) {
        return;
      }

      const nextParams = new URLSearchParams(searchParams.toString());

      if (trimmedValue) {
        nextParams.set(paramKey, trimmedValue);
      } else {
        nextParams.delete(paramKey);
      }

      const queryString = nextParams.toString();
      const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;

      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [currentValue, paramKey, pathname, router, searchParams, value]);

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        <SearchIcon />
      </span>
      <input
        type="search"
        name={paramKey}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-busy={isPending}
        className={className ?? defaultInputClassName}
      />
    </div>
  );
}
