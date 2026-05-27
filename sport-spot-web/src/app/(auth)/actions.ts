"use server";

import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, userRoles } from "@/db/schema";
import { encryptJwt, setSessionCookie, clearSessionCookie } from "@/lib/auth";

type ActionResult = { success: true } | { error: string };

type FormValue = FormDataEntryValue | null;

const getFormValue = (value: FormValue) =>
  typeof value === "string" ? value.trim() : "";

export const registerUserAction = async (
  formData: FormData
): Promise<ActionResult> => {
  try {
    const fullName = getFormValue(
      formData.get("fullName") ?? formData.get("name")
    );
    const email = getFormValue(formData.get("email"));
    const phone = getFormValue(formData.get("phone"));
    const password = getFormValue(formData.get("password"));

    if (!fullName || !email || !phone || !password) {
      return { error: "Missing required fields" };
    }

    const existingUser = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return { error: "Email already registered" };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const avatarUrl = `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`;

    const insertedProfiles = await db
      .insert(profiles)
      .values({
        email,
        passwordHash,
        fullName,
        phone,
        avatarUrl,
      })
      .returning({
        id: profiles.id,
        email: profiles.email,
        fullName: profiles.fullName,
        avatarUrl: profiles.avatarUrl,
      });

    const createdProfile = insertedProfiles[0];
    if (!createdProfile) {
      return { error: "Failed to create user" };
    }

    await db.insert(userRoles).values({
      userId: createdProfile.id,
      role: "user",
    });

    const token = await encryptJwt({
      id: createdProfile.id,
      email: createdProfile.email,
      fullName: createdProfile.fullName,
      avatarUrl: createdProfile.avatarUrl,
      role: "user",
    });

    await setSessionCookie(token);

    return { success: true };
  } catch {
    return { error: "Unable to register user" };
  }
};

export const loginUserAction = async (
  formData: FormData
): Promise<ActionResult> => {
  try {
    const email = getFormValue(formData.get("email"));
    const password = getFormValue(formData.get("password"));

    if (!email || !password) {
      return { error: "Invalid email or password" };
    }

    const userRows = await db
      .select({
        id: profiles.id,
        email: profiles.email,
        fullName: profiles.fullName,
        avatarUrl: profiles.avatarUrl,
        passwordHash: profiles.passwordHash,
        role: userRoles.role,
      })
      .from(profiles)
      .leftJoin(userRoles, eq(userRoles.userId, profiles.id))
      .where(eq(profiles.email, email))
      .limit(1);

    const user = userRows[0];

    if (!user || !user.passwordHash) {
      return { error: "Invalid email or password" };
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return { error: "Invalid email or password" };
    }

    const role = user.role ?? "user";

    const token = await encryptJwt({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      role,
    });

    await setSessionCookie(token);

    return { success: true };
  } catch {
    return { error: "Unable to login" };
  }
};

export const logoutUserAction = async (): Promise<ActionResult> => {
  try {
    await clearSessionCookie();
    return { success: true };
  } catch {
    return { error: "Unable to logout" };
  }
};
