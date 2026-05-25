"use client";

import Link from "next/link";
import { useState } from "react";

const baseInputClassName =
  "w-full rounded-2xl border bg-slate-50/60 px-4 pb-3 pt-7 text-sm font-medium text-slate-900 shadow-sm transition placeholder:text-transparent focus:outline-none";

const defaultInputClassName =
  "border-slate-100 focus:border-violet-500 focus:ring-4 focus:ring-violet-200/60";

const errorInputClassName =
  "border-rose-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-100/60";

const labelClassName =
  "pointer-events-none absolute left-4 top-2 text-xs font-medium text-slate-500";

const errorTextClassName = "text-xs font-medium text-rose-500";

const toggleIconClassName =
  "absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 cursor-pointer text-slate-400 transition hover:text-slate-600";

function ErrorIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="0.9" fill="currentColor" />
    </svg>
  );
}

function EyeIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
    >
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.5" />
    </svg>
  );
}

function EyeSlashIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
    >
      <path
        d="M4 5.5 20 20"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 7.5C3.4 9.3 2.5 12 2.5 12s3.5 6 9.5 6c1.6 0 3-.3 4.2-.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.3 8.6A3.5 3.5 0 0 1 15.4 14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 10.2C18.4 11.3 19.5 12 19.5 12s-1.8 3.1-5 4.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function isEmailValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function RegisterPage() {
  const [values, setValues] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const emailValue = values.email.trim();
  const errors = {
    fullName: values.fullName.trim() ? "" : "Please enter your Full Name.",
    email: !emailValue
      ? "Please enter your Email address."
      : isEmailValid(emailValue)
        ? ""
        : "Please enter a valid email address.",
    phone: values.phone.trim() ? "" : "Please enter your Phone Number.",
    password: values.password.trim() ? "" : "Please enter your Password.",
    confirmPassword: values.confirmPassword.trim()
      ? ""
      : "Please enter your Confirm Password.",
  };

  const showError = (field: keyof typeof errors) =>
    touched[field] && Boolean(errors[field]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    });
  };

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(167,139,250,0.22),_transparent_60%),radial-gradient(circle_at_left,_rgba(255,255,255,0.9),_transparent_70%)]" />
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-violet-200/40 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="rounded-[2.5rem] bg-white px-8 py-10 shadow-2xl shadow-indigo-100/50 sm:px-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Create Account
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Join SportSpot and start booking your next class.
            </p>
          </div>

          <form
            className="mt-8 space-y-4"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="space-y-1">
              <div className="relative">
                <label htmlFor="full-name" className={labelClassName}>
                  Full Name
                </label>
                <input
                  id="full-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Full Name"
                  value={values.fullName}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      fullName: event.target.value,
                    }))
                  }
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, fullName: true }))
                  }
                  aria-invalid={showError("fullName")}
                  aria-describedby={
                    showError("fullName") ? "full-name-error" : undefined
                  }
                  className={`${baseInputClassName} pr-12 ${
                    showError("fullName")
                      ? errorInputClassName
                      : defaultInputClassName
                  }`}
                />
                {showError("fullName") ? (
                  <ErrorIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-500" />
                ) : null}
              </div>
              {showError("fullName") ? (
                <p id="full-name-error" className={errorTextClassName}>
                  {errors.fullName}
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <div className="relative">
                <label htmlFor="register-email" className={labelClassName}>
                  Email address
                </label>
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email address"
                  value={values.email}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, email: true }))
                  }
                  aria-invalid={showError("email")}
                  aria-describedby={
                    showError("email") ? "register-email-error" : undefined
                  }
                  className={`${baseInputClassName} pr-12 ${
                    showError("email")
                      ? errorInputClassName
                      : defaultInputClassName
                  }`}
                />
                {showError("email") ? (
                  <ErrorIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-500" />
                ) : null}
              </div>
              {showError("email") ? (
                <p id="register-email-error" className={errorTextClassName}>
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <div className="relative">
                <label htmlFor="phone" className={labelClassName}>
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Phone Number"
                  value={values.phone}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      phone: event.target.value,
                    }))
                  }
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, phone: true }))
                  }
                  aria-invalid={showError("phone")}
                  aria-describedby={
                    showError("phone") ? "phone-error" : undefined
                  }
                  className={`${baseInputClassName} pr-12 ${
                    showError("phone")
                      ? errorInputClassName
                      : defaultInputClassName
                  }`}
                />
                {showError("phone") ? (
                  <ErrorIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-500" />
                ) : null}
              </div>
              {showError("phone") ? (
                <p id="phone-error" className={errorTextClassName}>
                  {errors.phone}
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <div className="relative">
                <label htmlFor="register-password" className={labelClassName}>
                  Password
                </label>
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Password"
                  value={values.password}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, password: true }))
                  }
                  aria-invalid={showError("password")}
                  aria-describedby={
                    showError("password") ? "register-password-error" : undefined
                  }
                  className={`${baseInputClassName} pr-16 ${
                    showError("password")
                      ? errorInputClassName
                      : defaultInputClassName
                  }`}
                />
                {showError("password") ? (
                  <ErrorIcon className="pointer-events-none absolute right-11 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-500" />
                ) : null}
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className={toggleIconClassName}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              {showError("password") ? (
                <p id="register-password-error" className={errorTextClassName}>
                  {errors.password}
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <div className="relative">
                <label htmlFor="confirm-password" className={labelClassName}>
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Confirm Password"
                  value={values.confirmPassword}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      confirmPassword: event.target.value,
                    }))
                  }
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, confirmPassword: true }))
                  }
                  aria-invalid={showError("confirmPassword")}
                  aria-describedby={
                    showError("confirmPassword")
                      ? "confirm-password-error"
                      : undefined
                  }
                  className={`${baseInputClassName} pr-16 ${
                    showError("confirmPassword")
                      ? errorInputClassName
                      : defaultInputClassName
                  }`}
                />
                {showError("confirmPassword") ? (
                  <ErrorIcon className="pointer-events-none absolute right-11 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-500" />
                ) : null}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  className={toggleIconClassName}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              {showError("confirmPassword") ? (
                <p id="confirm-password-error" className={errorTextClassName}>
                  {errors.confirmPassword}
                </p>
              ) : null}
            </div>

            <div className="pt-4">
              <div className="border-t border-slate-100 pt-6">
                <button
                  type="submit"
                  className="w-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                >
                  Create Account
                </button>
              </div>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-violet-600 hover:text-violet-700"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
