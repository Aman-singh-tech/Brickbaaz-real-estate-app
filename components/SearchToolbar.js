"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Icon, cx } from "@/components/ui";

export default function SearchToolbar() {
  const router = useRouter();
  const sp = useSearchParams();
  const view = sp.get("view") ?? "list";
  const set = (k, v) => {
    const q = new URLSearchParams(sp.toString());
    if (v) q.set(k, v);
    else q.delete(k);
    if (k !== "limit") q.delete("limit");
    router.push(`/search?${q}`);
  };
  return (
    <div className="flex items-center gap-2">
      <label className="flex min-w-0 flex-1 items-center gap-1 rounded-xl border border-line bg-white px-3 py-2 text-xs">
        <span className="shrink-0 text-mute">Sort:</span>
        <select value={sp.get("sort") ?? "new"} onChange={(e) => set("sort", e.target.value)} aria-label="Sort" className="min-w-0 flex-1 bg-transparent font-bold outline-none">
          <option value="new">Newest first</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </label>
      {[["list", "list"], ["grid", "grid"], ["map", "map"]].map(([v, icon]) => (
        <button key={v} type="button" onClick={() => set("view", v === "list" ? "" : v)} aria-label={`${v} view`} aria-pressed={view === v} className={cx("grid h-9 w-9 place-items-center rounded-xl", view === v ? "bg-navy text-white" : "bg-white border border-line")}>
          <Icon name={icon} className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
