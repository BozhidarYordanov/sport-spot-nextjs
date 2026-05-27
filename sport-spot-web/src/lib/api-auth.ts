import { SignJWT, jwtVerify } from "jose";
import { NextResponse } from "next/server";

export type ApiRole = "admin" | "user";

export type ApiViewer = {
  userId: number;
  role: ApiRole;
};

const TOKEN_DURATION_SECONDS = 60 * 60 * 24 * 7;

const isApiRole = (role: unknown): role is ApiRole =>
  role === "admin" || role === "user";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  return new TextEncoder().encode(secret);
};

export const signApiToken = async (payload: ApiViewer) =>
  new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + TOKEN_DURATION_SECONDS)
    .sign(getJwtSecret());

export const verifyApiToken = async (token: string): Promise<ApiViewer | null> => {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());

    if (typeof payload.userId !== "number" || !isApiRole(payload.role)) {
      return null;
    }

    return {
      userId: payload.userId,
      role: payload.role,
    };
  } catch {
    return null;
  }
};

export const unauthorizedResponse = () =>
  NextResponse.json(
    { success: false, error: "Unauthorized: Missing or invalid token" },
    { status: 401 }
  );

export const authenticateRequest = async (
  request: Request
): Promise<ApiViewer | NextResponse> => {
  const authorization = request.headers.get("authorization");
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    return unauthorizedResponse();
  }

  const viewer = await verifyApiToken(token);
  return viewer ?? unauthorizedResponse();
};

export const isAuthResponse = (
  value: ApiViewer | NextResponse
): value is NextResponse => value instanceof NextResponse;
