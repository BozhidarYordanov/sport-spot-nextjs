# SportSpot 2.0 - Web & Backend API Specification

Here we manage the Next.js Web application, the central RESTful API for the mobile app, and the Drizzle ORM layer connected to Neon serverless PostgreSQL.

## Backend & Database Deep Dive
- **Tech Stack**: Next.js (App Router), Drizzle ORM, Neon Serverless PostgreSQL, TypeScript.
- **Database Schema (5 Core Tables matching historical architecture)**:
  1. `profiles` (or `users`): id (UUID - Primary Key), email (unique), password_hash (bcrypt/argon2), full_name, phone, avatar_url, created_at.
  2. `user_roles`: id (BigInt/Serial), user_id (FK to profiles.id), role (PostgreSQL enum: 'admin', 'user').
  3. `workout_types`: id (UUID), title, description, description_long, duration_minutes, difficulty_level (1, 2, or 3), slug, suitable_for, what_to_bring, category (enum), image_url.
  4. `schedule`: id (UUID), workout_type_id (FK to workout_types.id), start_time (timestamp), trainer_name, capacity (int), room (text), enrolled_count (int).
  5. `bookings`: id (UUID), schedule_id (FK to schedule.id), user_id (FK to profiles.id, nullable for guests), guest_name (text), guest_email (text), guest_phone (text), status (enum: 'active', 'cancelled'), created_at.

- **Database Migrations & Constraints**:
  - Always generate and apply changes using Drizzle Migrations (`drizzle-kit`). All SQL migration scripts must be committed to the GitHub repository.
  - Implement strict relational integrity (On Delete Cascade/Set Null where appropriate).
- **Performance & Scalability**:
  - Implement server-side pagination (limit & offset) for the `schedule` log and `workout_types` grid.
  - Create database indexes on `schedule.start_time` and `bookings.user_id` to maintain query performance under heavy loads.

## Web UI/UX & Tailwind Guidelines
- **Visual Polish & Glassmorphism**: Use soft shadows (`shadow-xl`), rounded corners (`rounded-2xl`), and subtle borders. For component overlays, use Tailwind's `backdrop-blur-md bg-white/30 border border-white/20`.
- **Micro-interactions**: Every button and clickable card must use transitions (`transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`).
- **Typography**: Use a high-quality sans-serif font via `next/font` (e.g., 'Inter'). Headings must be `font-bold tracking-tight`.
- **Color Transitions**: Never use boring default grays for active or hover states. Use brand-aligned color shifts (e.g., `hover:bg-primary-dark`, opacity scales).
- **Feedback States**: Implement clear skeleton screens for loading and instant toast alerts for actions like booking or profile updates.

## Pages and Navigation
1. **Landing Page (`/`)**: Targeted at guests. Features a high-impact Hero Section with a modern mesh gradient background, dynamic CTA ("Login" changes to "Go to Dashboard" if authenticated), a "Why Us" feature list, Top Classes with difficulty cards, and a Customer Reviews slider.
2. **Register Page (`/register`)**: Account creation form with inline validation (email availability, password strength).
3. **Login Page (`/login`)**: Secure credential submission with server-side error handling and session initiation.
4. **User Dashboard (`/dashboard`)**: The protected customer hub. Displays a scannable grid of 'Upcoming Bookings' (date, time, room), a 'Workout History' log (last 3 sessions), and a graphical statistics card (total classes completed this month). Uses clean 'Empty States' with actionable placeholders for new users.
5. **Classes Catalog (`/classes`)**: Real-time searchable and filterable grid of workout types. Integrates client-side/server-side paginated results.
6. **Class Details (`/classes/[id]`)**: Deep-dive layout. Displays description, duration, requirements, and a list of upcoming schedule blocks for this specific workout.
7. **Schedule Page (`/schedule`)**: Main calendar interface. Users can sort by date, view real-time slot capacities, and execute a dynamic booking confirmation modal.
8. **User Profile (`/profile`)**: Form to update name, phone, and password. Features a drag-and-drop avatar uploader that communicates with Cloudflare R2 storage.
9. **Admin Panel (`/admin`)**: Restricted dashboard displaying club analytics charts (active check-ins today, top performing classes, monthly registration growth).
10. **Manage Schedule Modals/Subpages (`/admin/schedule`)**: A rigorous management board allowing admins to create, edit, or delete schedule slots with real-time room conflict detection.

## Authentication Guardrails
- Secure all API endpoints (`/api/*`), Server Actions, and Web Pages using Next.js Middleware. Route unauthorized users back to `/login`. Check user roles explicitly for `/admin` routes.