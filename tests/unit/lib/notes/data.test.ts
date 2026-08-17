import { beforeEach, describe, expect, it, vi } from "vitest";

import type { NoteInput } from "@/lib/notes/validation";

const mocks = vi.hoisted(() => ({
  noteCreate: vi.fn(),
  noteDeleteMany: vi.fn(),
  noteFindFirst: vi.fn(),
  noteFindMany: vi.fn(),
  noteUpdateMany: vi.fn(),
  requireUser: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth/session", () => ({
  requireUser: mocks.requireUser,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    note: {
      create: mocks.noteCreate,
      deleteMany: mocks.noteDeleteMany,
      findFirst: mocks.noteFindFirst,
      findMany: mocks.noteFindMany,
      updateMany: mocks.noteUpdateMany,
    },
  },
}));

import {
  createNoteForCurrentUser,
  deleteNoteForCurrentUser,
  getNoteForCurrentUser,
  listNotesForCurrentUser,
  updateNoteForCurrentUser,
} from "@/lib/notes/data";

describe("ownership-scoped note data access", () => {
  beforeEach(() => {
    mocks.requireUser.mockResolvedValue({ id: 42, email: "user@example.com" });
  });

  it("lists only the authenticated user's notes", async () => {
    const ownedNotes = [
      {
        id: 7,
        title: "Owned note",
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-02T00:00:00Z"),
      },
    ];
    mocks.noteFindMany.mockResolvedValue(ownedNotes);

    await expect(listNotesForCurrentUser()).resolves.toEqual(ownedNotes);

    expect(mocks.noteFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 42 } }),
    );
  });

  it("searches title and body inside the authenticated user's scope", async () => {
    mocks.noteFindMany.mockResolvedValue([]);

    await listNotesForCurrentUser("  roadmap  ");

    expect(mocks.noteFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 42,
          OR: [
            {
              title: {
                contains: "roadmap",
                mode: "insensitive",
              },
            },
            {
              body: {
                contains: "roadmap",
                mode: "insensitive",
              },
            },
          ],
        },
      }),
    );
  });

  it("treats a whitespace-only search as an unfiltered list", async () => {
    mocks.noteFindMany.mockResolvedValue([]);

    await listNotesForCurrentUser("   ");

    expect(mocks.noteFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 42 } }),
    );
  });

  it("reads a note by both note ID and authenticated user ID", async () => {
    mocks.noteFindFirst.mockResolvedValue(null);

    await expect(getNoteForCurrentUser(9)).resolves.toBeNull();
    expect(mocks.noteFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 9, userId: 42 } }),
    );
  });

  it("ignores a client-supplied userId when creating a note", async () => {
    mocks.noteCreate.mockResolvedValue({ id: 10 });
    const maliciousInput = {
      title: "Owned note",
      body: "Body",
      userId: 999,
    } as NoteInput & { userId: number };

    await createNoteForCurrentUser(maliciousInput);

    expect(mocks.noteCreate).toHaveBeenCalledWith({
      data: { title: "Owned note", body: "Body", userId: 42 },
      select: { id: true },
    });
  });

  it("updates only a note owned by the authenticated user", async () => {
    mocks.noteUpdateMany.mockResolvedValue({ count: 1 });

    await expect(
      updateNoteForCurrentUser(9, { title: "Updated", body: "Body" }),
    ).resolves.toBe(true);
    expect(mocks.noteUpdateMany).toHaveBeenCalledWith({
      where: { id: 9, userId: 42 },
      data: { title: "Updated", body: "Body" },
    });
  });

  it("does not update User B's note while authenticated as User A", async () => {
    mocks.requireUser.mockResolvedValue({ id: 101, email: "a@example.com" });
    mocks.noteUpdateMany.mockResolvedValue({ count: 0 });

    await expect(
      updateNoteForCurrentUser(88, { title: "Attack", body: "Changed" }),
    ).resolves.toBe(false);
    expect(mocks.noteUpdateMany).toHaveBeenCalledWith({
      where: { id: 88, userId: 101 },
      data: { title: "Attack", body: "Changed" },
    });
  });

  it("deletes only a note owned by the authenticated user", async () => {
    mocks.noteDeleteMany.mockResolvedValue({ count: 0 });

    await expect(deleteNoteForCurrentUser(9)).resolves.toBe(false);
    expect(mocks.noteDeleteMany).toHaveBeenCalledWith({
      where: { id: 9, userId: 42 },
    });
  });

  it("blocks every note operation when there is no authenticated user", async () => {
    mocks.requireUser.mockRejectedValue(new Error("redirect:/login"));

    await expect(listNotesForCurrentUser()).rejects.toThrow("redirect:/login");
    await expect(getNoteForCurrentUser(9)).rejects.toThrow("redirect:/login");
    await expect(
      createNoteForCurrentUser({ title: "Title", body: "Body" }),
    ).rejects.toThrow("redirect:/login");
    await expect(
      updateNoteForCurrentUser(9, { title: "Title", body: "Body" }),
    ).rejects.toThrow("redirect:/login");
    await expect(deleteNoteForCurrentUser(9)).rejects.toThrow("redirect:/login");

    expect(mocks.noteFindMany).not.toHaveBeenCalled();
    expect(mocks.noteFindFirst).not.toHaveBeenCalled();
    expect(mocks.noteCreate).not.toHaveBeenCalled();
    expect(mocks.noteUpdateMany).not.toHaveBeenCalled();
    expect(mocks.noteDeleteMany).not.toHaveBeenCalled();
  });
});
