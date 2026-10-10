import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { after } from "next/server";
import BackBar from "@/components/BackBar";
import Gallery from "@/components/Gallery";
import SaveButton from "@/components/SaveButton";
import DetailActions from "@/components/DetailActions";
import ShareButton from "@/components/ShareButton";
import MiniMap from "@/components/MiniMap";
import InterestForm from "@/components/InterestForm";
import { Card, Icon, Pill, SectionTitle } from "@/components/ui";
import { getProperty } from "@/lib/properties";
import { prisma } from "@/lib/prisma";
import { businessInfo } from "@/lib/business";
import { getBuyer, getOwner } from "@/lib/auth";
import {
  emi,
  formatInr,
  formatPrice,
  perSqft,
  TYPE_LABEL,
  cityLabel,
} from "@/lib/format";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const p = Number(id) ? await getProperty(Number(id)) : null;
  if (!p || !["ACTIVE", "SOLD", "RENTED"].includes(p.status))
    return { title: "Property unavailable", robots: { index: false, follow: false } };
  const description = `${TYPE_LABEL[p.type]} ${p.purpose === "RENT" ? "for rent" : "for sale"} in ${[p.locality, p.city].filter(Boolean).join(", ")}. ${formatPrice(p)}${p.superArea ? ` · ${p.superArea} sq.ft` : ""}. View photos, property details and enquire with Brickbaaz.`;
  return {
    ...pageMetadata(p.title, description, `/property/${p.id}`, p.media.find(m => m.kind === "IMAGE")?.url || "/hero.jpg"),
    ...(p.status !== "ACTIVE" ? { robots: { index: false, follow: true } } : {}),
  };
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-3.5">
      <p className="text-[11px] font-semibold text-mute">{label}</p>
      <p className="mt-0.5 text-[15px] font-extrabold leading-tight">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-mute">{sub}</p>}
    </div>
  );
}

export default async function PropertyPage({ params, searchParams }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const pid = Number(id);
  if (!pid) notFound();
  const [p, user, owner] = await Promise.all([
    getProperty(pid),
    getBuyer(),
    getOwner(),
  ]);
  if (
    !p ||
    (p.status !== "ACTIVE" &&
      p.status !== "RENTED" &&
      p.status !== "SOLD" &&
      !owner)
  )
    notFound();
  if (!owner)
    after(() =>
      prisma.property
        .update({ where: { id: pid }, data: { views: { increment: 1 } } })
        .catch(() => {}),
    );

  const saved = user
    ? !!(await prisma.saved.findUnique({
        where: { userId_propertyId: { userId: user.id, propertyId: pid } },
      }))
    : false;
  const deskPhone = businessInfo().phone.number.slice(-10);
  const unavailable = p.status === "RENTED" || p.status === "SOLD";
  const sq = perSqft(p);
  const monthly =
    p.purpose === "SALE" ? Math.round(emi(p.price * 0.8, 8.45, 20)) : null;
  const nearby = Array.isArray(p.nearby) ? p.nearby : [];
  const hasVideo = p.media.some((m) => m.kind === "VIDEO");
  const stat = [
    p.superArea && [
      "Super built-up",
      `${p.superArea.toLocaleString("en-IN")} sq.ft`,
      p.carpetArea ? `Carpet: ${p.carpetArea.toLocaleString("en-IN")}` : null,
    ],
    (p.bedrooms || p.bathrooms) && [
      "Bedrooms & baths",
      [
        p.bedrooms && `${p.bedrooms} Beds`,
        p.bathrooms && `${p.bathrooms} Baths`,
      ]
        .filter(Boolean)
        .join(" • "),
      p.balconies
        ? `${p.balconies} balcon${p.balconies > 1 ? "ies" : "y"}`
        : null,
    ],
    p.floor != null && [
      "Floor position",
      `${p.floor}${p.totalFloors ? ` of ${p.totalFloors}` : ""}`,
      p.facing ? `${p.facing} facing` : null,
    ],
    !p.superArea &&
      p.carpetArea && [
        "Carpet area",
        `${p.carpetArea.toLocaleString("en-IN")} sq.ft`,
      ],
    p.facing && p.floor == null && ["Facing", p.facing],
  ].filter(Boolean);

  return (
    <>
      <BackBar
        title="Property Details"
        right={<ShareButton title={p.title} />}
      />
      <div className="flex-1 pb-4">
        <Gallery media={p.media} title={p.title}>
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {p.reraId && <Pill tone="ok">RERA {p.reraId}</Pill>}
            {hasVideo && (
              <Pill tone="dark">
                <Icon name="play" className="mr-1 h-3 w-3" />
                VIDEO TOUR
              </Pill>
            )}
          </div>
          <div className="absolute right-3 top-3">
            <SaveButton propertyId={p.id} initial={saved} />
          </div>
        </Gallery>

        <div className="space-y-5 px-4 pt-4">
          <section className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {unavailable ? (
                <Pill tone="dark">{p.status}</Pill>
              ) : p.possession === "READY" ? (
                <Pill tone="soft">Ready to Move</Pill>
              ) : p.possession ? (
                <Pill tone="brand">
                  {p.possessionBy
                    ? `Possession ${p.possessionBy}`
                    : "Under Construction"}
                </Pill>
              ) : null}
              <Pill tone="soft">{TYPE_LABEL[p.type]}</Pill>
            </div>
            <h1 className="text-[22px] font-extrabold leading-tight tracking-tight">
              {p.title}
            </h1>
            <p className="flex items-start gap-1.5 text-[13px] text-mute">
              <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0" />
              {[p.society, p.locality, cityLabel(p.city, p.state)]
                .filter(Boolean)
                .join(", ")}
            </p>
          </section>

          <Card className="space-y-3 !bg-fill/60">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-[26px] font-extrabold tracking-tight">
                {formatPrice(p)}
                {p.purpose === "RENT" && (
                  <span className="text-sm font-semibold text-mute">
                    /month
                  </span>
                )}
              </span>
              {sq && <span className="text-xs text-mute">{sq}</span>}
              {p.negotiable && <Pill tone="soft">Negotiable</Pill>}
            </div>
            {p.deposit != null && (
              <p className="text-xs text-mute">
                Security deposit{" "}
                <b className="text-ink">{formatInr(p.deposit)}</b>
              </p>
            )}
            {monthly && (
              <Link
                href={`/property/${p.id}/emi`}
                className="flex items-center gap-3 rounded-xl bg-white p-3"
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-fill">
                  <Icon name="calc" className="h-[18px] w-[18px]" />
                </span>
                <span className="flex-1 text-[13px] font-bold">
                  EMI starts at {formatInr(monthly)}/month
                  <span className="block text-[11px] font-medium text-mute">
                    @ 8.45% for 20 yrs (20% down)
                  </span>
                </span>
                <Icon name="back" className="h-4 w-4 rotate-180 text-mute" />
              </Link>
            )}
          </Card>

          {stat.length > 0 && (
            <section className="space-y-3">
              <SectionTitle>Property overview</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                {stat.slice(0, 4).map(([l, v, s]) => (
                  <Stat key={l} label={l} value={v} sub={s} />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {[p.furnishing, p.facing && `${p.facing} facing`]
                  .filter(Boolean)
                  .map((t) => (
                    <Pill
                      key={t}
                      tone="soft"
                      className="!text-xs !px-3 !py-1.5"
                    >
                      {t}
                    </Pill>
                  ))}
              </div>
            </section>
          )}

          {p.description && (
            <Card className="space-y-1.5">
              <h2 className="text-[15px] font-extrabold">
                About this property
              </h2>
              <details className="group">
                <summary className="list-none">
                  <p className="line-clamp-3 whitespace-pre-line text-[13.5px] leading-relaxed text-mute group-open:line-clamp-none">
                    {p.description}
                  </p>
                  <span className="mt-1 inline-block cursor-pointer text-xs font-bold text-brand group-open:hidden">
                    Read more ⌄
                  </span>
                </summary>
              </details>
            </Card>
          )}

          {p.amenities.length > 0 && (
            <section className="space-y-3">
              <SectionTitle action={`${p.amenities.length} included`}>
                Amenities & lifestyle
              </SectionTitle>
              <div className="grid grid-cols-2 gap-2.5">
                {p.amenities.map((a) => (
                  <div
                    key={a}
                    className="flex items-center gap-2.5 rounded-2xl border border-line bg-white p-3 text-[12.5px] font-bold"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-fill">
                      <Icon name="check" className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 leading-tight">{a}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <SectionTitle action={p.locality}>Location & commute</SectionTitle>
            {p.lat != null && p.lng != null && (
              <div className="h-44 overflow-hidden rounded-2xl border border-line">
                <MiniMap pin={{ lat: p.lat, lng: p.lng }} interactive />
              </div>
            )}
            {nearby.length > 0 && (
              <div
                className={`grid gap-2.5 ${nearby.length === 1 ? "grid-cols-1" : nearby.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}
              >
                {nearby.map((n) => (
                  <div
                    key={n.label}
                    className="rounded-2xl border border-line bg-white p-3 text-center"
                  >
                    <p className="text-[15px] font-extrabold">{n.distance}</p>
                    <p className="text-[11px] text-mute">{n.label}</p>
                  </div>
                ))}
              </div>
            )}
            {p.lat != null && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs font-bold text-brand"
              >
                Open in Maps ↗
              </a>
            )}
          </section>

          <Card className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-ok text-white">
              <Icon name="check" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[13px] font-extrabold">Listed by Brickbaaz</p>
              <p className="text-[11.5px] text-mute">
                Direct from the owner · Posted{" "}
                {p.publishedAt
                  ? p.publishedAt.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })
                  : "recently"}{" "}
                · Phone verified
              </p>
            </div>
          </Card>
        </div>
      </div>

      {!unavailable && (
        <div id="interest" className="px-4 pb-6">
          <InterestForm
            type="PROPERTY"
            referenceId={p.id}
            title={p.title}
            source={sp.utm_source || "website"}
            campaign={sp.utm_campaign}
          />
        </div>
      )}
      {unavailable ? (
        <div className="sticky bottom-0 border-t border-line bg-white px-4 py-4 text-center text-sm font-bold text-mute">
          This property is {p.status.toLowerCase()}.{" "}
          <Link href="/search" className="text-brand">
            See similar homes
          </Link>
        </div>
      ) : (
        <DetailActions
          propertyId={p.id}
          title={p.title}
          ownerPhone={deskPhone}
          loggedIn={!!user}
          userPhone={user?.phone ?? ""}
          openVisit={sp.visit === "1"}
        />
      )}
    </>
  );
}
