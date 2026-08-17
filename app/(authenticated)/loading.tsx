export default function AuthenticatedLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading"
      className="mx-auto max-w-4xl animate-pulse px-6 py-12"
    >
      <div className="h-9 w-48 rounded bg-slate-200" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="h-28 rounded-xl bg-slate-200" />
        <div className="h-28 rounded-xl bg-slate-200" />
      </div>
    </main>
  );
}
