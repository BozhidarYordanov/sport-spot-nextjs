import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isAuthRoute = (pathname: string) =>
  pathname === "/login" ||
  pathname.startsWith("/login/") ||
  pathname === "/register" ||
  pathname.startsWith("/register/");

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get("session")?.value;

  const isPublicRoute = pathname === "/" || isAuthRoute(pathname);

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
