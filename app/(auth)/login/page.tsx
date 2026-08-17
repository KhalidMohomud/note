import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "./login-form";
import { getCurrentUser } from "@/lib/auth/session";

export default async function LoginPage() {
  if (await getCurrentUser()) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 text-slate-950">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-bold tracking-tight">Log in</h1>
        <p className="mt-2 text-slate-600">Continue to Welcome Notes.</p>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-slate-600">
          Need an account?{" "}
          <Link className="font-medium text-slate-950 underline" href="/register">
            Register
          </Link>
        </p>
      </section>
    </main>
  );
}
