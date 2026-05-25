'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 border-b border-slate-100">
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
          <div className="flex items-center space-x-4">
            <button className="text-slate-700 font-medium text-sm hover:text-slate-900 transition-colors duration-200">
              Login
            </button>
            <Link
              href="/register"
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full px-5 py-2 text-sm font-medium hover:scale-105 transition-all duration-200 hover:shadow-lg hover:shadow-violet-200"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
