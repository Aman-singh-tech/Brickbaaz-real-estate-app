import { notFound } from "next/navigation";
import Link from "next/link";
import BackBar from "@/components/BackBar";
import Chat from "@/components/Chat";
import HandledToggle from "@/components/HandledToggle";
import { Icon } from "@/components/ui";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fmtDateTime } from "@/lib/format";
import { sendOwnerMessage } from "@/app/actions/owner";

export const metadata = { title: "Conversation" };

export default async function OwnerThread({ params }) {
  const { id } = await params;
  const owner = await requireOwner();
  const inq = Number(id)
    ? await prisma.inquiry.findUnique({ where: { id: Number(id) }, include: { user: true, property: true, messages: { orderBy: { createdAt: "asc" } } } })
    : null;
  if (!inq || inq.property.ownerId !== owner.id) notFound();
  const name = inq.user.name || inq.user.email || `+91 ${inq.phone}`;
  const quick = inq.kind === "VISIT" ? ["Visit confirmed, see you then", "Can we shift the time?"] : ["Yes, it is available", "Sharing the location now"];

  return (
    <>
      <BackBar owner title={name} fallback="/owner/inquiries" />
      <div className="space-y-2 border-b border-line bg-white px-4 py-3">
        <Link href={`/property/${inq.propertyId}`} className="block text-[13px] font-extrabold leading-snug">{inq.property.title}</Link>
        {inq.visitAt && <p className="text-xs font-bold text-brand">Visit requested: {fmtDateTime(inq.visitAt)}</p>}
        <div className="flex items-center gap-2">
          <a href={`tel:+91${inq.phone}`} className="inline-flex items-center gap-1.5 rounded-full bg-fill px-3 py-1.5 text-xs font-bold"><Icon name="phone" className="h-3.5 w-3.5" />Call +91 {inq.phone}</a>
          <a href={`https://wa.me/91${inq.phone}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-ok px-3 py-1.5 text-xs font-bold text-white"><Icon name="chat" className="h-3.5 w-3.5" />WhatsApp</a>
          <HandledToggle id={inq.id} handled={inq.handled} kind={inq.kind} />
        </div>
      </div>
      <Chat inquiryId={inq.id} me="OWNER" send={sendOwnerMessage} quick={quick} messages={inq.messages.map((m) => ({ id: m.id, sender: m.sender, body: m.body, createdAt: m.createdAt.toISOString() }))} />
    </>
  );
}
