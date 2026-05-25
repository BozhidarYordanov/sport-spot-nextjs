'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md relative">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold tracking-tight text-slate-900 hover:text-slate-700 transition-colors">
              SportSpot
            </Link>
          </div>

          {/* Center: Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-slate-700 font-medium text-sm hover:text-slate-900 transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-violet-600 after:to-indigo-600 after:transition-all after:duration-300 hover:after:w-full"
            >
              Home
            </Link>
            <Link
              href="/classes"
              className="text-slate-700 font-medium text-sm hover:text-slate-900 transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-violet-600 after:to-indigo-600 after:transition-all after:duration-300 hover:after:w-full"
            >
              Classes
            </Link>
            <Link
              href="/schedule"
              className="text-slate-700 font-medium text-sm hover:text-slate-900 transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-violet-600 after:to-indigo-600 after:transition-all after:duration-300 hover:after:w-full"
            >
              Schedule
            </Link>
          </nav>

          {/* Right: Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/login"
              className="cursor-pointer rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-[#1a1a1b] shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full px-5 py-2 text-sm font-medium hover:scale-105 transition-all duration-200 hover:shadow-lg hover:shadow-violet-200"
            >
              Register
            </Link>
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
            </nav>
            <div className="mt-5 flex items-center gap-3">
              <Link
                href="/login"
                onClick={closeMobileMenu}
                className="flex-1 cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-[#1a1a1b] shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={closeMobileMenu}
                className="flex-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-200/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
