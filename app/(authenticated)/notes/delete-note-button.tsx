"use client";

import { useActionState } from "react";

import type { NoteActionState } from "@/lib/notes/validation";

type DeleteNoteButtonProps = {
  action: (
    state: NoteActionState,
    formData: FormData,
  ) => Promise<NoteActionState>;
};

const initialState: NoteActionState = {};

export function DeleteNoteButton({ action }: DeleteNoteButtonProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction}>
      <button
        className="rounded-lg border border-red-300 px-4 py-2 font-medium text-red-700 disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {state.message ? (
        <p aria-live="polite" className="mt-2 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
