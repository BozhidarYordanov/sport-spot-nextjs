import { SignJWT, jwtVerify } from "jose";

export type SessionPayload = {
  id: number;
  email: string;
  fullName: string;
  role: "admin" | "user";
};

export const SESSION_COOKIE_NAME = "session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;
const SESSION_DURATION_MS = SESSION_DURATION_SECONDS * 1000;

const isSessionRole = (role: unknown): role is SessionPayload["role"] =>
  role === "admin" || role === "user";

const toSessionPayload = (payload: unknown): SessionPayload | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as Record<string, unknown>;

  if (
    typeof candidate.id !== "number" ||
    typeof candidate.email !== "string" ||
    typeof candidate.fullName !== "string" ||
    !isSessionRole(candidate.role)
  ) {
    return null;
  }

  return {
    id: candidate.id,
    email: candidate.email,
    fullName: candidate.fullName,
    role: candidate.role,
  };
};

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
};

export const encryptJwt = async (payload: SessionPayload) => {
  const secret = getJwtSecret();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS)
    .sign(secret);
};

export const decryptJwt = async (token: string) => {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret);
  const session = toSessionPayload(payload);

  if (!session) {
    throw new Error("Invalid session token payload");
  }

  return session;
};

export const verifyToken = async (token: string) => {
  try {
    return await decryptJwt(token);
  } catch {
    return null;
  }
};

export const setSessionCookie = async (token: string) => {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + SESSION_DURATION_MS),
  });
};

export const clearSessionCookie = async () => {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
};

export const getSession = async () => {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  return sessionToken ? verifyToken(sessionToken) : null;
};

export const isAdmin = async () => {
  const session = await getSession();
  return session?.role === "admin";
};
