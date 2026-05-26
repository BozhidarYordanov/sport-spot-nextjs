'use client';

import { useState, useTransition } from 'react';

import { bookSessionAction, cancelBookingAction } from '@/app/classes/actions';

type SessionActionButtonProps = {
  scheduleId: number;
  variant: 'book' | 'cancel';
  className?: string;
};

const LABELS = {
  book: {
    idle: 'Book Session',
    pending: 'Booking...',
  },
  cancel: {
    idle: 'Cancel Booking',
    pending: 'Cancelling...',
  },
} as const;

const BASE_CLASS =
  'mt-4 w-full rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300';

const VARIANT_CLASS = {
  book:
    'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-200/70 hover:-translate-y-0.5 hover:shadow-xl',
  cancel:
    'border border-rose-200 bg-rose-50 text-rose-600 hover:-translate-y-0.5 hover:bg-rose-100',
} as const;

export default function SessionActionButton({
  scheduleId,
  variant,
  className,
}: SessionActionButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isBusy = isPending || isSubmitting;
  const label = isBusy ? LABELS[variant].pending : LABELS[variant].idle;
  const pendingClass = isBusy
    ? 'cursor-not-allowed opacity-70'
    : 'cursor-pointer';
  const classes = [
    BASE_CLASS,
    VARIANT_CLASS[variant],
    pendingClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = () => {
    setIsSubmitting(true);
    startTransition(() => {
      const action =
        variant === 'book'
          ? bookSessionAction(scheduleId)
          : cancelBookingAction(scheduleId);
      void action.finally(() => setIsSubmitting(false));
    });
  };

  return (
    <button
      type="button"
      className={classes}
      disabled={isBusy}
      onClick={handleClick}
    >
      {label}
    </button>
  );
}
