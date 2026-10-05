export const dynamic = "force-dynamic";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  projectInclude,
  projectWhere,
  priceOf,
} from "@/lib/projects";
import { Card, inputCls, btn } from "@/components/ui";
import ProjectMap from "@/components/projects/ProjectMap";
import { formatInr } from "@/lib/format";
import ProjectCard from "@/components/projects/ProjectCard";
import { CUSTOMER_CITIES, DEFAULT_CITY } from "@/lib/city";
export const metadata = { title: "Builder projects" };
export default async function Projects({ searchParams }) {
  const sp = { ...(await searchParams), city: DEFAULT_CITY },
    where = projectWhere(sp),
    limit = Math.min(100, Math.max(12, Number(sp.limit) || 12));
  const cities = CUSTOMER_CITIES;
  const [raw, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: projectInclude,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      ...(sp.sort === "price" ? {} : { take: limit }),
    }),
    prisma.project.count({ where }),
  ]);
  const items =
    sp.sort === "price"
      ? raw
          .sort((a, b) => (priceOf(a) ?? Infinity) - (priceOf(b) ?? Infinity))
          .slice(0, limit)
      : raw;
  return (
    <div className="space-y-4 p-4">
      <div>
        <p className="text-xs font-bold text-brand">NEW DEVELOPMENTS</p>
        <h1 className="text-2xl font-extrabold">Builder projects</h1>
        <p className="text-sm text-mute">
          Discover projects across cities. {total} matches.
        </p>
      </div>
      <Card>
        <form className="grid grid-cols-2 gap-3">
          <input
            name="q"
            defaultValue={sp.q}
            placeholder="Project, builder or locality"
            aria-label="Project search"
            className={`${inputCls} col-span-2`}
          />
          <select
            name="city"
            defaultValue={sp.city || ""}
            aria-label="City"
            className={inputCls}
          >
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            name="bhk"
            defaultValue={sp.bhk || ""}
            aria-label="BHK"
            className={inputCls}
          >
            <option value="">Any BHK</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} BHK
              </option>
            ))}
          </select>
          <input
            name="min"
            type="number"
            min="0"
            defaultValue={sp.min}
            placeholder="Min budget (INR)"
            aria-label="Minimum budget"
            className={inputCls}
          />
          <input
            name="max"
            type="number"
            min="0"
            defaultValue={sp.max}
            placeholder="Max budget (INR)"
            aria-label="Maximum budget"
            className={inputCls}
          />
          <select
            name="possession"
            defaultValue={sp.possession || ""}
            aria-label="Possession"
            className={inputCls}
          >
            <option value="">Any possession</option>
            <option value="READY">Ready to move</option>
            <option value="UNDER_CONSTRUCTION">Under construction</option>
            <option value="NEW_LAUNCH">New launch</option>
          </select>
          <select
            name="sort"
            defaultValue={sp.sort || "new"}
            aria-label="Sort"
            className={inputCls}
          >
            <option value="new">Featured / newest</option>
            <option value="price">Lowest starting price</option>
          </select>
          <button className={btn("primary")}>Search projects</button>
          <Link href="/projects" className={btn("soft")}>
            Reset
          </Link>
        </form>
      </Card>
      <Link
        href={`/projects?${new URLSearchParams({ ...sp, view: sp.view === "map" ? "list" : "map" })}`}
        className={btn("soft", "w-full")}
      >
        {sp.view === "map" ? "List view" : "Map view"}
      </Link>
      {sp.view === "map" && (
        <ProjectMap
          markers={items
            .filter((p) => p.lat != null && p.lng != null)
            .map((p) => ({
              id: p.id,
              lat: p.lat,
              lng: p.lng,
              label: priceOf(p) ? formatInr(priceOf(p)) : "On request",
              href: `/projects/${p.slug}`,
            }))}
        />
      )}
      <Link href="/projects/compare" className={btn("soft", "w-full")}>
        Compare projects
      </Link>
      {!items.length && <Card>No published projects match these filters.</Card>}
      {items.map((p) => (
        <ProjectCard key={p.id} project={p} />
      ))}
      {total > limit && (
        <Link
          href={`/projects?${new URLSearchParams({ ...sp, limit: String(limit + 12) })}`}
          className={btn("soft", "w-full")}
        >
          Load more
        </Link>
      )}
    </div>
  );
}
