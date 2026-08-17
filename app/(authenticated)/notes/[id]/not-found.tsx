import Link from "next/link";

export default function NoteNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Note not found</h1>
      <p className="mt-3 text-slate-600">
        This note does not exist or you do not have access to it.
      </p>
      <Link
        className="mt-6 inline-block rounded-lg bg-slate-900 px-4 py-2 font-medium text-white"
        href="/dashboard"
      >
        Back to my notes
      </Link>
    </main>
  );
}
