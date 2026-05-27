import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getClassSessionBySlug } from "@/app/api/classes/details";
import { db } from "@/db";
import { bookings, schedule } from "@/db/schema";
import { authenticateRequest, isAuthResponse } from "@/lib/api-auth";

type JoinContext = {
  params: Promise<{ slug: string }>;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown error";

export const POST = async (request: Request, { params }: JoinContext) => {
  const viewer = await authenticateRequest(request);
  if (isAuthResponse(viewer)) {
    return viewer;
  }

  const { slug: slugParam } = await params;
  const slug = decodeURIComponent(slugParam).trim();
  if (!slug) {
    return NextResponse.json(
      { success: false, error: "Invalid class slug" },
      { status: 400 }
    );
  }

  try {
    const currentSession = await getClassSessionBySlug(slug);
    if (!currentSession) {
      return NextResponse.json(
        { success: false, error: "Class not found" },
        { status: 404 }
      );
    }

    if (currentSession.enrolledCount >= currentSession.capacity) {
      return NextResponse.json(
        { success: false, error: "Class is already full" },
        { status: 400 }
      );
    }

    const existingBooking = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.scheduleId, currentSession.id),
          eq(bookings.userId, viewer.userId),
          eq(bookings.status, "active")
        )
      )
      .limit(1);

    if (existingBooking.length > 0) {
      return NextResponse.json(
        { success: false, error: "You are already joined to this class" },
        { status: 400 }
      );
    }

    await db.insert(bookings).values({
      scheduleId: currentSession.id,
      userId: viewer.userId,
      status: "active",
    });

    const updated = await db
      .update(schedule)
      .set({ enrolledCount: sql`${schedule.enrolledCount} + 1` })
      .where(eq(schedule.id, currentSession.id))
      .returning({
        id: schedule.id,
        enrolledCount: schedule.enrolledCount,
        capacity: schedule.capacity,
      });

    const session = updated[0] ?? currentSession;

    return NextResponse.json(
      {
        success: true,
        booking: {
          sessionId: currentSession.id,
          classId: currentSession.id,
          slug,
          userId: viewer.userId,
          enrolledCount: session.enrolledCount,
          capacity: session.capacity,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: getErrorMessage(err) },
      { status: 400 }
    );
  }
};
