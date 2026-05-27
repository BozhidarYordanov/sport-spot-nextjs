'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { deleteUserAction } from './actions';

type AdminDeleteUserButtonProps = {
  userId: number;
};

export default function AdminDeleteUserButton({
  userId,
}: AdminDeleteUserButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    setError(null);

    startTransition(() => {
      void (async () => {
        const result = await deleteUserAction(String(userId));

        if ('error' in result) {
          setError(result.error);
          return;
        }

        router.refresh();
      })();
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="cursor-pointer rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-sm ring-1 ring-slate-100 transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'Deleting...' : 'Delete'}
      </button>
      {error ? (
        <span className="text-right text-[11px] font-medium text-rose-500">
          {error}
        </span>
      ) : null}
    </div>
  );
}
