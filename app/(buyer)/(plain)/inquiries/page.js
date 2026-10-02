import Link from "next/link";
import BackBar from "@/components/BackBar";
import { Card, Pill, btn } from "@/components/ui";
import { requireBuyer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDateTime, timeAgo } from "@/lib/format";

export const metadata = { title: "My inquiries" };

const KIND = { VISIT: "Visit request", CALLBACK: "Callback request", MESSAGE: "Message" };

export default async function Inquiries() {
  const user = await requireBuyer("/inquiries");
  const items = await prisma.inquiry.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { property: { select: { title: true, locality: true, city: true } }, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return (
    <>
      <BackBar title="My inquiries & visits" fallback="/profile" />
      <div className="space-y-3 px-4 pb-8 pt-4">
        {items.length === 0 ? (
          <Card className="space-y-3 py-12 text-center">
            <p className="text-sm text-mute">You haven&apos;t contacted any owner yet.</p>
            <Link href="/search" className={btn("primary", "mx-auto")}>Browse properties</Link>
          </Card>
        ) : (
          items.map((i) => (
            <Link key={i.id} href={`/inquiries/${i.id}`} className="block">
              <Card className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Pill tone={i.kind === "VISIT" ? "brand" : "soft"}>{KIND[i.kind]}</Pill>
                  <span className="text-[11px] text-mute">{timeAgo(i.updatedAt)}</span>
                </div>
                <p className="text-[14px] font-extrabold leading-snug">{i.property.title}</p>
                <p className="text-xs text-mute">{i.property.locality}, {i.property.city}</p>
                {i.visitAt && <p className="text-xs font-bold text-brand">Visit: {fmtDateTime(i.visitAt)}{i.handled ? " · Confirmed" : " · Awaiting confirmation"}</p>}
                {i.messages[0] && <p className="truncate text-xs text-mute">“{i.messages[0].body}”</p>}
              </Card>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
