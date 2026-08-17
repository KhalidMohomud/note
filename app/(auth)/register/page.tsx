import Link from "next/link";
import { redirect } from "next/navigation";

import { RegisterForm } from "./register-form";
import { getCurrentUser } from "@/lib/auth/session";

export default async function RegisterPage() {
  if (await getCurrentUser()) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 text-slate-950">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-bold tracking-tight">Create account</h1>
        <p className="mt-2 text-slate-600">
          Register to use Welcome Notes.
        </p>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-slate-600">
          Already registered?{" "}
          <Link className="font-medium text-slate-950 underline" href="/login">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}
