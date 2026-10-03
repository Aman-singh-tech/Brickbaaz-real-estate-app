import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";
import ProjectEditor from "@/components/projects/ProjectEditor";
export default async function New() {
  await requireOwner();
  const builders = await prisma.builder.findMany({ orderBy: { name: "asc" } });
  return <ProjectEditor builders={builders} />;
}
