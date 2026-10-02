import Link from "next/link";
import { notFound } from "next/navigation";
import BackBar from "@/components/BackBar";
import Chat from "@/components/Chat";
import { requireBuyer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDateTime } from "@/lib/format";
import { sendBuyerMessage } from "@/app/actions/buyer";

export const metadata = { title: "Conversation" };

export default async function Thread({ params }) {
  const { id } = await params;
  const user = await requireBuyer(`/inquiries/${id}`);
  const inq = Number(id)
    ? await prisma.inquiry.findUnique({ where: { id: Number(id) }, include: { property: true, messages: { orderBy: { createdAt: "asc" } } } })
    : null;
  if (!inq || inq.userId !== user.id) notFound();
  return (
    <>
      <BackBar title="Owner desk" fallback="/inquiries" />
      <div className="border-b border-line bg-white px-4 py-3">
        <Link href={`/property/${inq.propertyId}`} className="block text-[13px] font-extrabold leading-snug">{inq.property.title}</Link>
        {inq.visitAt && <p className="text-xs font-bold text-brand">Visit: {fmtDateTime(inq.visitAt)}{inq.handled ? " · Confirmed" : " · Awaiting confirmation"}</p>}
        {inq.kind === "CALLBACK" && <p className="text-xs text-mute">Callback requested on +91 {inq.phone}</p>}
      </div>
      <Chat inquiryId={inq.id} me="BUYER" send={sendBuyerMessage} messages={inq.messages.map((m) => ({ id: m.id, sender: m.sender, body: m.body, createdAt: m.createdAt.toISOString() }))} />
    </>
  );
}
