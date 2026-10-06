import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";
import { CRM_STAGES, LEAD_TYPES, CLOSED_STAGES } from "@/lib/crm-options";
import { Card, Pill, inputCls, btn } from "@/components/ui";
export const metadata = { title: "Lead CRM" };
const date = (d) =>
  d
    ? d.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";
export default async function Crm({ searchParams }) {
  await requireOwner();
  const sp = await searchParams,
    where = {};
  if (CRM_STAGES[sp.stage]) where.stage = sp.stage;
  if (LEAD_TYPES[sp.type]) where.type = sp.type;
  if (sp.source) where.source = String(sp.source).slice(0, 80);
  if (sp.q)
    where.OR = ["name", "phone", "email", "interest"].map((k) => ({
      [k]: { contains: String(sp.q).slice(0, 200), mode: "insensitive" },
    }));
  const now = new Date();
  if (sp.due === "overdue")
    Object.assign(where, {
      followUpAt: { lt: now },
      stage: { notIn: CLOSED_STAGES },
    });
  if (sp.due === "today") {
    const start = new Date(
      new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) +
        "T00:00:00+05:30",
    );
    Object.assign(where, {
      followUpAt: { gte: start, lt: new Date(start.getTime() + 86400000) },
      stage: { notIn: CLOSED_STAGES },
    });
  }
  const page = Math.min(10000, Math.max(1, Number.parseInt(sp.page) || 1)),
    size = 50;
  const [leads, total, overdue, sources] = await Promise.all([
    prisma.crmLead.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * size,
      take: size,
    }),
    prisma.crmLead.count({ where }),
    prisma.crmLead.count({
      where: { followUpAt: { lt: now }, stage: { notIn: CLOSED_STAGES } },
    }),
    prisma.crmLead.findMany({
      distinct: ["source"],
      select: { source: true },
      orderBy: { source: "asc" },
    }),
  ]);
  const query = (extra) =>
    "/owner/crm?" +
    new URLSearchParams({
      ...Object.fromEntries(
        Object.entries(sp).filter(([, v]) => typeof v === "string"),
      ),
      ...extra,
    });
  return (
    <div className="space-y-5 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-widest text-brand">
            YOUR SALES PIPELINE
          </p>
          <h1 className="mt-2 text-3xl font-extrabold">Lead CRM</h1>
          <p className="mt-2 text-sm text-mute">
            Property, project, loan and imported contacts.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/owner/crm/new" className={btn("soft")}>
            Add lead
          </Link>
          <Link href="/owner/crm/import" className={btn("brand")}>
            Upload CSV
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Pill>{total} matching leads</Pill>
        <Link
          href="/owner/crm?due=overdue"
          className="text-sm font-bold text-brand"
        >
          {overdue} overdue follow-ups →
        </Link>
      </div>
      <Card>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            name="q"
            aria-label="Search leads"
            placeholder="Name, phone or interest"
            defaultValue={sp.q}
            className={inputCls}
          />
          <select
            aria-label="Stage filter"
            name="stage"
            defaultValue={sp.stage || ""}
            className={inputCls}
          >
            <option value="">All stages</option>
            {Object.entries(CRM_STAGES).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <select
            aria-label="Lead type filter"
            name="type"
            defaultValue={sp.type || ""}
            className={inputCls}
          >
            <option value="">All lead types</option>
            {Object.entries(LEAD_TYPES).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <select
            aria-label="Source filter"
            name="source"
            defaultValue={sp.source || ""}
            className={inputCls}
          >
            <option value="">All sources</option>
            {sources.map((s) => (
              <option key={s.source}>{s.source}</option>
            ))}
          </select>
          <select
            aria-label="Follow-up filter"
            name="due"
            defaultValue={sp.due || ""}
            className={inputCls}
          >
            <option value="">All follow-ups</option>
            <option value="today">Due today (India)</option>
            <option value="overdue">Overdue</option>
          </select>
          <select
            name="view"
            aria-label="Lead view"
            defaultValue={sp.view || "list"}
            className={inputCls}
          >
            <option value="list">List view</option>
            <option value="board">Stage board</option>
          </select>
          <button className={btn("primary")}>Apply filters</button>
          <Link href="/owner/crm" className={btn("soft")}>
            Reset
          </Link>
        </form>
      </Card>
      {sp.view === "board" ? (
        <>
          <p className="text-xs text-mute">
            Board shows this page of {size} leads. Open a lead to update its
            stage.
          </p>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Object.entries(CRM_STAGES).map(([stage, label]) => (
              <section
                key={stage}
                className="w-64 shrink-0 rounded-2xl bg-fill p-3"
              >
                <h2 className="mb-3 text-sm font-bold">
                  {label} · {leads.filter((l) => l.stage === stage).length}
                </h2>
                <div className="space-y-3">
                  {leads
                    .filter((l) => l.stage === stage)
                    .map((l) => (
                      <Link
                        key={l.id}
                        href={`/owner/crm/${l.id}`}
                        className="block rounded-xl border border-line bg-white p-4"
                      >
                        <p className="font-bold">{l.name}</p>
                        <p className="mt-2 text-xs text-mute">{l.interest}</p>
                        <p className="mt-3 text-xs">
                          {l.source} · {date(l.followUpAt)}
                        </p>
                      </Link>
                    ))}
                </div>
              </section>
            ))}
          </div>
        </>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-fill text-xs text-mute">
              <tr>
                {[
                  "Customer",
                  "Interest / source",
                  "Stage",
                  "Follow-up (IST)",
                  "Open",
                ].map((h) => (
                  <th key={h} className="p-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-t border-line">
                  <td className="p-4">
                    <p className="font-bold">{l.name}</p>
                    <a href={`tel:${l.phone}`} className="text-xs text-brand">
                      {l.phone}
                    </a>
                  </td>
                  <td className="p-4">
                    <p>{l.interest}</p>
                    <p className="text-xs text-mute">
                      {LEAD_TYPES[l.type]} · {l.source}
                    </p>
                  </td>
                  <td className="p-4">
                    <Pill>{CRM_STAGES[l.stage] || l.stage}</Pill>
                  </td>
                  <td
                    className={`p-4 text-xs ${l.followUpAt && l.followUpAt < now && !CLOSED_STAGES.includes(l.stage) ? "text-red-600" : "text-mute"}`}
                  >
                    {date(l.followUpAt)}
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/owner/crm/${l.id}`}
                      className="font-bold text-brand"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!leads.length && <Card>No leads match these filters.</Card>}
      <div className="flex items-center justify-between text-sm">
        {page > 1 ? (
          <Link href={query({ page: String(page - 1) })}>← Previous</Link>
        ) : (
          <span />
        )}
        <span>
          Page {page} · {total} results
        </span>
        {page * size < total ? (
          <Link href={query({ page: String(page + 1) })}>Next →</Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
