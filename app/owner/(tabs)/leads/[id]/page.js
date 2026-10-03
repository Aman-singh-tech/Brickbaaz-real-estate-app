import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Card, btn } from "@/components/ui";
import LeadEditor from "@/components/projects/LeadEditor";
export default async function Lead({ params }) {
  await requireOwner();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const l = await prisma.projectLead.findUnique({
    where: { id },
    include: {
      project: { include: { builder: true } },
      notes: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!l) notFound();
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">{l.name}</h1>
      <Card className="space-y-2">
        <h2 className="font-bold">{l.project.name}</h2>
        <p className="text-sm">
          {l.project.builder.name} · {l.project.city}
        </p>
        <p>{l.phone}</p>
        {l.email && <p>{l.email}</p>}
        <p className="text-xs">
          Source: {l.source} · Campaign: {l.campaign || "—"}
        </p>
        {l.pickupAddress && (
          <p className="text-sm">Pickup requested: {l.pickupAddress}</p>
        )}
        <p className="text-xs text-mute">
          Contact consent:{" "}
          {l.consentAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
        </p>
        <div className="flex gap-2">
          <a href={`tel:+91${l.phone}`} className={btn("soft")}>
            Call customer
          </a>
          <a
            href={`https://wa.me/91${l.phone}`}
            className={btn("soft")}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
        </div>
      </Card>
      <LeadEditor
        lead={{
          id: l.id,
          stage: l.stage,
          visitAt: l.visitAt?.toISOString() || null,
          followUpAt: l.followUpAt?.toISOString() || null,
        }}
      />
      <h2 className="font-bold">Notes</h2>
      {!l.notes.length && <p className="text-sm text-mute">No notes yet.</p>}
      {l.notes.map((n) => (
        <Card key={n.id}>
          <p className="whitespace-pre-wrap text-sm">{n.body}</p>
          <p className="mt-2 text-xs text-mute">
            {n.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
          </p>
        </Card>
      ))}
    </div>
  );
}
