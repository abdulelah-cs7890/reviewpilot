/**
 * Skeleton shown while /inbox is loading. Mirrors the real layout so the
 * transition is jump-free.
 */
export default function InboxLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="h-7 w-48 rounded bg-ink-100" />
          <div className="mt-2 h-4 w-32 rounded bg-ink-100" />
        </div>
        <div className="h-9 w-28 rounded-xl bg-ink-100" />
      </div>

      <div className="mb-6 h-32 rounded-2xl bg-white ring-1 ring-ink-100" />

      <ul className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <li key={i} className="rounded-2xl border border-ink-100 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex gap-2">
                  <div className="h-4 w-20 rounded bg-ink-100" />
                  <div className="h-4 w-16 rounded bg-ink-100" />
                  <div className="h-4 w-14 rounded-full bg-ink-100" />
                </div>
                <div className="h-4 w-full rounded bg-ink-100" />
                <div className="h-4 w-3/4 rounded bg-ink-100" />
              </div>
              <div className="h-3 w-12 rounded bg-ink-100" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
