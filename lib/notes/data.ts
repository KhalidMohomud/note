import "server-only";

import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { NoteInput } from "@/lib/notes/validation";

export async function listNotesForCurrentUser(searchQuery = "") {
  const user = await requireUser();
  const query = searchQuery.trim();

  return prisma.note.findMany({
    where: {
      userId: user.id,
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" as const } },
              { body: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getNoteForCurrentUser(noteId: number) {
  const user = await requireUser();

  return prisma.note.findFirst({
    where: {
      id: noteId,
      userId: user.id,
    },
    select: {
      id: true,
      title: true,
      body: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createNoteForCurrentUser(input: NoteInput) {
  const user = await requireUser();

  return prisma.note.create({
    data: {
      title: input.title,
      body: input.body,
      userId: user.id,
    },
    select: { id: true },
  });
}

export async function updateNoteForCurrentUser(
  noteId: number,
  input: NoteInput,
) {
  const user = await requireUser();
  const result = await prisma.note.updateMany({
    where: {
      id: noteId,
      userId: user.id,
    },
    data: {
      title: input.title,
      body: input.body,
    },
  });

  return result.count === 1;
}

export async function deleteNoteForCurrentUser(noteId: number) {
  const user = await requireUser();
  const result = await prisma.note.deleteMany({
    where: {
      id: noteId,
      userId: user.id,
    },
  });

  return result.count === 1;
}
