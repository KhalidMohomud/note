import { createNoteAction } from "@/app/actions/notes";
import { NoteForm } from "../note-form";

export default function NewNotePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Create note</h1>
      <NoteForm action={createNoteAction} submitLabel="Create note" />
    </main>
  );
}
