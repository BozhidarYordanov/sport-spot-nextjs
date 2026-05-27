import { NextResponse } from "next/server";

type EndpointDoc = {
  id: string;
  method: "GET" | "POST";
  path: string;
  auth: string;
  summary: string;
  request: string;
  response: string;
  error?: string;
  fields: { name: string; type: string; description: string }[];
  queryParams?: { name: string; type: string; description: string }[];
  notes?: string[];
};

const pretty = (value: unknown) => JSON.stringify(value, null, 2);

const endpoints: EndpointDoc[] = [
  {
    id: "auth-login",
    method: "POST",
    path: "/api/auth/login",
    auth: "Public",
    summary:
      "Authenticates a club member or admin profile and returns a signed JWT for mobile API access.",
    request: pretty({
      email: "member@example.com",
      password: "secret",
    }),
    response: pretty({
      success: true,
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    }),
    error: pretty({
      success: false,
      error: "Invalid email or password",
    }),
    fields: [
      {
        name: "email",
        type: "string",
        description: "Profile email stored in the profiles table.",
      },
      {
        name: "password",
        type: "string",
        description: "Plain request password compared against bcrypt passwordHash.",
      },
      {
        name: "token",
        type: "string",
        description:
          "Signed JWT containing userId and role. Store it securely, for example with Expo SecureStore, then send it as Authorization: Bearer <TOKEN> on protected requests.",
      },
      {
        name: "success",
        type: "boolean",
        description: "True when authentication succeeds; false on handled errors.",
      },
    ],
  },
  {
    id: "sessions-list",
    method: "GET",
    path: "/api/sessions?page=1&limit=10&search=yoga",
    auth: "Bearer token",
    summary:
      "Lists upcoming schedule rows joined with workout_types metadata for compact mobile browsing.",
    request: "No request body.",
    response: pretty([
      {
        id: 42,
        startTime: "2026-05-28T09:00:00.000Z",
        trainerName: "Maya Carter",
        room: "Studio A",
        capacity: 18,
        enrolledCount: 11,
        workout: {
          id: 3,
          title: "Morning Yoga Flow",
          category: "Mind & Body",
          description: "A calm mobility and breathing session.",
          durationMinutes: 50,
          difficultyLevel: 1,
          slug: "morning-yoga-flow",
          imageUrl: "https://example.com/yoga.jpg",
        },
      },
    ]),
    fields: [
      {
        name: "id",
        type: "number",
        description: "Primary key from the schedule table.",
      },
      {
        name: "startTime",
        type: "ISO date string",
        description: "Upcoming session start timestamp.",
      },
      {
        name: "trainerName",
        type: "string",
        description: "Trainer assigned to this scheduled class.",
      },
      {
        name: "room",
        type: "string",
        description: "Fitness club room or studio label.",
      },
      {
        name: "capacity",
        type: "number",
        description: "Maximum number of active members allowed in the session.",
      },
      {
        name: "enrolledCount",
        type: "number",
        description: "Current count maintained on the schedule row.",
      },
      {
        name: "workout",
        type: "object",
        description:
          "Nested relational workout_types block appended to each schedule item with title, category, duration, difficulty, slug, and media metadata.",
      },
    ],
    queryParams: [
      {
        name: "page",
        type: "number",
        description: "One-based page number. Defaults to 1.",
      },
      {
        name: "limit",
        type: "number",
        description: "Items per page. Defaults to 10 and is capped at 50.",
      },
      {
        name: "search",
        type: "string",
        description:
          "Optional case-insensitive search across workout title, category, trainer name, and room.",
      },
    ],
  },
  {
    id: "sessions-detail",
    method: "GET",
    path: "/api/sessions/[id]",
    auth: "Bearer token",
    summary:
      "Returns deep metadata for one session plus enrollment state personalized to the bearer token.",
    request: "No request body.",
    response: pretty({
      id: 42,
      startTime: "2026-05-28T09:00:00.000Z",
      trainerName: "Maya Carter",
      room: "Studio A",
      capacity: 18,
      totalCapacity: 18,
      enrolledCount: 11,
      isEnrolled: true,
      joinedMembers: ["Avery Stone", "Jordan Lee"],
      workout: {
        id: 3,
        title: "Morning Yoga Flow",
        category: "Mind & Body",
        description: "A calm mobility and breathing session.",
        durationMinutes: 50,
        difficultyLevel: 1,
        slug: "morning-yoga-flow",
        imageUrl: "https://example.com/yoga.jpg",
      },
    }),
    error: pretty({
      success: false,
      error: "Session not found",
    }),
    fields: [
      {
        name: "id",
        type: "number",
        description: "Primary key from the schedule table.",
      },
      {
        name: "startTime",
        type: "ISO date string",
        description: "Exact scheduled start time.",
      },
      {
        name: "trainerName",
        type: "string",
        description: "Trainer leading this class.",
      },
      {
        name: "room",
        type: "string",
        description: "Room where the class takes place.",
      },
      {
        name: "totalCapacity",
        type: "number",
        description: "Alias of schedule.capacity for mobile detail screens.",
      },
      {
        name: "enrolledCount",
        type: "number",
        description: "Current active enrollment count.",
      },
      {
        name: "isEnrolled",
        type: "boolean",
        description:
          "Dynamic value computed from the requesting bearer token userId and active bookings for this session.",
      },
      {
        name: "joinedMembers",
        type: "string[]",
        description: "Names of other members who have active bookings.",
      },
      {
        name: "workout",
        type: "object",
        description: "Full nested workout metadata joined from workout_types.",
      },
    ],
  },
  {
    id: "sessions-join",
    method: "POST",
    path: "/api/sessions/[id]/join",
    auth: "Bearer token",
    summary:
      "Creates an active booking for the authenticated user if capacity is available.",
    request: "No request body.",
    response: pretty({
      success: true,
      booking: {
        sessionId: 42,
        userId: 7,
        enrolledCount: 12,
        capacity: 18,
      },
    }),
    error: pretty({
      success: false,
      error: "Session is full",
    }),
    fields: [
      {
        name: "sessionId",
        type: "number",
        description: "Path parameter mapped to schedule.id.",
      },
      {
        name: "userId",
        type: "number",
        description: "Authenticated profile id read from the JWT payload.",
      },
      {
        name: "enrolledCount",
        type: "number",
        description: "Updated count after a successful transactional join.",
      },
      {
        name: "capacity",
        type: "number",
        description: "Maximum capacity for the joined session.",
      },
      {
        name: "400 error",
        type: "object",
        description:
          "Returned when the session id is invalid, the session does not exist, the class is full, or the mutation cannot be completed.",
      },
    ],
    notes: [
      "If the user already has an active booking, the API returns success with alreadyJoined: true.",
      "Capacity and enrolledCount are updated inside a database transaction.",
    ],
  },
  {
    id: "sessions-leave",
    method: "POST",
    path: "/api/sessions/[id]/leave",
    auth: "Bearer token",
    summary:
      "Deletes the authenticated user's active booking and decrements enrolledCount safely.",
    request: "No request body.",
    response: pretty({
      success: true,
      sessionId: 42,
      enrolledCount: 11,
      capacity: 18,
    }),
    error: pretty({
      success: false,
      error: "Active booking not found",
    }),
    fields: [
      {
        name: "sessionId",
        type: "number",
        description: "Path parameter mapped to schedule.id.",
      },
      {
        name: "enrolledCount",
        type: "number",
        description: "Updated count after the active booking is removed.",
      },
      {
        name: "capacity",
        type: "number | null",
        description: "Session capacity returned with the updated schedule row.",
      },
      {
        name: "400 error",
        type: "object",
        description:
          "Returned when the user tries to leave a session they never joined or no longer have an active booking for.",
      },
    ],
    notes: ["The decrement uses GREATEST(enrolled_count - 1, 0) inside a transaction."],
  },
];

const methodClass = (method: EndpointDoc["method"]) =>
  method === "GET" ? "bg-blue-600 text-white" : "bg-indigo-600 text-white";

const renderCodeBox = (label: string, value: string) => `
  <div class="min-w-0">
    <p class="text-xs font-bold uppercase tracking-wide text-slate-500">${label}</p>
    <pre class="mt-2 rounded-2xl bg-slate-950 p-4 text-xs leading-5 text-slate-100 shadow-inner whitespace-pre-wrap break-all font-mono">${value}</pre>
  </div>
`;

const renderRows = (
  title: string,
  rows: { name: string; type: string; description: string }[]
) => `
  <div class="mt-5">
    <h3 class="text-sm font-bold text-slate-900">${title}</h3>
    <div class="mt-3 grid gap-2">
      ${rows
        .map(
          (row) => `
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div class="flex flex-wrap items-center gap-2">
                <code class="rounded-md bg-white px-2 py-1 font-mono text-xs font-bold text-slate-900">${row.name}</code>
                <span class="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700">${row.type}</span>
              </div>
              <p class="mt-2 text-sm leading-6 text-slate-600">${row.description}</p>
            </div>
          `
        )
        .join("")}
    </div>
  </div>
`;

const renderEndpointCard = (endpoint: EndpointDoc) => `
  <article id="${endpoint.id}" class="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-3">
          <span class="rounded-lg px-3 py-1.5 text-xs font-black ${methodClass(endpoint.method)}">${endpoint.method}</span>
          <code class="break-all font-mono text-sm font-black text-slate-950">${endpoint.path}</code>
        </div>
        <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-600">${endpoint.summary}</p>
      </div>
      <span class="w-fit rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">${endpoint.auth}</span>
    </div>

    <div class="mt-5 grid min-w-0 gap-4 lg:grid-cols-2">
      ${renderCodeBox("Request", endpoint.request)}
      ${renderCodeBox("Response", endpoint.response)}
    </div>

    ${
      endpoint.error
        ? `<div class="mt-4">${renderCodeBox("400 Bad Request Example", endpoint.error)}</div>`
        : ""
    }

    ${
      endpoint.queryParams
        ? renderRows("Query Parameters", endpoint.queryParams)
        : ""
    }

    ${renderRows("Field Breakdown", endpoint.fields)}

    ${
      endpoint.notes
        ? `
          <div class="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
            <h3 class="text-sm font-bold text-indigo-950">Implementation Notes</h3>
            <ul class="mt-2 space-y-2 text-sm leading-6 text-indigo-900">
              ${endpoint.notes.map((note) => `<li>${note}</li>`).join("")}
            </ul>
          </div>
        `
        : ""
    }
  </article>
`;

export const GET = async () => {
  const endpointCards = endpoints.map(renderEndpointCard).join("");
  const navLinks = endpoints
    .map(
      (endpoint) => `
        <a href="#${endpoint.id}" class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950">
          <span class="rounded-md px-2 py-1 text-[10px] font-black ${methodClass(endpoint.method)}">${endpoint.method}</span>
          <span class="break-all font-mono text-xs">${endpoint.path}</span>
        </a>
      `
    )
    .join("");

  const html = `<!doctype html>
    <html lang="en" class="scroll-smooth">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="https://cdn.tailwindcss.com"></script>
        <title>SportSpot Mobile API</title>
      </head>
      <body id="top" class="bg-slate-50 text-slate-900 antialiased">
        <main class="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <section class="mb-6 rounded-3xl bg-slate-900 p-8 text-white shadow-xl shadow-slate-300/50">
            <p class="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">SportSpot 2.0</p>
            <h1 class="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Mobile REST API</h1>
            <p class="mt-4 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
              JSON endpoints for Expo clients. Protected requests must include
              <code class="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-white">Authorization: Bearer &lt;TOKEN&gt;</code>.
            </p>
          </section>

          <div class="grid gap-6 lg:grid-cols-[280px_1fr]">
            <aside class="lg:sticky lg:top-5 lg:self-start">
              <nav class="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
                <p class="px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-500">Routes</p>
                <div class="grid gap-1">${navLinks}</div>
              </nav>
            </aside>

            <section class="grid min-w-0 gap-5">
              ${endpointCards}

              <section class="rounded-3xl border border-slate-200 bg-white p-5 text-sm leading-6 shadow-sm sm:p-6">
                <h2 class="text-lg font-black text-slate-950">Status Codes</h2>
                <div class="mt-3 grid gap-2 sm:grid-cols-2">
                  <p><strong>200 OK</strong> for successful reads, already joined responses, and leave requests.</p>
                  <p><strong>201 Created</strong> when a new booking row is created.</p>
                  <p><strong>400 Bad Request</strong> for malformed input, full sessions, missing bookings, or impossible mutations.</p>
                  <p><strong>401 Unauthorized</strong> for missing, expired, or invalid bearer tokens.</p>
                </div>
              </section>
            </section>
          </div>
        </main>

        <a href="#top" class="fixed bottom-4 right-4 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-slate-400/40 transition hover:bg-slate-700">
          Back to Top
        </a>
      </body>
    </html>`;

  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
};
