import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getClassSessionBySlug } from "@/app/api/classes/details";
import { db } from "@/db";
import { bookings, schedule } from "@/db/schema";
import { authenticateRequest, isAuthResponse } from "@/lib/api-auth";

type LeaveContext = {
  params: Promise<{ slug: string }>;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown error";

export const POST = async (request: Request, { params }: LeaveContext) => {
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

    const deletedBookings = await db
      .delete(bookings)
      .where(
        and(
          eq(bookings.scheduleId, currentSession.id),
          eq(bookings.userId, viewer.userId),
          eq(bookings.status, "active")
        )
      )
      .returning({ id: bookings.id });

    if (deletedBookings.length === 0) {
      return NextResponse.json(
        { success: false, error: "You are not registered for this class" },
        { status: 400 }
      );
    }

    const updated = await db
      .update(schedule)
      .set({ enrolledCount: sql`GREATEST(${schedule.enrolledCount} - 1, 0)` })
      .where(eq(schedule.id, currentSession.id))
      .returning({
        id: schedule.id,
        enrolledCount: schedule.enrolledCount,
        capacity: schedule.capacity,
      });

    return NextResponse.json({
      success: true,
      sessionId: currentSession.id,
      classId: currentSession.id,
      slug,
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
