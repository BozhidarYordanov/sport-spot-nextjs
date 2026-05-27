import { and, asc, eq, gte } from "drizzle-orm";

import { db } from "@/db";
import { bookings, profiles, schedule, workoutTypes } from "@/db/schema";
import type { ApiViewer } from "@/lib/api-auth";

const upcomingClassBySlug = (slug: string) =>
  and(eq(workoutTypes.slug, slug), gte(schedule.startTime, new Date()));

export const getClassSessionBySlug = async (slug: string) =>
  db
    .select({
      id: schedule.id,
      slug: workoutTypes.slug,
      title: workoutTypes.title,
      description: workoutTypes.description,
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
    .where(upcomingClassBySlug(slug))
    .orderBy(asc(schedule.startTime))
    .limit(1)
    .then((rows) => rows[0]);

export const getClassDetailsBySlug = async (
  slug: string,
  viewer: ApiViewer
) => {
  const session = await getClassSessionBySlug(slug);
  if (!session) {
    return null;
  }

  const activeMembers = await db
    .select({
      userId: bookings.userId,
      fullName: profiles.fullName,
    })
    .from(bookings)
    .innerJoin(profiles, eq(bookings.userId, profiles.id))
    .where(and(eq(bookings.scheduleId, session.id), eq(bookings.status, "active")));

  const isEnrolled = activeMembers.some(
    (member) => member.userId === viewer.userId
  );
  const members = activeMembers
    .filter((member) => member.userId !== viewer.userId)
    .map((member) => member.fullName);

  return {
    ...session,
    isEnrolled,
    members,
  };
};
