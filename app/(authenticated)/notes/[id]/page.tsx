import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteNoteAction } from "@/app/actions/notes";
import { DeleteNoteButton } from "../delete-note-button";
import { getNoteForCurrentUser } from "@/lib/notes/data";
import { noteIdSchema } from "@/lib/notes/validation";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function NotePage({
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

  const deleteAction = deleteNoteAction.bind(null, note.id);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link className="text-sm font-medium text-slate-600" href="/dashboard">
        ← Back to notes
      </Link>
      <article className="mt-6 rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-bold tracking-tight">{note.title}</h1>
        <p className="mt-3 text-sm text-slate-500">
          Created {dateFormatter.format(note.createdAt)} · Updated{" "}
          {dateFormatter.format(note.updatedAt)}
        </p>
        <p className="mt-8 whitespace-pre-wrap break-words text-slate-700">
          {note.body}
        </p>
      </article>
      <div className="mt-6 flex items-start gap-3">
        <Link
          className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white"
          href={`/notes/${note.id}/edit`}
        >
          Edit
        </Link>
        <DeleteNoteButton action={deleteAction} />
      </div>
    </main>
  );
}
