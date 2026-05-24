# SportSpot 2.0 - Multi-Platform Monorepo Specification

SportSpot is a multi-platform full-stack application (Web + Mobile) that allows users to find, schedule, and book sports classes. The platform serves two primary roles: Users (Clients) who book classes, and Admins (Trainers/Managers) who manage club-wide schedules, rooms, and workouts.

## Monorepo Architecture
The project is structured as a Node.js workspace monorepo:
- **Root Level**: Manages workspace coordination, shared dependency configurations, and global project documentation.
- **`sport-spot-web/`**: Holds the Next.js Web Application, the global Backend API routes, and the Drizzle ORM database management layer.
- **`sport-spot-mobile/`**: Holds the React Native Expo client application targeting iOS and Android.

                          ┌─────────────────────────────────────────┐
                          │            Neon PostgreSQL              │
                          │             (Drizzle ORM)               │
                          └────────────────────▲────────────────────┘
                                               │
                                        (Server Actions)
                                               │
        ┌────────────────────────┐    ┌────────┴────────┐    ┌──────────────────────────┐
        │  sport-spot-mobile     │───>│ sport-spot-web  │<───│ Cloudflare R2            │
        │  (React Native / Expo) │    │ (Next.js / API) │    │ (Object File Storage)    │
        └────────────────────────┘    └─────────────────┘    └──────────────────────────┘
      (RESTful API)


## Core Shared Business Logic & Rules
1. **Roles and Access Control (RBAC)**:
   - **Admin (Trainers/Managers)**: Full CRUD access to workouts, schedule sessions, and room management. Access to global club analytics.
   - **User (Clients)**: Read-only access to available sessions. Full management (create/cancel) over their personal bookings.
2. **Database Scalability Requirement**:
   - The primary database tables must handle thousands of entities. A database seed script must generate at least **10,000 records** of historical and upcoming sessions/bookings to stress-test query optimization and server-side pagination.
3. **Authentication Strategy**:
   - Stateless JWT architecture. Passwords must be hashed using secure one-way algorithms (`bcrypt`). 
   - Web uses Next.js Server Actions/Middleware with JWT. Mobile sends the JWT token inside the `Authorization: Bearer <token>` header to the Next.js REST API.