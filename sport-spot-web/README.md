# SportSpot Web

> Next.js web application, backend REST API, authentication layer, and Neon PostgreSQL access layer for SportSpot.

The `sport-spot-web` project is the central application layer of SportSpot. It serves the browser-based user experience and exposes REST API endpoints consumed by the Expo mobile app.

## Key Features

- Responsive schedule browsing for members
- Calendar-based navigation for upcoming classes
- User reservation and enrollment flows
- Admin dashboard for managing classes, trainers, rooms, and workouts
- Dashboard tables with server-side pagination
- JWT-based authentication
- Neon PostgreSQL integration through Drizzle ORM
- API routes for mobile app consumption

## Architecture

```text
Next.js App Router
        |
        | UI pages, server actions, route handlers
        v
REST API + Auth Middleware
        |
        | Drizzle ORM
        v
Neon PostgreSQL
```

The web app is responsible for:

- Rendering the main SportSpot browser experience
- Serving protected dashboard views
- Handling authentication and authorization
- Exposing backend API routes under `src/app/api/`
- Reading and writing database records through Drizzle ORM

## Critical Performance Optimization

### Navigation Prefetching Disabled

SportSpot explicitly attaches `prefetch={false}` to navigation sidebar links and pagination layouts.

This is intentional and production-critical.

Next.js App Router automatically prefetches route data for visible links. In data-heavy dashboard and schedule views, this can cause the viewport observer to trigger aggressive background requests as users scroll vertically.

Without this fix, pages with many navigation or pagination links can produce waterfalls of requests like:

```text
?_rsc=...
?_rsc=...
?_rsc=...
```

Those background React Server Component requests can repeatedly hit server-rendered routes, which may cascade into unnecessary Neon PostgreSQL reads.

To prevent this, navigation links that appear in sidebars, schedule pagination, and dashboard pagination should use:

```tsx
<Link href="/dashboard/classes" prefetch={false}>
  Classes
</Link>
```

This keeps database traffic tied to explicit user navigation instead of passive viewport observation.

## Folder Structure Guide

```text
sport-spot-web/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── classes/
│   │   │       └── route.ts
│   │   ├── schedule/
│   │   │   └── page.tsx
│   │   └── dashboard/
│   │       └── ...
│   ├── db/
│   │   ├── schema.ts
│   │   └── seed.ts
│   └── ...
├── drizzle.config.ts
├── package.json
└── README.md
```

### Important Directories

| Path | Purpose |
| --- | --- |
| `src/app/api/classes/` | REST API routes for class/session data consumed by web and mobile |
| `src/app/schedule/` | Member-facing schedule and class discovery experience |
| `src/app/dashboard/` | Admin and user dashboard views with paginated data tables |
| `src/db/` | Drizzle schema, database client utilities, and seed scripts |

## Local Development

### Install dependencies

From the repository root:

```bash
npm install
```

Or from this project directory:

```bash
npm install
```

### Start the Next.js development server

From the web project:

```bash
npm run dev
```

Or from the repository root:

```bash
npm run -w sport-spot-web dev
```

The app will usually run at:

```text
http://localhost:3000
```

## Environment Variables

Create a local environment file:

```bash
cp .env.example .env.local
```

Required variables:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="replace-with-a-secure-secret"
```

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign and verify JWT auth tokens |

## Database Commands

Generate Drizzle migrations:

```bash
npm run db:generate
```

Run migrations:

```bash
npm run db:migrate
```

Seed the database:

```bash
npm run db:seed
```

The seed process should support large datasets for performance testing, including at least 10,000 historical and upcoming sessions/bookings.

## Production Build

```bash
npm run build
npm run start
```

## Deployment

SportSpot Web can be deployed to platforms that support Next.js applications.

Recommended deployment targets:

- Vercel
- Netlify

Deployment indicators:

- Ensure `DATABASE_URL` is configured in the hosting provider environment settings.
- Ensure `JWT_SECRET` is configured as a secure production secret.
- Confirm serverless function support for API routes.
- Confirm the deployed API base URL is used by the mobile app.
- Run migrations against the production Neon database before serving live traffic.

## API Auth

Mobile clients should authenticate requests with a JWT bearer token:

```http
Authorization: Bearer <token>
```

Protected API routes should validate the token before returning user-specific or admin-only data.
