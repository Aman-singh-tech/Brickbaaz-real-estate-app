import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { projectInclude } from "@/lib/projects";
import ProjectCard from "@/components/projects/ProjectCard";
export const dynamic = "force-dynamic";
export default async function Builder({ params }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const b = await prisma.builder.findUnique({
    where: { id },
    include: {
      projects: { where: { status: "PUBLISHED" }, include: projectInclude },
    },
  });
  if (!b || !b.projects.length) notFound();
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">{b.name}</h1>
      <p className="text-sm text-mute">
        {b.projects.length} published projects
      </p>
      {b.projects.map((p) => (
        <ProjectCard key={p.id} project={p} />
      ))}
    </div>
  );
}
