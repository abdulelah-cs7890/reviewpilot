export default function ReviewDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse">
      <div className="mb-6 h-4 w-32 rounded bg-ink-100" />

      {/* Review section */}
      <section className="mb-6 rounded-3xl border border-ink-100 bg-white p-6 sm:p-8">
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="h-4 w-24 rounded bg-ink-100" />
          <div className="h-4 w-20 rounded bg-ink-100" />
          <div className="h-4 w-14 rounded-full bg-ink-100" />
          <div className="h-4 w-16 rounded-full bg-ink-100" />
        </div>
        <div className="space-y-2">
          <div className="h-5 w-full rounded bg-ink-100" />
          <div className="h-5 w-5/6 rounded bg-ink-100" />
          <div className="h-5 w-2/3 rounded bg-ink-100" />
        </div>
      </section>

      {/* Draft section */}
      <section className="rounded-3xl border border-accent/30 bg-accent/5 p-6 sm:p-8">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-4 w-28 rounded bg-ink-100" />
          <div className="h-9 w-36 rounded-xl bg-ink-100" />
        </div>
        <div className="h-36 w-full rounded-2xl bg-white" />
        <div className="mt-3 flex gap-2">
          <div className="h-9 w-20 rounded-xl bg-ink-100" />
          <div className="h-9 w-28 rounded-xl bg-ink-100" />
          <div className="h-9 w-24 rounded-xl bg-ink-100" />
        </div>
      </section>
    </div>
  );
}
