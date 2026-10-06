export default function Loading() {
  return <div role="status" aria-label="Loading owner workspace" className="space-y-6 p-6"><p className="text-sm text-mute">Opening your workspace…</p><div className="h-40 animate-pulse rounded-3xl bg-fill" /><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((n) => <div key={n} className="h-32 animate-pulse rounded-2xl bg-fill" />)}</div></div>;
}
