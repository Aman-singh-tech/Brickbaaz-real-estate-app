import Link from "next/link";
import { Icon, Pill, cx, btn } from "@/components/ui";
import SaveButton from "@/components/SaveButton";
import { imgUrl, ordinal, bhkLabel, emi, formatInr, formatPrice, perSqft, TYPE_LABEL } from "@/lib/format";

export function Cover({ property, className, children }) {
  const img = property.media?.find((m) => m.kind === "IMAGE");
  return (
    <div className={cx("relative overflow-hidden rounded-2xl bg-gradient-to-br from-fill to-[#d7dcec]", className)}>
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imgUrl(img.url, 640)} alt={property.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-mute/60">
          <Icon name="home" className="h-10 w-10" />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
      {children}
    </div>
  );
}

function badgeFor(p) {
  if (p.featured) return <Pill tone="brand">★ FEATURED</Pill>;
  if (p.possession === "UNDER_CONSTRUCTION") return <Pill tone="brand">{p.possessionBy ? `${p.possessionBy.toUpperCase()} POSSESSION` : "UNDER CONSTRUCTION"}</Pill>;
  return <Pill tone="ok">ZERO BROKERAGE</Pill>;
}

export default function PropertyCard({ property: p, saved = false, compact = false }) {
  const price = formatPrice(p);
  const sq = perSqft(p);
  const facts = [
    bhkLabel(p),
    p.superArea ? `${p.superArea.toLocaleString("en-IN")} sq.ft` : null,
    p.possession === "READY" ? "Ready to Move" : null,
    p.furnishing,
  ].filter(Boolean);
  const monthly = p.purpose === "SALE" && p.price >= 1e6 ? Math.round(emi(p.price * 0.8, 8.45, 20)) : null;

  return (
    <article className="relative overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
      <div className="absolute right-5 top-5 z-10">
        <SaveButton propertyId={p.id} initial={saved} />
      </div>
      <Link href={`/property/${p.id}`} className="block p-2.5 pb-0">
        <Cover property={p} className={compact ? "h-36" : "h-48"}>
          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">{badgeFor(p)}</div>
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-semibold text-white">
            <span className="truncate">{p.floor && p.totalFloors ? `${ordinal(p.floor)} of ${p.totalFloors} floors` : TYPE_LABEL[p.type]}</span>
            {p.possession === "READY" && <span>Ready to Move</span>}
          </div>
        </Cover>
      </Link>
      <div className="px-4 pb-4 pt-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xl font-extrabold tracking-tight">
            {price}
            {p.purpose === "RENT" && <span className="text-xs font-semibold text-mute">/mo</span>}
          </span>
          {sq && <span className="text-[11px] text-mute">{sq}</span>}
        </div>
        <Link href={`/property/${p.id}`} className="mt-0.5 block text-[15px] font-bold leading-snug">
          {p.title}
        </Link>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-mute">
          <Icon name="pin" className="h-3.5 w-3.5" />
          <span className="truncate">{[p.society, p.locality, p.city].filter(Boolean).join(", ")}</span>
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {facts.map((f) => (
            <Pill key={f} tone="soft" className="!text-[11px] !font-semibold">{f}</Pill>
          ))}
        </div>
        <div className="mt-3.5 flex items-center gap-2">
          <span className="min-w-0 flex-1 text-[11.5px] text-mute">
            {monthly ? <>Est. EMI <b className="text-ink">{formatInr(monthly)}/mo</b></> : p.deposit ? <>Deposit <b className="text-ink">{formatInr(p.deposit)}</b></> : null}
          </span>
          <Link href={`/property/${p.id}?visit=1`} className={btn("soft", "!px-3.5 !py-2.5")}>
            Book Visit
          </Link>
          <Link href={`/property/${p.id}`} className={btn("primary", "!px-3.5 !py-2.5")}>
            View Details →
          </Link>
        </div>
      </div>
    </article>
  );
}
