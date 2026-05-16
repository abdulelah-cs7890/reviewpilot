export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-7 w-40 rounded bg-ink-100" />
          <div className="mt-2 h-4 w-56 rounded bg-ink-100" />
        </div>
        <div className="h-9 w-28 rounded-xl bg-ink-100" />
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-ink-100 bg-white p-5">
            <div className="mb-2 h-3 w-20 rounded bg-ink-100" />
            <div className="h-8 w-16 rounded bg-ink-100" />
            <div className="mt-2 h-3 w-24 rounded bg-ink-100" />
          </div>
        ))}
      </div>

      {/* Sentiment chart */}
      <section className="mb-6 rounded-3xl border border-ink-100 bg-white p-6">
        <div className="mb-2 h-4 w-32 rounded bg-ink-100" />
        <div className="mb-4 h-3 w-64 rounded bg-ink-100" />
        <div className="h-56 w-full rounded-xl bg-ink-100" />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-3xl border border-ink-100 bg-white p-6 lg:col-span-2">
          <div className="mb-2 h-4 w-32 rounded bg-ink-100" />
          <div className="mb-4 h-3 w-64 rounded bg-ink-100" />
          <div className="h-72 w-full rounded-xl bg-ink-100" />
        </section>
        <section className="rounded-3xl border border-ink-100 bg-white p-6">
          <div className="mb-2 h-4 w-28 rounded bg-ink-100" />
          <div className="mb-4 h-3 w-48 rounded bg-ink-100" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <div className="mb-1 h-3 w-full rounded bg-ink-100" />
                <div className="h-3 w-full rounded-full bg-ink-100" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
