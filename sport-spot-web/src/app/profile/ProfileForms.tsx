'use client';

import { useState, useTransition } from 'react';

import {
  changePasswordAction,
  updateProfileDetailsAction,
} from './actions';

type ProfileFormsProps = {
  fullName: string;
  email: string;
  phone: string;
};

type AccountErrors = Partial<Record<'fullName' | 'phone', string>>;
type PasswordErrors = Partial<
  Record<'newPassword' | 'confirmPassword', string>
>;

const inputClassName =
  'w-full rounded-2xl border bg-white px-4 pb-3 pt-7 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-transparent focus:border-violet-400 focus:ring-4 focus:ring-violet-100';
const labelClassName =
  'pointer-events-none absolute left-4 top-2 text-xs font-medium text-slate-500';
const errorClassName = 'text-xs font-semibold text-rose-500';

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

const getValue = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
};

const isPhoneValid = (phone: string) =>
  /^\d{10}$/.test(phone) || /^0\d{9}$/.test(phone) || /^\+359\d{9}$/.test(phone);

const isPasswordValid = (password: string) =>
  password.length >= 8 &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

export default function ProfileForms({
  fullName,
  email,
  phone,
}: ProfileFormsProps) {
  const [accountErrors, setAccountErrors] = useState<AccountErrors>({});
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [accountServerError, setAccountServerError] = useState<string | null>(
    null
  );
  const [passwordServerError, setPasswordServerError] = useState<string | null>(
    null
  );
  const [isAccountPending, startAccountTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();

  const getInputClassName = (hasError: boolean, disabled = false) =>
    `${inputClassName} ${
      hasError ? 'border-rose-300' : 'border-slate-100'
    } ${disabled ? 'bg-slate-50 text-slate-600' : ''}`;

  const handleAccountSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextErrors: AccountErrors = {};
    const nextFullName = getValue(formData, 'fullName');
    const nextPhone = getValue(formData, 'phone');

    setAccountMessage(null);
    setAccountServerError(null);

    if (!nextFullName || nextFullName.length < 3) {
      nextErrors.fullName = 'Full name must be at least 3 characters.';
    }

    if (!isPhoneValid(nextPhone)) {
      nextErrors.phone =
        'Use exactly 10 digits, a Bulgarian number starting with 0, or +359 format.';
    }

    setAccountErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    startAccountTransition(() => {
      void (async () => {
        const result = await updateProfileDetailsAction(formData);

        if ('error' in result) {
          setAccountServerError(result.error);
          return;
        }

        setAccountMessage('Profile details saved successfully.');
      })();
    });
  };

  const handlePasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const nextErrors: PasswordErrors = {};
    const newPassword = getValue(formData, 'newPassword');
    const confirmPassword = getValue(formData, 'confirmPassword');

    setPasswordMessage(null);
    setPasswordServerError(null);

    if (!isPasswordValid(newPassword)) {
      nextErrors.newPassword =
        'Use at least 8 characters with a number and special character.';
    }

    if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords must match.';
    }

    setPasswordErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    startPasswordTransition(() => {
      void (async () => {
        const result = await changePasswordAction(formData);

        if ('error' in result) {
          setPasswordServerError(result.error);
          return;
        }

        form.reset();
        setPasswordMessage('Password changed successfully.');
      })();
    });
  };

  return (
    <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.95fr)]">
      <form
        onSubmit={handleAccountSubmit}
        className="rounded-3xl border border-white/70 bg-white/88 px-8 py-10 shadow-sm backdrop-blur sm:px-11"
        noValidate
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Account Details
          </h2>
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-indigo-600">
            Editable
          </span>
        </div>

        {accountMessage ? (
          <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {accountMessage}
          </div>
        ) : null}
        {accountServerError ? (
          <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
            {accountServerError}
          </div>
        ) : null}

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <div className="relative">
              <label htmlFor="fullName" className={labelClassName}>
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                defaultValue={fullName}
                placeholder="Full Name"
                aria-invalid={Boolean(accountErrors.fullName)}
                className={getInputClassName(Boolean(accountErrors.fullName))}
              />
            </div>
            {accountErrors.fullName ? (
              <p className={errorClassName}>{accountErrors.fullName}</p>
            ) : null}
          </div>

          <div>
            <div className="relative">
              <label htmlFor="email" className={labelClassName}>
                Email
              </label>
              <input
                id="email"
                value={email}
                disabled
                placeholder="Email"
                className={`${getInputClassName(false, true)} pr-12`}
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                <LockIcon />
              </span>
            </div>
            <p className="mt-1.5 text-xs font-medium text-slate-500">
              Email is used for account identity and cannot be changed directly.
              Contact support for help.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="relative">
              <label htmlFor="phone" className={labelClassName}>
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                defaultValue={phone}
                placeholder="Phone"
                aria-invalid={Boolean(accountErrors.phone)}
                className={getInputClassName(Boolean(accountErrors.phone))}
              />
            </div>
            {accountErrors.phone ? (
              <p className={errorClassName}>{accountErrors.phone}</p>
            ) : null}
          </div>
        </div>

        <button
          type="submit"
          disabled={isAccountPending}
          className="mt-4 cursor-pointer rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200/70 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {isAccountPending ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      <form
        onSubmit={handlePasswordSubmit}
        className="rounded-3xl border border-white/70 bg-white/88 px-8 py-10 shadow-sm backdrop-blur sm:px-11"
        noValidate
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Security
          </h2>
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-indigo-600">
            Password
          </span>
        </div>

        {passwordMessage ? (
          <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {passwordMessage}
          </div>
        ) : null}
        {passwordServerError ? (
          <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
            {passwordServerError}
          </div>
        ) : null}

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <div className="relative">
              <label htmlFor="newPassword" className={labelClassName}>
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="New Password"
                aria-invalid={Boolean(passwordErrors.newPassword)}
                className={getInputClassName(Boolean(passwordErrors.newPassword))}
              />
            </div>
            {passwordErrors.newPassword ? (
              <p className={errorClassName}>{passwordErrors.newPassword}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <div className="relative">
              <label htmlFor="confirmPassword" className={labelClassName}>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                aria-invalid={Boolean(passwordErrors.confirmPassword)}
                className={getInputClassName(
                  Boolean(passwordErrors.confirmPassword)
                )}
              />
            </div>
            {passwordErrors.confirmPassword ? (
              <p className={errorClassName}>{passwordErrors.confirmPassword}</p>
            ) : null}
          </div>
        </div>

        <button
          type="submit"
          disabled={isPasswordPending}
          className="mt-4 cursor-pointer rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200/70 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {isPasswordPending ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </section>
  );
}
