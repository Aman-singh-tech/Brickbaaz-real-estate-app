import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CrmLeadEditor from "@/components/CrmLeadEditor";
import { Card, btn } from "@/components/ui";
export default async function Lead({ params }) {
  await requireOwner();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const l = await prisma.crmLead.findUnique({
    where: { id },
    include: { activities: { orderBy: { createdAt: "desc" } } },
  });
  if (!l) notFound();
  const phone = l.phone.replace(/\D/g, ""),
    wa = phone.length === 10 ? "91" + phone : phone;
  const when = (d) => d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  return (
    <div className="space-y-5 p-5">
      <Link href="/owner/crm" className="text-sm text-brand">
        ← All leads
      </Link>
      <div>
        <h1 className="text-3xl font-extrabold">{l.name}</h1>
        <p className="mt-2 text-sm text-mute">
          {l.interest} · {l.type} · {l.source}
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <Card>
            <p className="font-bold">{l.phone}</p>
            {l.email && <p className="mt-2 text-sm">{l.email}</p>}
            <div className="mt-4 flex gap-2">
              <a href={`tel:${l.phone}`} className={btn("primary")}>
                Call
              </a>
              <a
                href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hi ${l.name}, following up on your interest in "${l.interest}" on Brickbaaz.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={btn("soft")}
              >
                WhatsApp
              </a>
            </div>
            {l.message && (
              <p className="mt-5 whitespace-pre-wrap text-sm">{l.message}</p>
            )}
            {l.amount && (
              <p className="mt-3 text-sm">
                Requested amount: ₹{Number(l.amount).toLocaleString("en-IN")}
              </p>
            )}
            <p className="mt-4 text-xs text-mute">
              Created: {when(l.createdAt)} IST · Contact consent:{" "}
              {l.consentAt ? when(l.consentAt) + " IST" : "Not recorded"}
              {l.campaign ? ` · Campaign: ${l.campaign}` : ""}
            </p>
            {l.inquiryId && (
              <Link
                className="mt-3 block text-xs text-brand"
                href={`/owner/inquiries/${l.inquiryId}`}
              >
                Original conversation →
              </Link>
            )}
            {l.projectLeadId && (
              <Link
                className="mt-3 block text-xs text-brand"
                href={`/owner/leads/${l.projectLeadId}`}
              >
                Original project enquiry →
              </Link>
            )}
          </Card>
          <section>
            <h2 className="mb-3 font-bold">Activity & notes</h2>
            <div className="space-y-3">
              {l.activities.map((a) => (
                <Card key={a.id}>
                  <p className="whitespace-pre-wrap text-sm">{a.body}</p>
                  <p className="mt-2 text-xs text-mute">
                    {when(a.createdAt)} IST
                  </p>
                </Card>
              ))}
              {!l.activities.length && <Card>No follow-up notes yet.</Card>}
            </div>
          </section>
        </div>
        <CrmLeadEditor
          lead={{
            id: l.id,
            stage: l.stage,
            followUpAt: l.followUpAt?.toISOString(),
            visitAt: l.visitAt?.toISOString(),
          }}
        />
      </div>
    </div>
  );
}
