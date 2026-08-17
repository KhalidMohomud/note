# Welcome Notes Interview Guide

This guide is based only on the code currently implemented in Welcome Notes.
Use the answers as a starting point and explain them in your own words.

## Short project introduction

**Q: Can you summarize the project?**

Welcome Notes is a Next.js App Router application where users register and log
in with email and password, then create and manage private notes. PostgreSQL
stores users, notes, and database sessions. Prisma handles the schema,
migrations, and queries. The main security requirement is enforced in the
server-only data layer: every note query uses the authenticated user's ID, so a
user cannot access another user's note even if they know its ID.

## Architecture

**Q: How is the application structured?**

Public login and registration pages are in the `(auth)` route group. Protected
pages are in `(authenticated)` under a layout that calls `requireUser()`.
Client form components submit to Server Actions. Authentication helpers and the
note data layer are server-only modules. Prisma connects those modules to
PostgreSQL.

**Q: Why did you use Server Actions instead of custom API routes?**

The UI and backend are in one Next.js application, so Server Actions provide a
small way to process form mutations on the server. They also work with
`useActionState` for pending and validation states. I still treat each action as
an externally callable entry point: input is validated, authentication is
checked in the data layer, and return values contain only safe UI messages.

**Q: Why have a separate note data module?**

`lib/notes/data.ts` centralizes database access and authorization. Pages and
actions do not need to remember how to scope each query. Every exported note
operation calls `requireUser()` and uses that trusted user ID in Prisma.

**Q: Why is the Prisma Client a singleton?**

Development hot reload can evaluate modules repeatedly. Reusing one client on
`globalThis` outside production avoids creating unnecessary connection pools.
The module is marked `server-only`, and it fails clearly if `DATABASE_URL` is
missing.

## PostgreSQL

**Q: What tables exist?**

There are three: `User`, `Note`, and `Session`. A user has many notes and many
sessions. `Note.userId` and `Session.userId` are required foreign keys to
`User.id`.

**Q: Why is `Note.userId` required?**

A note must always have an owner. The non-null foreign key enforces that rule in
PostgreSQL, while the application derives its value from the authenticated
session rather than from the client.

**Q: Which indexes did you add and why?**

`User.email` is unique for login and duplicate prevention. `Note.userId`
supports listing and filtering notes by owner. `Session.userId` supports
user/session access, and `Session.expiresAt` supports expiration-based
maintenance. I did not add speculative indexes for unused features.

**Q: What does cascade deletion do here?**

Both foreign keys use `ON DELETE CASCADE`. If a user were deleted, PostgreSQL
would also remove that user's notes and sessions, preventing orphaned records.
The current UI does not implement account deletion.

## Prisma

**Q: What does Prisma provide in this project?**

Prisma defines the PostgreSQL schema, generates a typed client, records SQL
migrations, and builds structured queries. Prisma uses the `pg` driver through
`@prisma/adapter-pg`.

**Q: What migrations exist?**

The first migration creates `User` and `Note`, including the unique email,
owner index, and foreign key. The second creates `Session` and its indexes and
foreign key. Both migrations must be applied before authentication is used.

**Q: Why use `updateMany` and `deleteMany` for a single note?**

They allow one atomic filter containing both `id` and `userId`. A result count
of zero means the note is missing or not owned by the caller. That avoids first
loading an untrusted object and then mutating it in a separate query.

**Q: How do migrations differ between development and deployment?**

Locally I use `prisma migrate dev` through `npm run db:migrate`. Deployment uses
`prisma migrate deploy` to apply already committed migrations without creating
new ones.

## Authentication

**Q: Describe registration from start to finish.**

The form calls `registerAction`. Zod trims and lowercases the email and validates
the email and password. bcrypt hashes the password with cost 12. Prisma creates
the user while selecting only the ID. The server then creates a database session,
sets the cookie, and redirects to `/dashboard`.

**Q: Describe login from start to finish.**

The login action validates the credentials, selects the user's ID and
`passwordHash`, and compares the submitted password with bcrypt. Unknown emails
and wrong passwords receive the same error. A successful comparison creates a
new database session and redirects to the dashboard.

**Q: Why use a dummy password hash when the email is unknown?**

The application still performs a bcrypt comparison for an unknown account.
This reduces the timing difference between “email missing” and “password
incorrect” and supports the same public error for both cases.

**Q: Why store `passwordHash` instead of a password?**

Passwords should not be recoverable from the database. bcrypt is deliberately
expensive and salted, so verification compares a candidate to a one-way hash.
The plaintext exists only during the current server request.

**Q: How does logout work?**

The logout Server Action hashes the current cookie token, deletes the matching
database session, deletes the cookie, and redirects to `/login`.

## Sessions

**Q: How are sessions represented?**

The browser receives a random 32-byte raw token. PostgreSQL stores only the
SHA-256 hash of that token with a user ID and expiry. On each authenticated
request, the server hashes the cookie value and looks up the database session.

**Q: Which cookie flags are used?**

The cookie is `HttpOnly`, `SameSite=Lax`, scoped to `/`, expires after seven
days, and is `Secure` when `NODE_ENV` is production. `HttpOnly` blocks direct
JavaScript access, and `Secure` requires HTTPS in production.

**Q: Why choose database sessions instead of a JWT-only session?**

Database sessions make server-side revocation straightforward: logout deletes a
row. The trade-off is a database lookup for authenticated requests and storage
for session rows. That is acceptable for this small application.

## Authorization

**Q: What is the difference between authentication and authorization here?**

Authentication answers “which user is logged in?” Authorization answers “may
this user access this specific note?” A valid session is not enough; each note
query must also match the note's `userId`.

**Q: How do you prevent User A from accessing User B's notes?**

The server never accepts ownership from the client. It calls `requireUser()` and
queries with both the requested note ID and `user.id`. Lists and searches filter
by `userId`, creation assigns `userId` from the session, and updates/deletes use
the same owner filter.

**Q: Why return not found for another user's note?**

Using the same result for a missing note and an unowned note avoids revealing
whether another user's resource exists. It also keeps the UI behavior simple.

**Q: Is protecting the page layout enough?**

No. A Server Action can be called without using the rendered form. The protected
layout improves navigation, but the real boundary is inside `lib/notes/data.ts`,
where every operation independently requires a user and checks ownership.

## Security

**Q: How do you prevent SQL injection?**

All application queries use Prisma's structured query API. User input becomes a
query value rather than executable SQL, and the application uses no raw-query
methods.

**Q: How do you handle XSS risks in note content?**

Titles, bodies, email addresses, and search text are rendered as normal React
text. React escapes them, and the project does not use `dangerouslySetInnerHTML`.

**Q: How is CSRF handled?**

Mutations use Next.js Server Actions, which accept POST and perform Origin/Host
validation. The session cookie also uses `SameSite=Lax`. If deployment later
introduces proxy domains, their origin configuration must remain narrow.

**Q: How do you avoid leaking sensitive information?**

The client never receives `passwordHash` or a database session hash. Prisma
queries select only fields needed by the UI. Login errors do not reveal whether
an email exists, registration and infrastructure failures are generic, and
missing versus unowned notes share the same response.

**Q: What password validation is implemented?**

Email is trimmed, lowercased, length-limited, and validated. Passwords require at
least eight characters. They are also limited to 72 UTF-8 bytes because bcrypt
does not process input beyond that boundary.

**Q: What security improvement would you add before a public launch?**

I would add shared rate limiting for login and registration at the deployment
layer or with persistent shared storage. I would not use a process-local map in
a multi-instance deployment because its counters would be inconsistent and reset
on restart.

## CRUD

**Q: Explain the create-note flow.**

The client form submits title and body to `createNoteAction`. Zod trims them and
enforces a 200-character title and 10,000-character body limit. The data layer
requires the session user and explicitly assigns that user's ID. Prisma returns
only the new note ID, and the action redirects to the detail page.

**Q: Explain read, update, and delete.**

The dynamic route validates the note ID as a positive integer. Read uses
`findFirst({ id, userId })`. Update and delete validate the ID and input, then
execute owner-scoped `updateMany` or `deleteMany`. A zero count becomes the same
not-found response used for an unowned note.

**Q: How are failures shown to the user?**

Validation errors are attached to their fields. Expected not-found and generic
database failures return safe messages. Forms show pending labels, and the
authenticated route group includes loading and error UI.

## Search

**Q: How does search work?**

The dashboard reads the GET parameter `q`, trims it, and limits it to 200
characters. The data layer searches case-insensitively for the value in either
`title` or `body`. The authenticated user's `userId` remains a top-level filter,
so the logic is owner AND (title match OR body match).

**Q: What happens for an empty query or no results?**

An empty or whitespace-only query lists all of the current user's notes. A
non-empty query with no matches shows a separate no-results state and a Clear
link.

**Q: What is the search performance trade-off?**

`contains` is simple and correct for a small assignment, but a normal B-tree
cannot efficiently serve arbitrary substring search. The `userId` index helps
narrow rows by owner. At larger scale I would consider pagination plus a
PostgreSQL trigram GIN index or full-text search, based on search requirements.

## Testing

**Q: What does the test suite prioritize?**

It prioritizes registration, login, password hashing, sessions, validation,
notes CRUD, search, unauthorized access, and owner isolation. It does not chase
100% coverage of presentation code.

**Q: How do you test authorization?**

Unit tests assert that every Prisma filter includes the authenticated `userId`
and that unauthenticated operations reach no Prisma method. Optional PostgreSQL
tests create User A and User B and prove User A cannot read, update, delete, or
search User B's note.

**Q: How do you protect the production database during tests?**

PostgreSQL integration tests read only `TEST_DATABASE_URL`. The helper never
falls back to `DATABASE_URL` and throws if the two strings match. Tests clean up
their fixed test users, which cascades to their notes and sessions.

**Q: How do you run the checks?**

`npm test` runs unit then integration tests. `npm run test:unit` and
`npm run test:integration` run them separately. I also run `npm run typecheck`,
`npm run lint`, and `npm run db:validate`.

## Deployment

**Q: What does the application need in production?**

It needs a Next.js-compatible Node.js runtime, HTTPS, a PostgreSQL database, and
`DATABASE_URL`. It cannot be deployed as a static export because it uses Server
Actions, cookies, database sessions, and server-side queries.

**Q: What is the deployment sequence?**

Install dependencies, apply committed migrations with
`npx prisma migrate deploy`, build with `npm run build`, and start with
`npm run start`. The `postinstall` script generates Prisma Client.

**Q: What would you verify after deployment?**

I would verify that migrations are current, HTTPS sets the Secure session cookie,
registration/login/logout work, protected routes redirect correctly, CRUD works,
search stays owner-scoped, and two accounts cannot access each other's note URLs.

## AI usage

**Q: How did you use AI?**

I used AI as a development assistant for scaffolding, drafting code and tests,
security review, and documentation. I constrained it to the assignment scope and
validated suggestions against the repository instead of treating output as
automatically correct.

**Q: What did you personally review or change?**

I reviewed the schema and migrations, auth flow, bcrypt and cookie settings,
owner filters, validation, public errors, and test results. I applied the missing
session migration after the runtime error and required explicit unauthorized and
cross-user tests. I also kept the data layer simple and rejected extra features.

**Q: Give an example of an AI suggestion you rejected.**

I rejected an in-memory login rate limiter. It would not coordinate across
instances and would reset on restart. A shared infrastructure-backed limiter is
the appropriate production solution, and it was outside this assignment's scope.

## Technical trade-offs

**Q: Why custom authentication instead of an authentication library?**

The custom flow keeps the assignment small and demonstrates validation,
hashing, session creation, and authorization directly. The trade-off is that a
production system would normally prefer a reviewed library for features such as
account recovery, MFA, rotation policies, and broader attack handling. Those
features are not implemented here.

**Q: Why no REST API layer?**

Only this Next.js UI consumes the operations, so Server Actions avoid an extra
transport layer. If mobile clients or external services needed the same backend,
a versioned HTTP API would become useful.

**Q: Why keep search simple?**

The assignment asks for title/body search, and Prisma `contains` expresses that
clearly without another service or database extension. The trade-off is weaker
performance at scale, where trigram or full-text indexing and pagination would
be more appropriate.

**Q: Why not trust a hidden `userId` form field?**

Browser input is controlled by the caller and can be modified. The authenticated
session is the trusted identity source, so the server derives ownership from it.

**Q: What intentionally remains out of scope?**

Roles, sharing, account deletion, password reset, email verification, MFA,
pagination, advanced search, and a shared rate limiter are not present. I would
add them only when requirements justify their schema, UI, security, and tests.
