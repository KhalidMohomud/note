import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { PrismaClient } from "@/generated/prisma/client";
import { getTestDatabaseUrl } from "./test-database";

const testDatabaseUrl = getTestDatabaseUrl();
const describeWithTestDatabase = testDatabaseUrl ? describe : describe.skip;
const testEmails = [
  "welcome-notes-test-a@example.com",
  "welcome-notes-test-b@example.com",
];

let currentUserId: number | null = null;
let prisma: PrismaClient;
let notes: typeof import("@/lib/notes/data");

async function cleanTestUsers() {
  await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
}

describeWithTestDatabase("note ownership with PostgreSQL", () => {
  beforeAll(async () => {
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: testDatabaseUrl! }),
    });

    vi.doMock("server-only", () => ({}));
    vi.doMock("@/lib/prisma", () => ({ prisma }));
    vi.doMock("@/lib/auth/session", () => ({
      requireUser: vi.fn(async () => {
        if (currentUserId === null) {
          throw new Error("Unauthenticated");
        }

        return { id: currentUserId, email: "test@example.com" };
      }),
    }));

    notes = await import("@/lib/notes/data");
  });

  beforeEach(async () => {
    await cleanTestUsers();
    currentUserId = null;
  });

  afterAll(async () => {
    if (prisma) {
      await cleanTestUsers();
      await prisma.$disconnect();
    }
  });

  async function createUsers() {
    const [userA, userB] = await Promise.all(
      testEmails.map((email) =>
        prisma.user.create({ data: { email, passwordHash: "test-only" } }),
      ),
    );

    return { userA, userB };
  }

  it("creates, lists, updates, and deletes only the current user's note", async () => {
    const { userA, userB } = await createUsers();
    await prisma.note.create({
      data: { title: "User B note", body: "Private", userId: userB.id },
    });
    currentUserId = userA.id;

    const created = await notes.createNoteForCurrentUser({
      title: "User A note",
      body: "Owned by A",
    });
    const listed = await notes.listNotesForCurrentUser();

    expect(listed.map((note) => note.id)).toEqual([created.id]);
    await expect(
      notes.updateNoteForCurrentUser(created.id, {
        title: "Updated by A",
        body: "Updated body",
      }),
    ).resolves.toBe(true);
    await expect(notes.deleteNoteForCurrentUser(created.id)).resolves.toBe(
      true,
    );
    await expect(
      prisma.note.findUnique({ where: { id: created.id } }),
    ).resolves.toBeNull();
  });

  it("searches title and body without returning User B's matching note", async () => {
    const { userA, userB } = await createUsers();
    await prisma.note.createMany({
      data: [
        {
          title: "Planning",
          body: "Roadmap for User A",
          userId: userA.id,
        },
        {
          title: "Roadmap for User B",
          body: "Private",
          userId: userB.id,
        },
      ],
    });
    currentUserId = userA.id;

    const results = await notes.listNotesForCurrentUser("roadmap");

    expect(results).toHaveLength(1);
    expect(results[0]?.title).toBe("Planning");
  });

  it("prevents User A from reading, updating, or deleting User B's note", async () => {
    const { userA, userB } = await createUsers();
    const userBNote = await prisma.note.create({
      data: { title: "User B secret", body: "Private", userId: userB.id },
    });
    currentUserId = userA.id;

    await expect(notes.getNoteForCurrentUser(userBNote.id)).resolves.toBeNull();
    await expect(
      notes.updateNoteForCurrentUser(userBNote.id, {
        title: "Changed by A",
        body: "Attack",
      }),
    ).resolves.toBe(false);
    await expect(notes.deleteNoteForCurrentUser(userBNote.id)).resolves.toBe(
      false,
    );

    await expect(
      prisma.note.findUnique({ where: { id: userBNote.id } }),
    ).resolves.toMatchObject({
      title: "User B secret",
      body: "Private",
      userId: userB.id,
    });
  });
});
