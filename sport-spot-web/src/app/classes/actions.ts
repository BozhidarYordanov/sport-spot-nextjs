'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { and, eq, lt, sql } from 'drizzle-orm';

import { db } from '@/db';
import { bookings, schedule } from '@/db/schema';
import { verifyToken } from '@/lib/auth';

type ActionResult = { success: true; enrolledCount: number } | { error: string };
type ActionOptions = {
  revalidatePaths?: boolean;
};

const getViewer = async () => {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) {
    return null;
  }

  return verifyToken(sessionToken);
};

export const bookSessionAction = async (
  scheduleId: number,
  options: ActionOptions = {}
): Promise<ActionResult> => {
  const viewer = await getViewer();
  if (!viewer) {
    return { error: 'unauthenticated' };
  }

  try {
    const existingBooking = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.scheduleId, scheduleId),
          eq(bookings.userId, viewer.id),
          eq(bookings.status, 'active')
        )
      )
      .limit(1);

    if (existingBooking.length > 0) {
      return { error: 'Already booked' };
    }

    const sessionRow = await db
      .select({
        capacity: schedule.capacity,
        enrolledCount: schedule.enrolledCount,
      })
      .from(schedule)
      .where(eq(schedule.id, scheduleId))
      .limit(1);

    const session = sessionRow[0];
    if (!session) {
      return { error: 'Session not found' };
    }

    if (session.enrolledCount >= session.capacity) {
      return { error: 'Class is full' };
    }

    const updated = await db
      .update(schedule)
      .set({
        enrolledCount: sql`${schedule.enrolledCount} + 1`,
      })
      .where(
        and(
          eq(schedule.id, scheduleId),
          lt(schedule.enrolledCount, schedule.capacity)
        )
      )
      .returning({
        id: schedule.id,
        enrolledCount: schedule.enrolledCount,
      });

    if (updated.length === 0) {
      return { error: 'Class is full' };
    }

    try {
      await db.insert(bookings).values({
        scheduleId,
        userId: viewer.id,
        status: 'active',
      });
    } catch (error) {
      await db
        .update(schedule)
        .set({
          enrolledCount: sql`GREATEST(${schedule.enrolledCount} - 1, 0)`,
        })
        .where(eq(schedule.id, scheduleId));
      throw error;
    }

    if (options.revalidatePaths ?? true) {
      revalidatePath('/classes/[slug]');
      revalidatePath('/schedule');
    }

    return { success: true, enrolledCount: updated[0].enrolledCount };
  } catch (error) {
    console.error('bookSessionAction failed', error);
    return { error: 'Unable to book session' };
  }
};

export const cancelBookingAction = async (
  scheduleId: number,
  options: ActionOptions = {}
): Promise<ActionResult> => {
  const viewer = await getViewer();
  if (!viewer) {
    return { error: 'unauthenticated' };
  }

  try {
    const existingBooking = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.scheduleId, scheduleId),
          eq(bookings.userId, viewer.id),
          eq(bookings.status, 'active')
        )
      )
      .limit(1);

    const booking = existingBooking[0];
    if (!booking) {
      return { error: 'Booking not found' };
    }

    await db.delete(bookings).where(eq(bookings.id, booking.id));

    const updated = await db
      .update(schedule)
      .set({
        enrolledCount: sql`GREATEST(${schedule.enrolledCount} - 1, 0)`,
      })
      .where(eq(schedule.id, scheduleId))
      .returning({ enrolledCount: schedule.enrolledCount });

    if (options.revalidatePaths ?? true) {
      revalidatePath('/classes/[slug]');
      revalidatePath('/schedule');
    }

    return { success: true, enrolledCount: updated[0]?.enrolledCount ?? 0 };
  } catch (error) {
    console.error('cancelBookingAction failed', error);
    return { error: 'Unable to cancel booking' };
  }
};
