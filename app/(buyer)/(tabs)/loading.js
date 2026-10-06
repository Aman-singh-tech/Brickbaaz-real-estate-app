export default function Loading() {
  return <div role="status" aria-label="Loading properties" className="space-y-6 p-6"><p className="text-sm text-mute">Finding your next address…</p><div className="h-56 animate-pulse rounded-3xl bg-fill" /><div className="grid gap-5 md:grid-cols-3">{[0, 1, 2].map((n) => <div key={n} className="h-64 animate-pulse rounded-2xl bg-fill" />)}</div></div>;
}
