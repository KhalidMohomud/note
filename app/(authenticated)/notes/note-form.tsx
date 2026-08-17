"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { NoteActionState } from "@/lib/notes/validation";

type NoteFormProps = {
  action: (
    state: NoteActionState,
    formData: FormData,
  ) => Promise<NoteActionState>;
  defaultValues?: {
    title: string;
    body: string;
  };
  submitLabel: string;
};

const initialState: NoteActionState = {};

export function NoteForm({
  action,
  defaultValues,
  submitLabel,
}: NoteFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <div>
        <label className="block text-sm font-medium" htmlFor="title">
          Title
        </label>
        <input
          aria-describedby="title-error"
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
          defaultValue={defaultValues?.title}
          id="title"
          maxLength={200}
          name="title"
          required
        />
        <p className="mt-1 text-sm text-red-700" id="title-error">
          {state.errors?.title?.[0]}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="body">
          Body
        </label>
        <textarea
          aria-describedby="body-error"
          className="mt-2 min-h-64 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
          defaultValue={defaultValues?.body}
          id="body"
          maxLength={10_000}
          name="body"
          required
        />
        <p className="mt-1 text-sm text-red-700" id="body-error">
          {state.errors?.body?.[0]}
        </p>
      </div>

      {state.message ? (
        <p aria-live="polite" className="text-sm text-red-700">
          {state.message}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link
          className="rounded-lg border border-slate-300 px-4 py-2 font-medium"
          href="/dashboard"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
