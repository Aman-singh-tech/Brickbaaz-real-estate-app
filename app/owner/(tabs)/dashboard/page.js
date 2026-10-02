import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OwnerPropertyCard from "@/components/OwnerPropertyCard";
import InquiryRow from "@/components/InquiryRow";
import { Card, Icon, Pill, SectionTitle, btn } from "@/components/ui";

export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const owner = await requireOwner();
  const mine = { property: { ownerId: owner.id } };
  const [props, counts, totalInq, newInq, visits, recent] = await Promise.all([
    prisma.property.findMany({ where: { ownerId: owner.id }, orderBy: { updatedAt: "desc" }, take: 4 }),
    prisma.inquiry.groupBy({ by: ["propertyId"], where: mine, _count: { _all: true } }),
    prisma.inquiry.count({ where: mine }),
    prisma.inquiry.count({ where: { ...mine, handled: false } }),
    prisma.inquiry.count({ where: { ...mine, kind: "VISIT", visitAt: { gte: new Date() } } }),
    prisma.inquiry.findMany({
      where: mine,
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { user: true, property: { select: { title: true } }, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
  ]);
  const active = await prisma.property.count({ where: { ownerId: owner.id, status: "ACTIVE" } });
  const total = await prisma.property.count({ where: { ownerId: owner.id } });
  const byProp = Object.fromEntries(counts.map((c) => [c.propertyId, c._count._all]));
  const promo = props.find((p) => p.status === "ACTIVE" && !p.featured);

  return (
    <div className="space-y-5 px-4 pb-8 pt-4">
      <Card className="flex items-center gap-3.5">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-brand text-xl font-extrabold text-white">{(owner.name?.[0] ?? "O").toUpperCase()}</span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-base font-extrabold">{owner.name}</p>
          <p className="text-xs text-mute">Property owner / landlord</p>
          <Pill tone="ok">✔ Owner account</Pill>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2.5">
        {[["Active", active, "/owner/listings", "home"], ["Inquiries", totalInq, "/owner/inquiries", "chat"], ["Visits", visits, "/owner/inquiries?f=visits", "cal"]].map(([l, n, h, ic]) => (
          <Link key={l} href={h} className="rounded-2xl border border-line bg-white p-3 text-center">
            <Icon name={ic} className="mx-auto mb-1 h-5 w-5 text-brand" />
            <p className="text-2xl font-extrabold">{n}</p>
            <p className="text-[11px] font-semibold text-mute">{l}</p>
          </Link>
        ))}
      </div>
      {newInq > 0 && (
        <Link href="/owner/inquiries" className="flex items-center justify-between rounded-2xl bg-brand-soft px-4 py-3 text-[13px] font-bold text-brand">
          {newInq} new inquir{newInq > 1 ? "ies" : "y"} waiting for a reply <Icon name="back" className="h-4 w-4 rotate-180" />
        </Link>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold">My properties <Pill tone="soft">{total}</Pill></h2>
          <Link href="/owner/post" className={btn("brand", "!px-3.5 !py-2 text-xs")}><Icon name="plus" className="h-4 w-4" />Add new</Link>
        </div>
        {props.length === 0 ? (
          <Card className="space-y-3 py-10 text-center">
            <p className="text-sm text-mute">No properties yet. Post your first listing in 3 steps.</p>
            <Link href="/owner/post" className={btn("brand", "mx-auto")}>Post a property</Link>
          </Card>
        ) : (
          props.map((p) => <OwnerPropertyCard key={p.id} p={p} inquiries={byProp[p.id] ?? 0} />)
        )}
        {total > props.length && <Link href="/owner/listings" className={btn("soft", "w-full")}>View all {total} listings</Link>}
      </section>

      <section className="space-y-2">
        <SectionTitle action={`View all ${totalInq}`} href="/owner/inquiries">Recent inquiries</SectionTitle>
        <Card className="divide-y divide-line !py-0">
          {recent.length === 0 ? <p className="py-8 text-center text-sm text-mute">Inquiries from buyers will appear here.</p> : recent.map((i) => <InquiryRow key={i.id} i={i} last={i.messages[0]?.body} />)}
        </Card>
      </section>

      {promo && (
        <Card className="flex items-center gap-3 !bg-brand-soft">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-extrabold">Boost “{promo.title.slice(0, 28)}”</p>
            <p className="text-[11.5px] text-mute">Show it first on Explore and search.</p>
          </div>
          <Link href="/owner/listings" className={btn("brand", "!px-3.5 !py-2 text-xs")}>Promote</Link>
        </Card>
      )}
    </div>
  );
}
