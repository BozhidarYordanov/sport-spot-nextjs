import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { bookings, schedule } from "@/db/schema";
import { authenticateRequest, isAuthResponse } from "@/lib/api-auth";

type JoinContext = {
  params: Promise<{ id: string }>;
};

const parseSessionId = (value: string) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown error";

export const POST = async (request: Request, { params }: JoinContext) => {
  const viewer = await authenticateRequest(request);
  if (isAuthResponse(viewer)) {
    return viewer;
  }

  const { id: idParam } = await params;
  const sessionId = parseSessionId(idParam);
  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: "Invalid session ID" },
      { status: 400 }
    );
  }

  try {
    const existingSession = await db
      .select({
        id: schedule.id,
        enrolledCount: schedule.enrolledCount,
        capacity: schedule.capacity,
      })
      .from(schedule)
      .where(eq(schedule.id, sessionId))
      .limit(1);

    const currentSession = existingSession[0];
    if (!currentSession) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 400 }
      );
    }

    if (currentSession.enrolledCount >= currentSession.capacity) {
      return NextResponse.json(
        { success: false, error: "Session is already full" },
        { status: 400 }
      );
    }

    const existingBooking = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.scheduleId, sessionId),
          eq(bookings.userId, viewer.userId),
          eq(bookings.status, "active")
        )
      )
      .limit(1);

    if (existingBooking.length > 0) {
      return NextResponse.json(
        { success: false, error: "You are already joined to this session" },
        { status: 400 }
      );
    }

    await db.insert(bookings).values({
      scheduleId: sessionId,
      userId: viewer.userId,
      status: "active",
    });

    const updated = await db
      .update(schedule)
      .set({ enrolledCount: sql`${schedule.enrolledCount} + 1` })
      .where(eq(schedule.id, sessionId))
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
          sessionId,
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
