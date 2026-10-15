export default function ListingSkeleton() {
  return <div className="listing-loading space-y-6 p-4 md:p-8" role="status" aria-label="Loading properties" aria-busy="true">
    <span className="sr-only">Loading properties…</span>
    <div aria-hidden="true" className="skeleton-surface h-8 w-64 rounded-lg" />
    <div aria-hidden="true" className="listing-skeleton-grid">
      {Array.from({ length: 6 }, (_, i) => <div key={i} className="overflow-hidden rounded-3xl border border-line bg-white">
        <div className="skeleton-surface h-56" />
        <div className="space-y-4 p-4"><div className="skeleton-surface h-6 w-28 rounded" /><div className="skeleton-surface h-4 w-3/4 rounded" /><div className="skeleton-surface h-4 w-1/2 rounded" /><div className="skeleton-surface h-11 rounded-xl" /></div>
      </div>)}
    </div>
  </div>;
}
