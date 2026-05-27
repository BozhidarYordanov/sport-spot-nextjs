import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { bookings, profiles, schedule, workoutTypes } from "@/db/schema";
import { authenticateRequest, isAuthResponse } from "@/lib/api-auth";

type SessionDetailsContext = {
  params: Promise<{ id: string }>;
};

const parseSessionId = (value: string) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const GET = async (
  request: Request,
  { params }: SessionDetailsContext
) => {
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

  const session = await db
    .select({
      id: schedule.id,
      startTime: schedule.startTime,
      trainerName: schedule.trainerName,
      room: schedule.room,
      capacity: schedule.capacity,
      enrolledCount: schedule.enrolledCount,
      workout: {
        id: workoutTypes.id,
        title: workoutTypes.title,
        category: workoutTypes.category,
        description: workoutTypes.description,
        durationMinutes: workoutTypes.durationMinutes,
        difficultyLevel: workoutTypes.difficultyLevel,
        slug: workoutTypes.slug,
        imageUrl: workoutTypes.imageUrl,
      },
    })
    .from(schedule)
    .innerJoin(workoutTypes, eq(schedule.workoutTypeId, workoutTypes.id))
    .where(eq(schedule.id, sessionId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Session not found" },
      { status: 400 }
    );
  }

  const activeMembers = await db
    .select({
      userId: bookings.userId,
      fullName: profiles.fullName,
    })
    .from(bookings)
    .innerJoin(profiles, eq(bookings.userId, profiles.id))
    .where(and(eq(bookings.scheduleId, sessionId), eq(bookings.status, "active")));

  const isEnrolled = activeMembers.some(
    (member) => member.userId === viewer.userId
  );
  const otherMembers = activeMembers
    .filter((member) => member.userId !== viewer.userId)
    .map((member) => member.fullName);

  return NextResponse.json({
    ...session,
    isEnrolled,
    members: otherMembers,
  });
};
