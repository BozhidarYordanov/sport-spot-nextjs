'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type AdminSearchInputProps = {
  initialValue: string;
};

export default function AdminSearchInput({
  initialValue,
}: AdminSearchInputProps) {
  const [value, setValue] = useState(initialValue);
  const router = useRouter();

  const handleChange = (nextValue: string) => {
    setValue(nextValue);

    const params = new URLSearchParams(window.location.search);
    const trimmedValue = nextValue.trim();

    if (trimmedValue) {
      params.set('search', trimmedValue);
    } else {
      params.delete('search');
    }

    params.delete('page');
    const queryString = params.toString();
    router.replace(queryString ? `/admin?${queryString}` : '/admin', {
      scroll: false,
    });
  };

  return (
    <input
      id="admin-booking-search"
      type="search"
      value={value}
      onChange={(event) => handleChange(event.target.value)}
      placeholder="Search by user name or workout title"
      className="h-9 w-full rounded-full border border-indigo-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
    />
  );
}
