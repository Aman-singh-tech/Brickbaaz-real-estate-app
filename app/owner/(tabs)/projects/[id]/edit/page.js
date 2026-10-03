import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";
import { projectInclude } from "@/lib/projects";
import { notFound } from "next/navigation";
import ProjectEditor from "@/components/projects/ProjectEditor";
export default async function Edit({ params }) {
  await requireOwner();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const p = await prisma.project.findUnique({
    where: { id },
    include: projectInclude,
  });
  if (!p) notFound();
  const builders = await prisma.builder.findMany({ orderBy: { name: "asc" } });
  const initial = {
    ...p,
    builder: p.builder.name,
    amenities: p.amenities.join(", "),
    lat: p.lat ?? "",
    lng: p.lng ?? "",
    createdAt: undefined,
    updatedAt: undefined,
    configurations: p.configurations.map((c) => ({
      ...c,
      price: c.price == null ? "" : Number(c.price),
    })),
  };
  return <ProjectEditor builders={builders} initial={initial} />;
}
