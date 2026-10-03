import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";
import { LEAD_STAGES } from "@/lib/lead-stages";
import { Card, Pill, btn, inputCls } from "@/components/ui";
export default async function Leads({ searchParams }) {
  await requireOwner();
  const sp = await searchParams,
    where = {};
  if (LEAD_STAGES[sp.stage]) where.stage = sp.stage;
  if (sp.project && Number.isInteger(Number(sp.project)))
    where.projectId = Number(sp.project);
  if (sp.due === "1")
    Object.assign(where, {
      followUpAt: { lte: new Date() },
      stage: { notIn: ["BOOKED", "LOST"] },
    });
  const [leads, projects, groups, due, total] = await Promise.all([
    prisma.projectLead.findMany({
      where,
      include: {
        project: { include: { builder: true } },
        notes: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.project.findMany({ select: { id: true, name: true } }),
    prisma.projectLead.groupBy({ by: ["stage"], _count: { _all: true } }),
    prisma.projectLead.count({
      where: {
        followUpAt: { lte: new Date() },
        stage: { notIn: ["BOOKED", "LOST"] },
      },
    }),
    prisma.projectLead.count({ where }),
  ]);
  const count = Object.fromEntries(groups.map((g) => [g.stage, g._count._all]));
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Project lead CRM</h1>
      <div className="grid grid-cols-3 gap-2">
        {[
          ["All leads", groups.reduce((n, g) => n + g._count._all, 0)],
          ["Visits scheduled", count.VISIT_SCHEDULED || 0],
          ["Booked", count.BOOKED || 0],
        ].map(([l, n]) => (
          <Card key={l}>
            <p className="text-lg font-bold">{n}</p>
            <p className="text-xs">{l}</p>
          </Card>
        ))}
      </div>
      <Link href="/owner/leads?due=1" className={btn("brand", "w-full")}>
        {due} follow-ups due
      </Link>
      <form className="space-y-2">
        <select
          name="stage"
          defaultValue={sp.stage || ""}
          className={inputCls}
          aria-label="Lead stage"
        >
          <option value="">All stages</option>
          {Object.entries(LEAD_STAGES).map(([v, l]) => (
            <option key={v} value={v}>
              {l} ({count[v] || 0})
            </option>
          ))}
        </select>
        <select
          name="project"
          defaultValue={sp.project || ""}
          className={inputCls}
          aria-label="Project"
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button className={btn("soft")}>Filter leads</button>
      </form>
      <p className="text-xs text-mute">
        Showing latest {leads.length} of {total} matches.
      </p>
      {!leads.length && <Card>No matching leads.</Card>}
      {leads.map((l) => (
        <Card key={l.id} className="space-y-2">
          <Pill tone="brand">{LEAD_STAGES[l.stage]}</Pill>
          <Link href={`/owner/leads/${l.id}`} className="block font-bold">
            {l.name} — {l.project.name}
          </Link>
          <p className="text-sm">
            {l.project.builder.name} · {l.project.city}
          </p>
          <p className="text-xs text-mute">
            {l.source} · {l.kind} ·{" "}
            {l.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
          </p>
          {l.followUpAt && (
            <p className="text-xs font-bold">
              Follow-up:{" "}
              {l.followUpAt.toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              })}
            </p>
          )}
          <div className="flex gap-2">
            <a href={`tel:+91${l.phone}`} className={btn("soft")}>
              Call
            </a>
            <a
              href={`https://wa.me/91${l.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className={btn("soft")}
            >
              WhatsApp
            </a>
            <Link href={`/owner/leads/${l.id}`} className={btn("primary")}>
              Open
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}
