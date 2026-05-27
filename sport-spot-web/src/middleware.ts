import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME, verifyToken } from "@/lib/auth";

const corsHeaders = {
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,DELETE,PATCH,POST,PUT,OPTIONS",
  "Access-Control-Allow-Headers":
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
};

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

const withCorsHeaders = (response: NextResponse) => {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
};

export const middleware = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (pathname.startsWith("/api/")) {
    if (request.method === "OPTIONS") {
      return withCorsHeaders(new NextResponse(null, { status: 204 }));
    }

    return withCorsHeaders(NextResponse.next());
  }

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
  matcher: ["/api/:path*", "/((?!_next|.*\\..*).*)"],
};
