"use client";

export default function AuthenticatedError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-3 text-slate-600">
        We could not load your notes. Please try again.
      </p>
      <button
        className="mt-6 rounded-lg bg-slate-900 px-4 py-2 font-medium text-white"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </main>
  );
}
