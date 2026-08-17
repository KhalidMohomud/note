"use server";

import { redirect, unstable_rethrow } from "next/navigation";

import {
  createNoteForCurrentUser,
  deleteNoteForCurrentUser,
  updateNoteForCurrentUser,
} from "@/lib/notes/data";
import {
  noteIdSchema,
  noteSchema,
  type NoteActionState,
} from "@/lib/notes/validation";

function readNote(formData: FormData) {
  return noteSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
  });
}

export async function createNoteAction(
  _previousState: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const note = readNote(formData);

  if (!note.success) {
    return { errors: note.error.flatten().fieldErrors };
  }

  let noteId: number;

  try {
    const createdNote = await createNoteForCurrentUser(note.data);
    noteId = createdNote.id;
  } catch (error) {
    unstable_rethrow(error);
    return { message: "Unable to create the note. Please try again." };
  }

  redirect(`/notes/${noteId}`);
}

export async function updateNoteAction(
  noteId: number,
  _previousState: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  void _previousState;

  const validNoteId = noteIdSchema.safeParse(noteId);
  const note = readNote(formData);

  if (!validNoteId.success) {
    return { message: "Note not found." };
  }

  if (!note.success) {
    return { errors: note.error.flatten().fieldErrors };
  }

  try {
    const updated = await updateNoteForCurrentUser(
      validNoteId.data,
      note.data,
    );

    if (!updated) {
      return { message: "Note not found." };
    }
  } catch (error) {
    unstable_rethrow(error);
    return { message: "Unable to update the note. Please try again." };
  }

  redirect(`/notes/${validNoteId.data}`);
}

export async function deleteNoteAction(
  noteId: number,
  _previousState: NoteActionState,
  _formData: FormData,
): Promise<NoteActionState> {
  void _previousState;
  void _formData;

  const validNoteId = noteIdSchema.safeParse(noteId);

  if (!validNoteId.success) {
    return { message: "Note not found." };
  }

  try {
    const deleted = await deleteNoteForCurrentUser(validNoteId.data);

    if (!deleted) {
      return { message: "Note not found." };
    }
  } catch (error) {
    unstable_rethrow(error);
    return { message: "Unable to delete the note. Please try again." };
  }

  redirect("/dashboard");
}
