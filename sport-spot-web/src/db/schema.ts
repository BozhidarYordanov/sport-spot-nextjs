import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);
export const bookingStatusEnum = pgEnum("booking_status", ["active", "cancelled"]);

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  avatarUrl: text("avatar_url").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  role: userRoleEnum("role").notNull(),
});

export const workoutTypes = pgTable(
  "workout_types",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    descriptionLong: text("description_long").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    difficultyLevel: integer("difficulty_level").notNull(),
    slug: text("slug").notNull(),
    suitableFor: text("suitable_for").notNull(),
    whatToBring: text("what_to_bring").notNull(),
    category: text("category").notNull(),
    imageUrl: text("image_url").notNull(),
  },
  (table) => ({
    difficultyLevelCheck: check(
      "workout_types_difficulty_level_check",
      sql`${table.difficultyLevel} in (1, 2, 3)`
    ),
  })
);

export const schedule = pgTable(
  "schedule",
  {
    id: serial("id").primaryKey(),
    workoutTypeId: integer("workout_type_id")
      .notNull()
      .references(() => workoutTypes.id, { onDelete: "cascade" }),
    startTime: timestamp("start_time", { mode: "date" }).notNull(),
    trainerName: text("trainer_name").notNull(),
    capacity: integer("capacity").notNull(),
    room: text("room").notNull(),
    enrolledCount: integer("enrolled_count").notNull().default(0),
  },
  (table) => ({
    startTimeIdx: index("schedule_start_time_idx").on(table.startTime),
  })
);

export const bookings = pgTable(
  "bookings",
  {
    id: serial("id").primaryKey(),
    scheduleId: integer("schedule_id")
      .notNull()
      .references(() => schedule.id, { onDelete: "cascade" }),
    userId: integer("user_id").references(() => profiles.id, {
      onDelete: "cascade",
    }),
    guestName: text("guest_name"),
    guestEmail: text("guest_email"),
    guestPhone: text("guest_phone"),
    status: bookingStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("bookings_user_id_idx").on(table.userId),
  })
);
