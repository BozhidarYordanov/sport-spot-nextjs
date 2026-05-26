"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { loginUserAction } from "../actions";

const baseInputClassName =
  "w-full rounded-2xl border bg-slate-50/60 px-4 pb-3 pt-7 text-sm font-medium text-slate-900 shadow-sm transition placeholder:text-transparent focus:outline-none";

const defaultInputClassName =
  "border-slate-100 focus:border-violet-500 focus:ring-4 focus:ring-violet-200/60";

const errorInputClassName =
  "border-rose-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-100/60";

const labelClassName =
  "pointer-events-none absolute left-4 top-2 text-xs font-medium text-slate-500";

const errorTextClassName = "text-xs font-medium text-rose-500";

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

function isEmailValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function LoginPage() {
  const [values, setValues] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const emailValue = values.email.trim();
  const errors = {
    email: !emailValue
      ? "Please enter your email address."
      : isEmailValid(emailValue)
        ? ""
        : "Please enter a valid email address.",
    password: values.password.trim() ? "" : "Please enter your password.",
  };

  const showError = (field: keyof typeof errors) =>
    touched[field] && Boolean(errors[field]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ email: true, password: true });
    setErrorMessage(null);

    if (errors.email || errors.password) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      void (async () => {
        const result = await loginUserAction(formData);

        if ("error" in result) {
          setErrorMessage(result.error);
          return;
        }

        router.push("/dashboard");
        router.refresh();
      })();
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
              Welcome Back
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Sign in to continue your SportSpot experience.
            </p>
          </div>

          <form
            className="mt-8 space-y-4"
            onSubmit={handleSubmit}
            noValidate
          >
            {errorMessage ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-600 shadow-sm">
                {errorMessage}
              </div>
            ) : null}

            <div className="space-y-1">
              <div className="relative">
                <label htmlFor="email" className={labelClassName}>
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
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
                  aria-describedby={showError("email") ? "email-error" : undefined}
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
                <p id="email-error" className={errorTextClassName}>
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <div className="relative">
                <label htmlFor="password" className={labelClassName}>
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
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
                    showError("password") ? "password-error" : undefined
                  }
                  className={`${baseInputClassName} pr-12 ${
                    showError("password")
                      ? errorInputClassName
                      : defaultInputClassName
                  }`}
                />
                {showError("password") ? (
                  <ErrorIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-500" />
                ) : null}
              </div>
              {showError("password") ? (
                <p id="password-error" className={errorTextClassName}>
                  {errors.password}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={isPending}
              aria-busy={isPending}
              className="mt-2 w-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
            >
              {isPending ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            New here?{" "}
            <Link
              href="/register"
              className="font-semibold text-violet-600 hover:text-violet-700"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
