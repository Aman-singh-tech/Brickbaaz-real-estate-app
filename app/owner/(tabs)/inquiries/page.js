import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import InquiryRow from "@/components/InquiryRow";
import { Card, cx } from "@/components/ui";

export const metadata = { title: "Inquiries" };

const FILTERS = [["all", "All"], ["new", "New"], ["visits", "Visits"], ["callbacks", "Callbacks"]];

export default async function OwnerInquiries({ searchParams }) {
  const owner = await requireOwner();
  const { f = "all" } = await searchParams;
  const where = {
    property: { ownerId: owner.id },
    ...(f === "new" ? { handled: false } : f === "visits" ? { kind: "VISIT" } : f === "callbacks" ? { kind: "CALLBACK" } : {}),
  };
  const items = await prisma.inquiry.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { user: true, property: { select: { title: true } }, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return (
    <div className="space-y-4 px-4 pb-8 pt-4">
      <h1 className="text-[22px] font-extrabold tracking-tight">Inquiries <span className="text-base text-mute">({items.length})</span></h1>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {FILTERS.map(([v, l]) => (
          <Link key={v} href={`/owner/inquiries?f=${v}`} className={cx("shrink-0 rounded-full px-3.5 py-2 text-xs font-bold", f === v ? "bg-navy text-white" : "bg-white ring-1 ring-line")}>{l}</Link>
        ))}
      </div>
      <Card className="divide-y divide-line !py-0">
        {items.length === 0 ? <p className="py-12 text-center text-sm text-mute">No inquiries yet.</p> : items.map((i) => <InquiryRow key={i.id} i={i} last={i.messages[0]?.body} />)}
      </Card>
    </div>
  );
}
