'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { logoutUserAction } from '@/app/(auth)/actions';

type HeaderClientProps = {
  userName: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
};

const navLinkClass =
  'px-2 py-1 text-slate-700 font-medium text-sm hover:text-slate-900 transition-colors duration-200 relative after:absolute after:bottom-0 after:left-2 after:right-2 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-violet-600 after:to-indigo-600 after:transition-all after:duration-300 hover:after:w-[calc(100%-1rem)]';

const adminLinkClass =
  'border border-violet-200 text-violet-700 bg-violet-50/50 px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 hover:bg-violet-100 transition-all';

function AdminShieldIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
    >
      <path d="M12 3.5 18.5 6v5.2c0 4.1-2.6 7.8-6.5 9.3-3.9-1.5-6.5-5.2-6.5-9.3V6L12 3.5Z" />
      <path d="M9.8 12.1 11.2 13.5l3.2-3.4" />
    </svg>
  );
}

export default function HeaderClient({
  userName,
  isAuthenticated,
  isAdmin,
}: HeaderClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    startTransition(() => {
      void (async () => {
        await logoutUserAction();
        router.push('/');
        router.refresh();
      })();
    });
  };

  const firstName = userName?.split(' ')[0] ?? 'there';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md relative">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className="text-xl font-bold tracking-tight text-slate-900 hover:text-slate-700 transition-colors"
            >
              SportSpot
            </Link>
          </div>

          <div className="ml-auto hidden items-center gap-6 md:flex">
            <nav className="flex items-center gap-5">
              <Link href="/" className={navLinkClass}>
                Home
              </Link>
              <Link href="/classes" className={navLinkClass}>
                Classes
              </Link>
              <Link href="/schedule" className={navLinkClass}>
                Schedule
              </Link>
              {isAuthenticated ? (
                <Link href="/dashboard" className={navLinkClass}>
                  Dashboard
                </Link>
              ) : null}
              {isAdmin ? (
                <Link href="/admin" className={adminLinkClass}>
                  <AdminShieldIcon />
                  Admin
                </Link>
              ) : null}
            </nav>

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm font-semibold text-slate-600">
                  Hi, {firstName}!
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isPending}
                  aria-busy={isPending}
                  className="cursor-pointer rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isPending ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="cursor-pointer rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-700 hover:shadow-md"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            className="md:hidden flex items-center justify-center h-10 w-10 rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300"
          >
            {isMobileMenuOpen ? (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path d="M6 6l12 12" strokeLinecap="round" />
                <path d="M18 6l-12 12" strokeLinecap="round" />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
              >
                <path d="M4 7h16" strokeLinecap="round" />
                <path d="M4 12h16" strokeLinecap="round" />
                <path d="M4 17h16" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div
        className={`md:hidden absolute left-0 right-0 top-full transition-all duration-200 ${
          isMobileMenuOpen
            ? 'translate-y-0 opacity-100'
            : '-translate-y-2 opacity-0 pointer-events-none'
        }`}
      >
        <div className="px-6 pb-6 pt-3">
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xl shadow-slate-100/50">
            <nav className="flex flex-col space-y-4 text-sm font-medium text-slate-600">
              <Link href="/" onClick={closeMobileMenu}>
                Home
              </Link>
              <Link href="/classes" onClick={closeMobileMenu}>
                Classes
              </Link>
              <Link href="/schedule" onClick={closeMobileMenu}>
                Schedule
              </Link>
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" onClick={closeMobileMenu}>
                    Dashboard
                  </Link>
                  {isAdmin ? (
                    <Link
                      href="/admin"
                      onClick={closeMobileMenu}
                      className={adminLinkClass}
                    >
                      <AdminShieldIcon />
                      Admin
                    </Link>
                  ) : null}
                </>
              ) : null}
            </nav>
            <div className="mt-5 flex flex-col gap-3">
              {isAuthenticated ? (
                <>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                    Hi, {firstName}!
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      handleLogout();
                    }}
                    disabled={isPending}
                    aria-busy={isPending}
                    className="w-full cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {isPending ? 'Logging out...' : 'Logout'}
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="flex-1 cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-700 hover:shadow-md"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={closeMobileMenu}
                    className="flex-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-200/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
