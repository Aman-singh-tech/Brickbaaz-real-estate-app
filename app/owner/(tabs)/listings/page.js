import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OwnerPropertyCard from "@/components/OwnerPropertyCard";
import { Card, Icon, btn, cx } from "@/components/ui";

export const metadata = { title: "Listings" };

const FILTERS = [["all", "All"], ["ACTIVE", "Active"], ["DRAFT", "Drafts"], ["PAUSED", "Paused"], ["done", "Rented / Sold"]];

export default async function Listings({ searchParams }) {
  const owner = await requireOwner();
  const { f = "all" } = await searchParams;
  const where = { ownerId: owner.id, ...(f === "done" ? { status: { in: ["RENTED", "SOLD"] } } : f !== "all" ? { status: f } : {}) };
  const [props, counts] = await Promise.all([
    prisma.property.findMany({ where, orderBy: { updatedAt: "desc" } }),
    prisma.inquiry.groupBy({ by: ["propertyId"], where: { property: { ownerId: owner.id } }, _count: { _all: true } }),
  ]);
  const byProp = Object.fromEntries(counts.map((c) => [c.propertyId, c._count._all]));
  return (
    <div className="space-y-4 px-4 pb-8 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-extrabold tracking-tight">Listings</h1>
        <Link href="/owner/post" className={btn("brand", "!px-3.5 !py-2 text-xs")}><Icon name="plus" className="h-4 w-4" />Add new</Link>
      </div>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {FILTERS.map(([v, l]) => (
          <Link key={v} href={`/owner/listings?f=${v}`} className={cx("shrink-0 rounded-full px-3.5 py-2 text-xs font-bold", f === v ? "bg-navy text-white" : "bg-white ring-1 ring-line")}>{l}</Link>
        ))}
      </div>
      {props.length === 0 ? <Card className="py-12 text-center text-sm text-mute">Nothing here.</Card> : props.map((p) => <OwnerPropertyCard key={p.id} p={p} inquiries={byProp[p.id] ?? 0} />)}
    </div>
  );
}
