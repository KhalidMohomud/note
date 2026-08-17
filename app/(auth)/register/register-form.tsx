"use client";

import { useActionState } from "react";

import { registerAction } from "@/app/actions/auth";
import type { AuthActionState } from "@/lib/auth/validation";

const initialState: AuthActionState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div>
        <label className="block text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          aria-describedby="email-error"
          autoComplete="email"
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
          id="email"
          name="email"
          required
          type="email"
        />
        <p className="mt-1 text-sm text-red-700" id="email-error">
          {state.errors?.email?.[0]}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          aria-describedby="password-error"
          autoComplete="new-password"
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
          id="password"
          minLength={8}
          name="password"
          required
          type="password"
        />
        <p className="mt-1 text-sm text-red-700" id="password-error">
          {state.errors?.password?.[0]}
        </p>
      </div>

      {state.message ? (
        <p aria-live="polite" className="text-sm text-red-700">
          {state.message}
        </p>
      ) : null}

      <button
        className="w-full rounded-lg bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
