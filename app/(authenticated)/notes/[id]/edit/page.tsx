import { notFound } from "next/navigation";

import { updateNoteAction } from "@/app/actions/notes";
import { NoteForm } from "../../note-form";
import { getNoteForCurrentUser } from "@/lib/notes/data";
import { noteIdSchema } from "@/lib/notes/validation";

export default async function EditNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const noteId = noteIdSchema.safeParse((await params).id);

  if (!noteId.success) {
    notFound();
  }

  const note = await getNoteForCurrentUser(noteId.data);

  if (!note) {
    notFound();
  }

  const updateAction = updateNoteAction.bind(null, note.id);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Edit note</h1>
      <NoteForm
        action={updateAction}
        defaultValues={{ title: note.title, body: note.body }}
        submitLabel="Save changes"
      />
    </main>
  );
}
