'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, gte, sql } from 'drizzle-orm';

import { db } from '@/db';
import { bookings, profiles, schedule, workoutTypes } from '@/db/schema';
import { getSession, isAdmin } from '@/lib/auth';

type ActionResult = { success: true } | { error: string };

type WorkoutTypeFormValues = {
  title: string;
  slug: string;
  category: string;
  difficultyLevel: number;
  durationMinutes: number;
  description: string;
  descriptionLong: string;
  suitableFor: string;
  whatToBring: string;
};

type ScheduleSessionFormValues = {
  workoutTypeId: number;
  startTime: Date;
  trainerName: string;
  room: string;
  capacity: number;
};

const getFormString = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
};

const parseWorkoutTypeForm = (
  formData: FormData
): WorkoutTypeFormValues | { error: string } => {
  const title = getFormString(formData, 'title');
  const slug = getFormString(formData, 'slug')
    .toLowerCase()
    .replace(/\s+/g, '-');
  const category = getFormString(formData, 'category');
  const difficultyLevel = Number(getFormString(formData, 'difficultyLevel'));
  const durationMinutes = Number(getFormString(formData, 'durationMinutes'));
  const description = getFormString(formData, 'description');
  const descriptionLong = getFormString(formData, 'descriptionLong');
  const suitableFor = getFormString(formData, 'suitableFor');
  const whatToBring = getFormString(formData, 'whatToBring');

  if (
    !title ||
    !slug ||
    !category ||
    !description ||
    !descriptionLong ||
    !suitableFor ||
    !whatToBring
  ) {
    return { error: 'Please complete all workout fields' };
  }

  if (![1, 2, 3].includes(difficultyLevel)) {
    return { error: 'Difficulty must be between 1 and 3' };
  }

  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    return { error: 'Duration must be a positive number' };
  }

  return {
    title,
    slug,
    category,
    difficultyLevel,
    durationMinutes,
    description,
    descriptionLong,
    suitableFor,
    whatToBring,
  };
};

const getWorkoutImageUrl = (slug: string) => `${slug}.jpg`;

const parseScheduleSessionForm = (
  formData: FormData
): ScheduleSessionFormValues | { error: string } => {
  const workoutTypeId = Number(getFormString(formData, 'workoutTypeId'));
  const startTimeValue = getFormString(formData, 'startTime');
  const trainerName = getFormString(formData, 'trainerName');
  const room = getFormString(formData, 'room');
  const capacity = Number(getFormString(formData, 'capacity'));
  const startTime = new Date(startTimeValue);

  if (!Number.isInteger(workoutTypeId) || workoutTypeId <= 0) {
    return { error: 'Please choose a workout type' };
  }

  if (!startTimeValue || Number.isNaN(startTime.getTime())) {
    return { error: 'Please choose a valid date and time' };
  }

  if (!trainerName || !room) {
    return { error: 'Please complete trainer and room fields' };
  }

  if (!Number.isInteger(capacity) || capacity <= 0) {
    return { error: 'Capacity must be a positive number' };
  }

  return {
    workoutTypeId,
    startTime,
    trainerName,
    room,
    capacity,
  };
};

export const adminCancelBookingAction = async (
  bookingId: number
): Promise<ActionResult> => {
  const hasAdminAccess = await isAdmin();

  if (!hasAdminAccess) {
    return { error: 'unauthorized' };
  }

  try {
    const deletedBookings = await db
      .delete(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.status, 'active')))
      .returning({ scheduleId: bookings.scheduleId });

    const deletedBooking = deletedBookings[0];

    if (!deletedBooking) {
      return { error: 'Booking not found' };
    }

    await db
      .update(schedule)
      .set({
        enrolledCount: sql`GREATEST(${schedule.enrolledCount} - 1, 0)`,
      })
      .where(eq(schedule.id, deletedBooking.scheduleId));

    revalidatePath('/admin');
    revalidatePath('/schedule');
    revalidatePath('/classes/[slug]');

    return { success: true };
  } catch (error) {
    console.error('adminCancelBookingAction failed', error);
    return { error: 'Unable to cancel booking' };
  }
};

export const deleteUserAction = async (
  userId: string
): Promise<ActionResult> => {
  const session = await getSession();

  if (session?.role !== 'admin') {
    return { error: 'unauthorized' };
  }

  const parsedUserId = Number(userId);

  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    return { error: 'Invalid user' };
  }

  try {
    const activeUserBookings = await db
      .select({ scheduleId: bookings.scheduleId })
      .from(bookings)
      .where(
        and(
          eq(bookings.userId, parsedUserId),
          eq(bookings.status, 'active')
        )
      );

    const deletedUsers = await db
      .delete(profiles)
      .where(eq(profiles.id, parsedUserId))
      .returning({ id: profiles.id });

    if (deletedUsers.length === 0) {
      return { error: 'User not found' };
    }

    await Promise.all(
      activeUserBookings.map((booking) =>
        db
          .update(schedule)
          .set({
            enrolledCount: sql`GREATEST(${schedule.enrolledCount} - 1, 0)`,
          })
          .where(eq(schedule.id, booking.scheduleId))
      )
    );

    revalidatePath('/admin');
    revalidatePath('/schedule');
    revalidatePath('/classes/[slug]');

    return { success: true };
  } catch (error) {
    console.error('deleteUserAction failed', error);
    return { error: 'Unable to delete user' };
  }
};

export const deleteWorkoutTypeAction = async (
  workoutTypeId: number
): Promise<ActionResult> => {
  const hasAdminAccess = await isAdmin();

  if (!hasAdminAccess) {
    return { error: 'unauthorized' };
  }

  if (!Number.isInteger(workoutTypeId) || workoutTypeId <= 0) {
    return { error: 'Invalid workout type' };
  }

  try {
    const activeSchedules = await db
      .select({ id: schedule.id })
      .from(schedule)
      .where(
        and(
          eq(schedule.workoutTypeId, workoutTypeId),
          gte(schedule.startTime, new Date())
        )
      )
      .limit(1);

    if (activeSchedules.length > 0) {
      return { error: 'Workout has active schedule entries' };
    }

    const deletedWorkoutTypes = await db
      .delete(workoutTypes)
      .where(eq(workoutTypes.id, workoutTypeId))
      .returning({ id: workoutTypes.id });

    if (deletedWorkoutTypes.length === 0) {
      return { error: 'Workout type not found' };
    }

    revalidatePath('/admin');
    revalidatePath('/classes');
    revalidatePath('/schedule');

    return { success: true };
  } catch (error) {
    console.error('deleteWorkoutTypeAction failed', error);
    return { error: 'Unable to delete workout type' };
  }
};

export const createWorkoutTypeAction = async (
  formData: FormData
): Promise<ActionResult> => {
  const hasAdminAccess = await isAdmin();

  if (!hasAdminAccess) {
    return { error: 'unauthorized' };
  }

  const parsedForm = parseWorkoutTypeForm(formData);

  if ('error' in parsedForm) {
    return parsedForm;
  }

  try {
    await db.insert(workoutTypes).values({
      ...parsedForm,
      imageUrl: getWorkoutImageUrl(parsedForm.slug),
    });

    revalidatePath('/admin');
    revalidatePath('/classes');

    return { success: true };
  } catch (error) {
    console.error('createWorkoutTypeAction failed', error);
    return { error: 'Unable to create workout type' };
  }
};

export const updateWorkoutTypeAction = async (
  workoutTypeId: number,
  formData: FormData
): Promise<ActionResult> => {
  const hasAdminAccess = await isAdmin();

  if (!hasAdminAccess) {
    return { error: 'unauthorized' };
  }

  if (!Number.isInteger(workoutTypeId) || workoutTypeId <= 0) {
    return { error: 'Invalid workout type' };
  }

  const parsedForm = parseWorkoutTypeForm(formData);

  if ('error' in parsedForm) {
    return parsedForm;
  }

  try {
    const updatedWorkoutTypes = await db
      .update(workoutTypes)
      .set({
        ...parsedForm,
        imageUrl: getWorkoutImageUrl(parsedForm.slug),
      })
      .where(eq(workoutTypes.id, workoutTypeId))
      .returning({ id: workoutTypes.id });

    if (updatedWorkoutTypes.length === 0) {
      return { error: 'Workout type not found' };
    }

    revalidatePath('/admin');
    revalidatePath('/classes');
    revalidatePath('/classes/[slug]');
    revalidatePath('/schedule');

    return { success: true };
  } catch (error) {
    console.error('updateWorkoutTypeAction failed', error);
    return { error: 'Unable to update workout type' };
  }
};

export const deleteScheduleSessionAction = async (
  scheduleId: number
): Promise<ActionResult> => {
  const hasAdminAccess = await isAdmin();

  if (!hasAdminAccess) {
    return { error: 'unauthorized' };
  }

  if (!Number.isInteger(scheduleId) || scheduleId <= 0) {
    return { error: 'Invalid session' };
  }

  try {
    const deletedSessions = await db
      .delete(schedule)
      .where(and(eq(schedule.id, scheduleId), gte(schedule.startTime, new Date())))
      .returning({ id: schedule.id });

    if (deletedSessions.length === 0) {
      return { error: 'Session not found or already started' };
    }

    revalidatePath('/admin');
    revalidatePath('/schedule');
    revalidatePath('/classes/[slug]');

    return { success: true };
  } catch (error) {
    console.error('deleteScheduleSessionAction failed', error);
    return { error: 'Unable to delete session' };
  }
};

export const createScheduleSessionAction = async (
  formData: FormData
): Promise<ActionResult> => {
  const hasAdminAccess = await isAdmin();

  if (!hasAdminAccess) {
    return { error: 'unauthorized' };
  }

  const parsedForm = parseScheduleSessionForm(formData);

  if ('error' in parsedForm) {
    return parsedForm;
  }

  try {
    const workoutExists = await db
      .select({ id: workoutTypes.id })
      .from(workoutTypes)
      .where(eq(workoutTypes.id, parsedForm.workoutTypeId))
      .limit(1);

    if (workoutExists.length === 0) {
      return { error: 'Workout type not found' };
    }

    await db.insert(schedule).values({
      ...parsedForm,
      enrolledCount: 0,
    });

    revalidatePath('/admin');
    revalidatePath('/schedule');
    revalidatePath('/classes/[slug]');

    return { success: true };
  } catch (error) {
    console.error('createScheduleSessionAction failed', error);
    return { error: 'Unable to create session' };
  }
};

export const updateScheduleSessionAction = async (
  scheduleId: number,
  formData: FormData
): Promise<ActionResult> => {
  const hasAdminAccess = await isAdmin();

  if (!hasAdminAccess) {
    return { error: 'unauthorized' };
  }

  if (!Number.isInteger(scheduleId) || scheduleId <= 0) {
    return { error: 'Invalid session' };
  }

  const parsedForm = parseScheduleSessionForm(formData);

  if ('error' in parsedForm) {
    return parsedForm;
  }

  try {
    const currentSessionRows = await db
      .select({ enrolledCount: schedule.enrolledCount })
      .from(schedule)
      .where(eq(schedule.id, scheduleId))
      .limit(1);
    const currentSession = currentSessionRows[0];

    if (!currentSession) {
      return { error: 'Session not found' };
    }

    if (parsedForm.capacity < currentSession.enrolledCount) {
      return { error: 'Capacity cannot be lower than current enrollments' };
    }

    const workoutExists = await db
      .select({ id: workoutTypes.id })
      .from(workoutTypes)
      .where(eq(workoutTypes.id, parsedForm.workoutTypeId))
      .limit(1);

    if (workoutExists.length === 0) {
      return { error: 'Workout type not found' };
    }

    await db
      .update(schedule)
      .set(parsedForm)
      .where(eq(schedule.id, scheduleId));

    revalidatePath('/admin');
    revalidatePath('/schedule');
    revalidatePath('/classes/[slug]');

    return { success: true };
  } catch (error) {
    console.error('updateScheduleSessionAction failed', error);
    return { error: 'Unable to update session' };
  }
};
