import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { bookings, schedule } from "@/db/schema";
import { authenticateRequest, isAuthResponse } from "@/lib/api-auth";

type LeaveContext = {
  params: Promise<{ id: string }>;
};

const parseSessionId = (value: string) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown error";

export const POST = async (request: Request, { params }: LeaveContext) => {
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
    const deletedBookings = await db
      .delete(bookings)
      .where(
        and(
          eq(bookings.scheduleId, sessionId),
          eq(bookings.userId, viewer.userId),
          eq(bookings.status, "active")
        )
      )
      .returning({ id: bookings.id });

    if (deletedBookings.length === 0) {
      return NextResponse.json(
        { success: false, error: "You are not registered for this session" },
        { status: 400 }
      );
    }

    const updated = await db
      .update(schedule)
      .set({ enrolledCount: sql`GREATEST(${schedule.enrolledCount} - 1, 0)` })
      .where(eq(schedule.id, sessionId))
      .returning({
        id: schedule.id,
        enrolledCount: schedule.enrolledCount,
        capacity: schedule.capacity,
      });

    return NextResponse.json({
      success: true,
      sessionId,
      enrolledCount: updated[0]?.enrolledCount ?? 0,
      capacity: updated[0]?.capacity ?? null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: getErrorMessage(err) },
      { status: 400 }
    );
  }
};
