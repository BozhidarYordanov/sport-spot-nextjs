import "dotenv/config";
import bcrypt from "bcrypt";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import { bookings, profiles, schedule, userRoles, workoutTypes } from "./schema";

type UserSeed = {
  email: string;
  role: "admin" | "user";
  fullName: string;
};

type WorkoutSeed = {
  file: string;
  title: string;
  category: string;
  difficulty: number;
  duration: number;
};

const USERS_TO_CREATE: UserSeed[] = [
  { email: "steve@gmail.com", role: "admin", fullName: "Steve Rogers" },
  { email: "peter@gmail.com", role: "user", fullName: "Peter Parker" },
  { email: "dave@gmail.com", role: "user", fullName: "Dave Lizewski" },
  { email: "john@gmail.com", role: "user", fullName: "John Doe" },
  { email: "nick@gmail.com", role: "user", fullName: "Nick Fury" },
  { email: "max@gmail.com", role: "user", fullName: "Max Rockatansky" },
  { email: "maria@gmail.com", role: "user", fullName: "Maria Hill" },
  { email: "mark@gmail.com", role: "user", fullName: "Mark Grayson" },
];

const WORKOUT_TYPES_TO_CREATE: WorkoutSeed[] = [
  { file: "box.jpg", title: "Box", category: "Combat", difficulty: 3, duration: 60 },
  {
    file: "pilates.jpg",
    title: "Pilates",
    category: "Mind & Body",
    difficulty: 2,
    duration: 50,
  },
  {
    file: "kango-jumps.jpg",
    title: "Kango Jumps",
    category: "Cardio",
    difficulty: 3,
    duration: 45,
  },
  { file: "yoga.jpg", title: "Yoga", category: "Mind & Body", difficulty: 1, duration: 55 },
  {
    file: "spinning.jpg",
    title: "Spinning",
    category: "Cardio",
    difficulty: 2,
    duration: 45,
  },
  {
    file: "cross-bootcamp.jpg",
    title: "Cross Bootcamp",
    category: "Strength",
    difficulty: 3,
    duration: 45,
  },
  {
    file: "cross-training.jpg",
    title: "Cross Training",
    category: "Strength",
    difficulty: 3,
    duration: 55,
  },
  {
    file: "dance-fit.jpg",
    title: "Dance Fit",
    category: "Cardio",
    difficulty: 2,
    duration: 50,
  },
  {
    file: "fit-ball.jpg",
    title: "Fit Ball",
    category: "Strength",
    difficulty: 1,
    duration: 45,
  },
  {
    file: "fit-bands.jpg",
    title: "Fit Bands",
    category: "Strength",
    difficulty: 2,
    duration: 45,
  },
  {
    file: "fly-yoga.jpg",
    title: "Fly Yoga",
    category: "Mind & Body",
    difficulty: 2,
    duration: 50,
  },
  {
    file: "functional-training.jpg",
    title: "Functional Training",
    category: "Strength",
    difficulty: 2,
    duration: 55,
  },
  {
    file: "kick-box.jpg",
    title: "Kick Box",
    category: "Combat",
    difficulty: 3,
    duration: 50,
  },
  {
    file: "mobility.jpg",
    title: "Mobility",
    category: "Mind & Body",
    difficulty: 1,
    duration: 50,
  },
  { file: "p-box.jpg", title: "P.Boxx", category: "Combat", difficulty: 3, duration: 55 },
  {
    file: "pilates-reformer.jpg",
    title: "Pilates Reformer",
    category: "Mind & Body",
    difficulty: 2,
    duration: 50,
  },
  {
    file: "stretching.jpg",
    title: "Stretching",
    category: "Mind & Body",
    difficulty: 1,
    duration: 40,
  },
  { file: "tabata.jpg", title: "Tabata", category: "Cardio", difficulty: 3, duration: 40 },
  {
    file: "total-body.jpg",
    title: "Total Body",
    category: "Strength",
    difficulty: 2,
    duration: 55,
  },
  { file: "yoga-fit.jpg", title: "Yoga Fit", category: "Mind & Body", difficulty: 1, duration: 60 },
  { file: "zumba.jpg", title: "Zumba", category: "Cardio", difficulty: 2, duration: 50 },
];

const PAST_BOOKING_PLAN: Record<string, number> = {
  Box: 15,
  Pilates: 10,
  "Kango Jumps": 7,
  Yoga: 3,
  Spinning: 1,
};

const ROOMS = ["Studio A", "Studio B", "Zone 1", "Zone 2", "Mind Studio", "Arena"];
const HOURS = [7, 8, 9, 10, 17, 18, 19, 20];
const TRAINERS = ["Ivan", "Maria", "Chris", "Elena", "Daniel", "Nina"];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const shuffle = <T>(items: T[]) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const pickUnique = <T>(items: T[], count: number) => shuffle(items).slice(0, count);

const randomChoice = <T>(items: T[]) => items[randomInt(0, items.length - 1)];

const chunk = <T>(items: T[], size: number) => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const getBulgarianPhoneNumber = (index: number) =>
  `0888${String(100000 + index).padStart(6, "0")}`;

const getWorkoutAudienceDetails = (workout: WorkoutSeed) => {
  if (workout.category === "Combat") {
    return {
      suitableFor: "Adults; Fitness enthusiasts; Intermediate to Advanced",
      whatToBring: "Boxing gloves; Hand wraps; Water bottle; Athletic shoes",
    };
  }

  if (workout.category === "Mind & Body") {
    return {
      suitableFor: "All levels; Beginners; Anyone seeking flexibility",
      whatToBring: "Yoga mat; Comfortable clothing; Towel",
    };
  }

  if (workout.category === "Strength" || workout.category === "Cardio") {
    return {
      suitableFor: "Active individuals; Cardio fans; Weight lifters",
      whatToBring: "Sports shoes; Towel; Energy drink; Clean shirt",
    };
  }

  return {
    suitableFor: "Fitness lovers; Gym members",
    whatToBring: "Water; Towel; Clean shoes",
  };
};

const seed = async () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = neon(databaseUrl);
  const db = drizzle(client, { schema });

  try {
    console.log("Clearing existing database rows...");
    await db.delete(bookings);
    await db.delete(schedule);
    await db.delete(userRoles);
    await db.delete(profiles);
    await db.delete(workoutTypes);
    console.log("Database successfully cleared. Inserting new seed data...");

    console.log("Seeding users...");
    const hashedPassword = await bcrypt.hash("pass123!", 10);
    const profileRows = USERS_TO_CREATE.map((user, index) => ({
      email: user.email,
      passwordHash: hashedPassword,
      fullName: user.fullName,
      phone: getBulgarianPhoneNumber(index),
      avatarUrl: `https://i.pravatar.cc/150?img=${index + 1}`,
      createdAt: new Date(),
    }));

    const insertedProfiles = await db
      .insert(profiles)
      .values(profileRows)
      .returning({ id: profiles.id, email: profiles.email });

    const profileIdByEmail = new Map(
      insertedProfiles.map((profile) => [profile.email, profile.id])
    );

    const roleRows = USERS_TO_CREATE.map((user) => {
      const userId = profileIdByEmail.get(user.email);
      if (!userId) {
        throw new Error(`Missing profile id for ${user.email}`);
      }
      return {
        userId,
        role: user.role,
      };
    });

    await db.insert(userRoles).values(roleRows);
    console.log("Users seeded...");

    console.log("Seeding workout types...");
    const workoutRows = WORKOUT_TYPES_TO_CREATE.map((workout) => {
      const audienceDetails = getWorkoutAudienceDetails(workout);

      return {
        title: workout.title,
        description: `${workout.title} class`,
        descriptionLong: `A ${workout.duration}-minute ${workout.category.toLowerCase()} session designed for all levels.`,
        durationMinutes: workout.duration,
        difficultyLevel: workout.difficulty,
        slug: slugify(workout.title),
        suitableFor: audienceDetails.suitableFor,
        whatToBring: audienceDetails.whatToBring,
        category: workout.category,
        imageUrl: workout.file,
      };
    });

    const insertedWorkouts = await db
      .insert(workoutTypes)
      .values(workoutRows)
      .returning({ id: workoutTypes.id, title: workoutTypes.title });

    const workoutTitleById = new Map(
      insertedWorkouts.map((workout) => [workout.id, workout.title])
    );
    const workoutIds = insertedWorkouts.map((workout) => workout.id);

    console.log("Workout types seeded...");

    console.log("Seeding schedule...");
    const scheduleRows: Array<typeof schedule.$inferInsert> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let offset = -20; offset <= 20; offset += 1) {
      const day = new Date(today);
      day.setDate(today.getDate() + offset);

      for (const room of ROOMS) {
        const hourCount = randomInt(3, 5);
        const hours = pickUnique(HOURS, hourCount);

        for (const hour of hours) {
          const startTime = new Date(day);
          startTime.setHours(hour, 0, 0, 0);

          scheduleRows.push({
            workoutTypeId: randomChoice(workoutIds),
            startTime,
            trainerName: randomChoice(TRAINERS),
            capacity: 10,
            room,
            enrolledCount: 0,
          });
        }
      }
    }

    const insertedSchedule = await db
      .insert(schedule)
      .values(scheduleRows)
      .returning({
        id: schedule.id,
        startTime: schedule.startTime,
        workoutTypeId: schedule.workoutTypeId,
      });

    console.log("Schedule seeded...");

    console.log("Seeding bookings...");
    const userIds = USERS_TO_CREATE
      .map((user) => profileIdByEmail.get(user.email))
      .filter((id): id is number => typeof id === "number");

    const now = new Date();
    const bookingRows: Array<typeof bookings.$inferInsert> = [];
    const enrollmentsByScheduleId = new Map<number, number>();

    for (const slot of insertedSchedule) {
      const workoutTitle = workoutTitleById.get(slot.workoutTypeId) ?? "";
      const isPast = slot.startTime < now;
      const plannedCount = isPast ? PAST_BOOKING_PLAN[workoutTitle] : undefined;
      const targetCount = plannedCount ?? randomInt(0, 5);
      const maxUnique = Math.min(targetCount, userIds.length);

      if (plannedCount && plannedCount > userIds.length) {
        console.warn(
          `Only ${userIds.length} user accounts are available for "${workoutTitle}" on ${slot.startTime.toISOString()}, capping bookings.`
        );
      }

      const selectedUsers = pickUnique(userIds, maxUnique);
      if (selectedUsers.length === 0) {
        continue;
      }

      const createdAtBase = new Date(slot.startTime);
      createdAtBase.setHours(createdAtBase.getHours() - 2);

      for (const userId of selectedUsers) {
        bookingRows.push({
          scheduleId: slot.id,
          userId,
          status: "active",
          createdAt: createdAtBase,
        });
      }

      enrollmentsByScheduleId.set(slot.id, selectedUsers.length);
    }

    const bookingChunks = chunk(bookingRows, 1000);
    for (const bookingChunk of bookingChunks) {
      await db.insert(bookings).values(bookingChunk);
    }

    for (const [scheduleId, enrolledCount] of enrollmentsByScheduleId) {
      await db
        .update(schedule)
        .set({ enrolledCount })
        .where(eq(schedule.id, scheduleId));
    }

    console.log("Bookings seeded...");
    console.log("Seed complete.");
  } finally {
    const maybeEnd = (client as unknown as { end?: () => Promise<void> }).end;
    if (typeof maybeEnd === "function") {
      await maybeEnd.call(client);
    }
  }
};

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
