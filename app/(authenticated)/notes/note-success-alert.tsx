"use client";

import { useState } from "react";

export function NoteSuccessAlert({ message }: { message: string }) {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-900"
      role="alert"
    >
      <p>{message}</p>
      <button
        aria-label="Dismiss notification"
        className="text-sm font-medium underline"
        onClick={() => setVisible(false)}
        type="button"
      >
        Dismiss
      </button>
    </div>
  );
}
