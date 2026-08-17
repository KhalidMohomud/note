# Welcome Notes

## Project overview

Welcome Notes is a small internal notes application built for the Merhaba Junior
Developer assignment. A user can register, log in, and manage private notes.
Every note operation is authenticated on the server and scoped to the current
user, including search.

The project intentionally stays within the assignment scope. It does not include
roles, note sharing, password reset, email verification, pagination, or other
extra product features.

## Features

- Email and password registration
- Login and logout
- Database-backed, cookie-based sessions
- Protected dashboard and note pages
- Create, list, view, edit, and delete notes
- Case-insensitive search across note titles and bodies
- Success alerts plus empty, no-results, loading, validation, and safe error states
- Owner-only note access: one user cannot read or mutate another user's notes
- Unit tests and optional PostgreSQL integration tests

## Tech stack

| Technology | Purpose |
| --- | --- |
| Next.js 16 App Router | Routing, Server Components, Server Actions, and production server |
| React 19 | User interface and form state |
| TypeScript | Static type checking |
| Tailwind CSS 4 | Styling |
| PostgreSQL | Persistent relational database |
| Prisma 7 | Schema, migrations, generated client, and database queries |
| `pg` and `@prisma/adapter-pg` | PostgreSQL driver and Prisma adapter |
| bcryptjs | Password hashing and verification |
| Zod | Server-side input validation |
| Vitest and Testing Library | Unit, component, and integration testing |
| ESLint | Code-quality and Next.js checks |

## Architecture

The application uses a simple server-first App Router architecture:

```text
Browser
  -> Next.js pages and client form components
  -> Server Actions for authentication and note mutations
  -> server-only authentication and note data modules
  -> Prisma Client
  -> PostgreSQL
```

Important directories:

```text
app/(auth)/                 Public login and registration pages
app/(authenticated)/       Protected layout, dashboard, and note pages
app/actions/                Authentication and note Server Actions
lib/auth/                   Password, validation, and session logic
lib/notes/                  Note validation and owner-scoped data access
lib/prisma.ts               Server-only Prisma Client singleton
prisma/schema.prisma        Database models and relations
prisma/migrations/          Versioned SQL migrations
tests/unit/                 Fast isolated behavior tests
tests/integration/          Test-database safety and PostgreSQL ownership tests
```

Reads happen in Server Components through `lib/notes/data.ts`. Mutations use
Server Actions, which validate `FormData` and delegate to the same server-only
data layer. The data layer calls `requireUser()` before every note query.

There are no custom REST API routes in this implementation.

## Database design

The Prisma schema contains exactly three models.

### User

| Field | Purpose |
| --- | --- |
| `id` | Auto-incrementing integer primary key |
| `email` | Unique login identifier |
| `passwordHash` | bcrypt password hash; never a plaintext password |
| `createdAt` / `updatedAt` | Record timestamps |

### Note

| Field | Purpose |
| --- | --- |
| `id` | Auto-incrementing integer primary key |
| `title` / `body` | Note content |
| `userId` | Required foreign key to the owning user |
| `createdAt` / `updatedAt` | Record timestamps |

### Session

| Field | Purpose |
| --- | --- |
| `tokenHash` | SHA-256 hash of the session token and primary key |
| `userId` | Required foreign key to the authenticated user |
| `expiresAt` | Absolute session expiry time |
| `createdAt` | Session creation time |

The relationships are `User 1 -> many Notes` and `User 1 -> many Sessions`.
Both foreign keys use `ON DELETE CASCADE`, so deleting a user would also delete
that user's notes and sessions.

`User.email` has a unique index. `Note.userId` supports the application's main
owner-scoped list queries. `Session.userId` supports user/session lookups, while
`Session.expiresAt` supports expiration-based maintenance. No search-specific
index is included because the assignment uses a small, simple `contains` query.

## Authentication approach

Authentication uses custom database sessions and stays on the server.

### Registration

1. The registration form submits to a Server Action.
2. Zod trims and lowercases the email and validates the email and password.
3. bcrypt hashes the password with cost factor 12.
4. Prisma stores the user with `passwordHash`.
5. A database session is created and the user is redirected to `/dashboard`.

### Login

1. The login Server Action validates the submitted credentials.
2. Prisma selects only the user's ID and password hash.
3. bcrypt compares the submitted password with the stored hash.
4. Unknown emails and incorrect passwords return the same public message.
5. Successful verification creates a new session and redirects to the dashboard.

### Session handling

- The server generates a random 32-byte token.
- Only its SHA-256 hash is stored in the `Session` table.
- The raw token is stored in a seven-day cookie.
- The cookie is `HttpOnly`, `SameSite=Lax`, scoped to `/`, and `Secure` in production.
- Each authenticated request hashes the cookie token and checks its database session and expiry.
- Logout deletes the database session and removes the cookie.

The client never receives `passwordHash`.

## Security considerations

- **Password storage:** Passwords are bcrypt hashes, never plaintext.
- **Password validation:** Passwords require at least 8 characters and cannot exceed bcrypt's 72-byte input limit.
- **Authorization:** Every note query obtains the user ID from the server-side session. A client-supplied `userId` is never trusted.
- **IDOR prevention:** Reads use `id + userId`; updates and deletes use owner-scoped `updateMany` and `deleteMany` filters.
- **Information disclosure:** Missing and unowned notes use the same not-found behavior. Authentication and database failures return generic public messages.
- **Session storage:** PostgreSQL stores hashes of high-entropy session tokens, not usable raw tokens.
- **Cookie protection:** Session cookies are inaccessible to client-side JavaScript and are HTTPS-only in production.
- **Input validation:** Note IDs, credentials, note content, and search input are constrained before use.
- **SQL injection:** Database access uses Prisma's structured query API; there are no raw SQL queries.
- **XSS:** User content is rendered as React text. The application does not use `dangerouslySetInnerHTML`.
- **CSRF:** Mutations use Next.js Server Actions, which use POST and perform Origin/Host checks; `SameSite=Lax` adds cookie protection.
- **Environment variables:** Real `.env` files and the generated Prisma client are ignored by Git. No secret uses a `NEXT_PUBLIC_` prefix.
- **Test database safety:** Integration tests require `TEST_DATABASE_URL`, refuse an exact match with `DATABASE_URL`, and never fall back to the application database.

A public production deployment should add shared rate limiting around login and
registration. An in-memory limiter is intentionally not included because it
would not be reliable across multiple application instances.

## Local setup

Requirements:

- Node.js 20.9 or newer
- npm
- A reachable PostgreSQL database dedicated to development

Install and start the project:

```bash
npm install
cp .env.example .env
# Replace the DATABASE_URL placeholder in .env.
npm run db:generate
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`. Do not overwrite an existing `.env` when copying
the example file.

## Environment variables

| Variable | Required | Used for |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Application runtime, Prisma Client, and migrations |
| `TEST_DATABASE_URL` | Only for PostgreSQL integration tests | Separate disposable test database |

Example values are documented in `.env.example`. Never commit real credentials,
and never set `TEST_DATABASE_URL` to a production database.

## Prisma migration commands

```bash
npm run db:validate   # validate Prisma configuration and schema
npm run db:generate   # regenerate Prisma Client
npm run db:migrate    # create/apply a development migration
npm run db:studio     # inspect development data with Prisma Studio
npx prisma migrate status
npx prisma migrate deploy  # apply committed migrations in production
```

The repository currently contains an initial `User`/`Note` migration and a
second migration that adds the `Session` table. Apply all pending migrations
before exercising the related application flow.

## Testing

The suite prioritizes authentication, authorization, and core note behavior.

```bash
npm test                 # unit tests, then integration tests
npm run test:unit        # fast unit and component tests
npm run test:integration # database safety and optional PostgreSQL tests
npm run test:watch       # watch unit tests during development
npm run test:coverage    # generate the configured coverage report
npm run typecheck
npm run lint
```

The regular suite currently passes 61 tests. Three PostgreSQL ownership tests
are skipped when `TEST_DATABASE_URL` is absent.

`npm run test:coverage` generates the coverage artifacts but currently returns a
non-zero status because the configured 80% global thresholds include UI files
that are intentionally not fully covered. The passing acceptance command for
the current core-focused suite is `npm test`.

To run those tests, configure a separate migrated database:

```bash
export TEST_DATABASE_URL="postgresql://..."
DATABASE_URL="$TEST_DATABASE_URL" npx prisma migrate deploy
npm run test:integration
```

The PostgreSQL tests clean up their fixed test users after execution. They
verify CRUD ownership, owner-scoped search, and that User A cannot read, update,
or delete User B's note.

## Deployment

Welcome Notes requires a server runtime because it uses Server Actions, cookies,
database sessions, and PostgreSQL. It is not suitable for a static export.

It can run on a Next.js-compatible platform or any Node.js host. A basic Node.js
deployment flow is:

```bash
npm ci
npx prisma migrate deploy
npm run build
npm run start
```

`postinstall` runs `prisma generate`, so dependency installation generates the
client. The deployment environment must provide `DATABASE_URL`, network access
to PostgreSQL, and HTTPS so the production session cookie can use `Secure`.

Apply migrations as a controlled deployment step before serving the new code.
Use separate databases for development, testing, and production. Before a public
launch, add an infrastructure-backed rate limit for authentication.

## AI usage

AI was used as a development assistant during this assignment.

### What AI helped with
- Implementing and testing authentication, notes CRUD, owner-scoped search, and security checks
- Reviewing error handling, session handling, authorization boundaries, and documentation

### What I reviewed

I reviewed the Prisma schema and SQL migrations, registration and login flow,
session cookie options, owner-scoped note queries, validation limits, public
error messages, and automated test results. I also checked that the application
never accepts a client-provided owner ID for a note.

### What I changed

I kept the implementation limited to the assignment requirements, applied the
missing session migration after identifying the runtime error, retained a
simple server-only data layer, and required explicit tests for unauthorized and
cross-user note access. I also changed authentication failures to use generic
messages rather than exposing account existence or infrastructure errors.
# note
# note
