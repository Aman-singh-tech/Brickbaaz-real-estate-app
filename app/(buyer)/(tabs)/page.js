import Link from "next/link";
import { getPurpose, getCity } from "@/components/TopBar";
import PropertyCard from "@/components/PropertyCard";
import { Card, Icon, Pill, SectionTitle, btn } from "@/components/ui";
import { CITIES, TYPE_LABEL, cityLabel } from "@/lib/format";
import { activeCities, categoryCounts, featured, savedIds } from "@/lib/properties";
import { getBuyer } from "@/lib/auth";

export const metadata = { title: "Explore homes" };

const CATS = [
  ["APARTMENT", "building"],
  ["VILLA", "home"],
  ["BUILDER_FLOOR", "list"],
  ["COMMERCIAL", "calc"],
  ["PLOT", "map"],
];

export default async function Explore() {
  const [purpose, city, user] = await Promise.all([getPurpose(), getCity(), getBuyer()]);
  const [counts, items, saved] = await Promise.all([
    categoryCounts(purpose === "rent" ? "RENT" : "SALE", city),
    featured(purpose === "rent" ? "RENT" : "SALE", city, 5),
    savedIds(user?.id),
  ]);
  const cities = await activeCities(CITIES.map((c) => c.name));
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 px-4 pb-8 pt-5">
      <section className="space-y-3">
        <Pill tone="brand">INDIA&apos;S ZERO-BROKERAGE REAL ESTATE APP</Pill>
        <h1 className="text-[28px] font-extrabold leading-[1.1] tracking-tight">Find your dream home in India</h1>
        <p className="text-sm text-mute">Explore verified-contact homes with zero brokerage and transparent pricing.</p>
      </section>

      <Card className="space-y-3 !p-4 shadow-sm">
        <form action="/search" className="space-y-3">
          <div className="grid grid-cols-2 rounded-xl bg-fill p-1 text-center text-[13px] font-bold">
            {[["sale", "Buy Properties"], ["rent", "Rent Homes"]].map(([v, l]) => (
              <label key={v} className="cursor-pointer rounded-lg py-2.5 has-[:checked]:bg-white has-[:checked]:shadow-sm">
                <input type="radio" name="p" value={v} defaultChecked={purpose === v} className="sr-only" />
                {l}
              </label>
            ))}
          </div>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-mute">Selected city</span>
            <select name="city" defaultValue={city} className="w-full rounded-xl border border-line bg-fill px-3.5 py-3 text-sm font-semibold">
              <option value="">All cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>{cityLabel(c)}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-mute">Locality, project or BHK</span>
            <input name="q" placeholder="e.g. Bandra West, 3 BHK, Whitefield" className="w-full rounded-xl border border-line bg-fill px-3.5 py-3 text-sm outline-none focus:border-navy" />
          </label>
          <button className={btn("primary", "w-full")}>
            <Icon name="search" className="h-4 w-4" /> Search Properties
          </button>
        </form>
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {[
            ["Ready to Move", `/search?p=${purpose}&poss=READY`],
            ["Near Metro", `/search?p=${purpose}&q=metro`],
            ["Under ₹1 Cr", `/search?p=${purpose}&max=10000000`],
          ].map(([l, h]) => (
            <Link key={l} href={h} className="shrink-0 rounded-full bg-fill px-3 py-1.5 text-[11.5px] font-semibold">
              {l}
            </Link>
          ))}
        </div>
      </Card>

      <section className="space-y-3">
        <SectionTitle action="View all →" href={`/search?p=${purpose}`}>Explore categories</SectionTitle>
        <div className="grid grid-cols-3 gap-2.5">
          {CATS.map(([t]) => (
            <Link key={t} href={`/search?p=${purpose}&type=${t}`} className="rounded-2xl border border-line bg-white p-3 text-center">
              <span className="mx-auto mb-1.5 grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
                <Icon name={t === "PLOT" ? "map" : t === "COMMERCIAL" ? "calc" : "home"} className="h-[18px] w-[18px]" />
              </span>
              <p className="text-xs font-extrabold">{TYPE_LABEL[t].split(" / ")[0]}</p>
              <p className="text-[10.5px] text-mute">{counts[t] ?? 0} listings</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2 rounded-3xl bg-navy p-4 text-white">
        <p className="col-span-3 flex items-center gap-2 text-sm font-extrabold">
          <Icon name="shield" className="h-4 w-4 text-brand" /> The Brickbaaz Guarantee
        </p>
        {[["Zero Brokerage", "Save up to 2%"], ["Direct Contact", "Owner desk"], ["Instant Visit", "Same-day slot"]].map(([a, b]) => (
          <div key={a} className="rounded-xl bg-white/10 p-2.5">
            <p className="text-[11.5px] font-bold">{a}</p>
            <p className="text-[10px] text-white/60">{b}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <SectionTitle action={`${total} live`}>Featured properties</SectionTitle>
        {items.length === 0 ? (
          <Card className="py-10 text-center text-sm text-mute">No listings in {city} yet. Try another city.</Card>
        ) : (
          items.map((p) => <PropertyCard key={p.id} property={p} saved={saved.has(p.id)} />)
        )}
        {items.length > 0 && (
          <Link href={`/search?p=${purpose}${city ? `&city=${encodeURIComponent(city)}` : ""}`} className={btn("soft", "w-full")}>
            See all properties
          </Link>
        )}
      </section>

      <Card className="flex items-center gap-3 !bg-brand-soft">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-brand">
          <Icon name="pin" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-extrabold">Need a free site cab?</p>
          <p className="text-[11.5px] text-mute">We pick you up and drop you home.</p>
        </div>
        <Link href="/search" className={btn("primary", "!px-3 !py-2 text-xs")}>Book Cab</Link>
      </Card>

      <footer className="space-y-3 text-xs text-mute">
        <p className="text-sm font-extrabold text-ink">Brickbaaz Real Estate</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {cities.slice(0, 12).map((c) => (
            <Link key={c} href={`/search?city=${encodeURIComponent(c)}`}>{c}</Link>
          ))}
        </div>
        <div className="flex gap-4">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
        <p>© {new Date().getFullYear()} Brickbaaz Technologies Pvt Ltd.</p>
      </footer>
    </div>
  );
}
