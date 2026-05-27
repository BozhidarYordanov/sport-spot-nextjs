import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { profiles, userRoles } from "@/db/schema";
import { signApiToken } from "@/lib/api-auth";

type RegisterBody = {
  email?: unknown;
  password?: unknown;
  fullName?: unknown;
};

const isUniqueViolation = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === "23505";

export const POST = async (request: Request) => {
  try {
    let body: RegisterBody;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const fullName =
      typeof body.fullName === "string" ? body.fullName.trim() : "";

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { success: false, error: "Email, password, and fullName are required" },
        { status: 400 }
      );
    }

    const existingUser = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, error: "Email is already registered" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const avatarUrl = `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`;

    const insertedProfiles = await db
      .insert(profiles)
      .values({
        email,
        passwordHash,
        fullName,
        phone: "",
        avatarUrl,
      })
      .returning({
        id: profiles.id,
        email: profiles.email,
        fullName: profiles.fullName,
      });

    const createdProfile = insertedProfiles[0];
    if (!createdProfile) {
      return NextResponse.json(
        { success: false, error: "Failed to create user" },
        { status: 500 }
      );
    }

    const role = "user" as const;

    await db.insert(userRoles).values({
      userId: createdProfile.id,
      role,
    });

    const token = await signApiToken({ userId: createdProfile.id, role });

    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: createdProfile.id,
          email: createdProfile.email,
          fullName: createdProfile.fullName,
          role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { success: false, error: "Email is already registered" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Unable to register user" },
      { status: 500 }
    );
  }
};
