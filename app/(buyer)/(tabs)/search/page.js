import { Suspense } from "react";
import Link from "next/link";
import { getPurpose, getCity } from "@/components/TopBar";
import PropertyCard, { Cover } from "@/components/PropertyCard";
import FilterSheet from "@/components/FilterSheet";
import SearchToolbar from "@/components/SearchToolbar";
import ResultsMap from "@/components/ResultsMap";
import SaveButton from "@/components/SaveButton";
import { Card, btn } from "@/components/ui";
import { parseFilters, searchProperties, savedIds, PAGE } from "@/lib/properties";
import { formatPrice, bhkLabel } from "@/lib/format";
import { DEFAULT_CITY } from "@/lib/city";
import { getBuyer } from "@/lib/auth";

export const metadata = { title: "Search properties" };

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams;
  const [purpose, cookieCity, user] = await Promise.all([getPurpose(), getCity(), getBuyer()]);
  const f = parseFilters({ ...sp, city: DEFAULT_CITY }, { p: purpose, city: cookieCity });
  const view = sp.view === "grid" || sp.view === "map" ? sp.view : "list";
  const { items, total } = await searchProperties(view === "map" ? { ...f, limit: 100 } : f);
  const saved = await savedIds(user?.id);

  const more = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string"));
  more.set("limit", String(f.limit + PAGE));

  return (
    <div className="space-y-3 px-4 pb-8 pt-4">
      <div className="flex items-end justify-between gap-2">
        <h1 className="text-[22px] font-extrabold tracking-tight">{f.city || "All cities"} {f.purpose === "RENT" ? "Rentals" : "Properties"}</h1>
        <span className="pb-1 text-xs font-semibold text-mute">{total} listings</span>
      </div>
      <Suspense>
        <FilterSheet count={total} />
        <SearchToolbar />
      </Suspense>

      {view === "map" ? (
        <ResultsMap items={items} />
      ) : items.length === 0 ? (
        <Card className="space-y-3 py-12 text-center">
          <p className="text-base font-extrabold">No properties match</p>
          <p className="text-sm text-mute">Try removing a filter or searching another city.</p>
          <Link href={`/search?p=${f.purpose === "RENT" ? "rent" : "sale"}&city=`} className={btn("primary", "mx-auto")}>
            Clear filters
          </Link>
        </Card>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3">
          {items.map((p) => (
            <div key={p.id} className="relative overflow-hidden rounded-2xl border border-line bg-white">
              <div className="absolute right-2 top-2 z-10">
                <SaveButton propertyId={p.id} initial={saved.has(p.id)} className="!h-8 !w-8" />
              </div>
              <Link href={`/property/${p.id}`} className="block">
                <Cover property={p} className="h-28 !rounded-none" />
                <div className="p-2.5">
                  <p className="text-[15px] font-extrabold">{formatPrice(p)}{p.purpose === "RENT" && <span className="text-[10px] text-mute">/mo</span>}</p>
                  <p className="truncate text-xs font-bold">{p.title}</p>
                  <p className="truncate text-[11px] text-mute">{bhkLabel(p)} · {p.locality}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="property-grid space-y-4">
          {items.map((p) => (
            <PropertyCard key={p.id} property={p} saved={saved.has(p.id)} />
          ))}
        </div>
      )}

      {view !== "map" && items.length < total && (
        <Link href={`/search?${more}`} scroll={false} className={btn("soft", "w-full")}>
          Load more ({total - items.length} more)
        </Link>
      )}
    </div>
  );
}
