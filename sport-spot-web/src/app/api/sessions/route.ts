import { and, asc, eq, gte, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { schedule, workoutTypes } from "@/db/schema";
import { authenticateRequest, isAuthResponse } from "@/lib/api-auth";

const toPositiveInt = (value: string | null, fallback: number, max?: number) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return max ? Math.min(parsed, max) : parsed;
};

export const GET = async (request: Request) => {
  const viewer = await authenticateRequest(request);
  if (isAuthResponse(viewer)) {
    return viewer;
  }

  const url = new URL(request.url);
  const page = toPositiveInt(url.searchParams.get("page"), 1);
  const limit = toPositiveInt(url.searchParams.get("limit"), 10, 50);
  const search = url.searchParams.get("search")?.trim();
  const now = new Date();

  const filters: SQL[] = [gte(schedule.startTime, now)];
  if (search) {
    filters.push(
      or(
        ilike(workoutTypes.title, `%${search}%`),
        ilike(workoutTypes.category, `%${search}%`),
        ilike(schedule.trainerName, `%${search}%`),
        ilike(schedule.room, `%${search}%`)
      )!
    );
  }

  const whereClause = and(...filters);
  const [sessions, totalRows] = await Promise.all([
    db
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
      .where(whereClause)
      .orderBy(asc(schedule.startTime))
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ value: sql<number>`count(*)` })
      .from(schedule)
      .innerJoin(workoutTypes, eq(schedule.workoutTypeId, workoutTypes.id))
      .where(whereClause),
  ]);

  const total = Number(totalRows[0]?.value ?? 0);

  return NextResponse.json({
    total,
    page,
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
    items: sessions,
  });
};
