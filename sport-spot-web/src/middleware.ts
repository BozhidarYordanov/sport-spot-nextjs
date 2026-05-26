import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME, verifyToken } from "@/lib/auth";

const isAuthRoute = (pathname: string) =>
  pathname === "/login" ||
  pathname.startsWith("/login/") ||
  pathname === "/register" ||
  pathname.startsWith("/register/");

const isPublicContentRoute = (pathname: string) =>
  pathname === "/classes" ||
  pathname.startsWith("/classes/") ||
  pathname === "/schedule" ||
  pathname.startsWith("/schedule/");

const isAdminRoute = (pathname: string) =>
  pathname === "/admin" || pathname.startsWith("/admin/");

export const middleware = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (isAdminRoute(pathname)) {
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const session = await verifyToken(sessionToken);

    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (session.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  const isPublicRoute =
    pathname === "/" ||
    isAuthRoute(pathname) ||
    isPublicContentRoute(pathname);

  if (!sessionToken && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (sessionToken && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
