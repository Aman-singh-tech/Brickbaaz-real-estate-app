import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";
import { Card, Pill, btn } from "@/components/ui";
export default async function AdminProjects() {
  await requireOwner();
  const projects = await prisma.project.findMany({
    include: { builder: true, _count: { select: { leads: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Builder projects</h1>
        <Link href="/owner/projects/new" className={btn("brand")}>
          Add project
        </Link>
      </div>
      <Link href="/owner/leads" className={btn("soft", "w-full")}>
        Project leads and reports
      </Link>
      {!projects.length && (
        <Card>No projects yet. Add your first builder project.</Card>
      )}
      {projects.map((p) => (
        <Card key={p.id} className="space-y-2">
          <Pill>{p.status}</Pill>
          <h2 className="font-bold">{p.name}</h2>
          <p className="text-sm">
            {p.builder.name} · {p.locality}, {p.city}
          </p>
          <p className="text-xs text-mute">{p._count.leads} leads</p>
          <div className="flex gap-2">
            <Link href={`/owner/projects/${p.id}/edit`} className={btn("soft")}>
              Edit
            </Link>
            {p.status === "PUBLISHED" && (
              <Link
                href={`${process.env.APP_URL || ""}/projects/${p.slug}`}
                className={btn("primary")}
              >
                View as customer
              </Link>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
