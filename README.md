# SportSpot 2.0

> A unified sports class and gym reservation platform for discovering workouts, registering for active slots, and tracking real-time venue capacity across web and mobile surfaces.

SportSpot is a multi-platform full-stack application built as a Node.js workspace monorepo. It powers both a responsive web application and a native mobile app, with the Next.js project serving as the central web UI, backend REST API, authentication layer, and database access layer.

## Architecture Ecosystem

SportSpot is split into two primary applications:

| Project | Purpose |
| --- | --- |
| `sport-spot-web/` | Next.js App Router application, backend REST API, JWT auth, Drizzle ORM, Neon PostgreSQL integration |
| `sport-spot-mobile/` | Expo Router React Native application for Android and iOS |

The Next.js app acts as the central application layer:

- Web users interact directly with the Next.js UI.
- Mobile users interact with the Expo app.
- The Expo app communicates with the Next.js backend through REST API routes.
- The Next.js backend reads and writes data through Drizzle ORM.
- Neon PostgreSQL stores users, classes, sessions, rooms, reservations, and historical records.

```text
sport-spot-mobile
React Native / Expo
        |
        | REST API + JWT Bearer token
        v
sport-spot-web
Next.js App Router + API routes
        |
        | Drizzle ORM
        v
Neon PostgreSQL
```

## Database Schema

SportSpot uses Neon PostgreSQL with Drizzle ORM for schema definition, migrations, and typed database access.

### Core Entities

| Table | Column | Type / Purpose |
| --- | --- | --- |
| `users` | `id` | Primary key |
| `users` | `email` | Unique user email used for authentication |
| `users` | `password_hash` | Secure bcrypt password hash |
| `users` | `full_name` | Display name for member or admin |
| `users` | `role` | Access role, such as `user` or `admin` |
| `classes` / `sessions` | `id` | Primary key |
| `classes` / `sessions` | `workout_id` | Related workout definition |
| `classes` / `sessions` | `room_id` | Room or studio where the class takes place |
| `classes` / `sessions` | `trainer_id` | Admin or trainer responsible for the class |
| `classes` / `sessions` | `slug` | Public route-safe identifier |
| `classes` / `sessions` | `capacity` | Maximum number of available reservation slots |
| `classes` / `sessions` | `date_time` | Scheduled class start date and time |
| `enrollments` / `reservations` | `id` | Primary key |
| `enrollments` / `reservations` | `user_id` | User who reserved a slot |
| `enrollments` / `reservations` | `class_id` | Class/session being reserved |
| `enrollments` / `reservations` | `status` | Reservation state, such as active or cancelled |
| `enrollments` / `reservations` | `created_at` | Timestamp when the reservation was created |

### Relationships

| Relationship | Description |
| --- | --- |
| Users to Classes | Users enroll into classes through `enrollments` / `reservations` |
| Classes to Users | Classes have many enrolled users through the junction table |
| Classes to Trainers | Each class references a trainer/admin user |
| Classes to Rooms | Each class is scheduled inside a room with capacity constraints |
| Reservations to Users | Each reservation belongs to one user |
| Reservations to Classes | Each reservation belongs to one class/session |

## Repository Structure

```text
.
├── sport-spot-web/       # Next.js web app, REST API, Drizzle ORM, Neon DB access
├── sport-spot-mobile/    # Expo Router mobile app for Android and iOS
├── package.json          # Workspace scripts and shared dependency coordination
├── package-lock.json
├── netlify.toml
└── AGENTS.md
```

## Global Local Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd sport-spot-nextjs
```

### 2. Install workspace dependencies

```bash
npm install
```

This installs dependencies for both workspace apps:

- `sport-spot-web`
- `sport-spot-mobile`

### 3. Configure environment variables

Create the required environment files for each app.

For the web/backend project:

```bash
cd sport-spot-web
cp .env.example .env.local
```

Required web environment variables:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="replace-with-a-secure-secret"
```

For the mobile project, configure the API base URL according to your environment. Local physical-device testing usually requires your machine LAN IP instead of `localhost`.

Example:

```env
EXPO_PUBLIC_API_URL="http://192.168.1.10:3000"
```

### 4. Run both apps from the root

```bash
npm run dev
```

This starts:

- Next.js web/backend app
- Expo development server

### 5. Build all workspaces

```bash
npm run build
```

## Workspace Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the web and mobile development servers together |
| `npm run build` | Builds all workspace projects that define a build script |
| `npm run -w sport-spot-web dev` | Starts only the Next.js web/backend app |
| `npm run -w sport-spot-mobile start` | Starts only the Expo mobile app |

## Authentication

SportSpot uses stateless JWT authentication.

- Passwords are hashed with `bcrypt`.
- Web requests use Next.js server-side auth handling.
- Mobile requests send the JWT through the `Authorization` header.

```http
Authorization: Bearer <token>
```

## Database Scale Requirement

The database is designed to support thousands of entities and high-volume schedule browsing.

Seed data should include at least 10,000 historical and upcoming sessions/bookings to validate:

- Query performance
- Server-side pagination
- Dashboard table scalability
- Schedule filtering
- Mobile API responsiveness
