import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-950">
      <section className="w-full max-w-xl text-center">
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Welcome Notes
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-600">
          Sign in or create an account to
          continue.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white"
            href="/login"
          >
            Log in
          </Link>
          <Link
            className="rounded-lg border border-slate-300 px-4 py-2 font-medium"
            href="/register"
          >
            Register
          </Link>
        </div>
      </section>
    </main>
  );
}
