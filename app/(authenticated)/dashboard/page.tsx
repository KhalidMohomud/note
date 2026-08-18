import Link from "next/link";

import { listNotesForCurrentUser } from "@/lib/notes/data";
import { NoteSuccessAlert } from "../notes/note-success-alert";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
  }>;
}) {
  const queryParameters = await searchParams;
  const rawQuery = queryParameters.q;
  const query =
    typeof rawQuery === "string" ? rawQuery.trim().slice(0, 200) : "";
  const notes = await listNotesForCurrentUser(query);
  const hasSearch = query.length > 0;
  const successMessage =
    queryParameters.status === "deleted"
      ? "Note deleted successfully."
      : null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      {successMessage ? <NoteSuccessAlert message={successMessage} /> : null}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">My notes</h1>
        <Link
          className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white"
          href="/notes/new"
        >
          New note
        </Link>
      </div>

      <form
        action="/dashboard"
        className="mt-8 flex items-center gap-3"
        method="get"
        role="search"
      >
        <label className="sr-only" htmlFor="note-search">
          Search notes
        </label>
        <input
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-900"
          defaultValue={query}
          id="note-search"
          maxLength={200}
          name="q"
          placeholder="Search titles and bodies"
          type="search"
        />
        <button
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium"
          type="submit"
        >
          Search
        </button>
        {hasSearch ? (
          <Link className="text-sm font-medium text-slate-600" href="/dashboard">
            Clear
          </Link>
        ) : null}
      </form>

      {notes.length === 0 ? (
        <section className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold">
            {hasSearch ? "No notes found" : "No notes yet"}
          </h2>
          <p className="mt-2 text-slate-600">
            {hasSearch
              ? `No notes match “${query}”.`
              : "Create your first note to get started."}
          </p>
        </section>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {notes.map((note) => (
            <li key={note.id}>
              <Link
                className="block rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-slate-400"
                href={`/notes/${note.id}`}
              >
                <h2 className="font-semibold">{note.title}</h2>
                <p className="mt-3 text-sm text-slate-500">
                  Updated {dateFormatter.format(note.updatedAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
