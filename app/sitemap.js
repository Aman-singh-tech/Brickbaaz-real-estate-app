import { prisma } from "@/lib/prisma";
import { cityWhere, DEFAULT_CITY } from "@/lib/city";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap() {
  const [properties, projects] = await Promise.all([
    prisma.property.findMany({ where: { status: "ACTIVE", ...cityWhere(DEFAULT_CITY) }, select: { id: true, updatedAt: true } }),
    prisma.project.findMany({ where: { status: "PUBLISHED", ...cityWhere(DEFAULT_CITY) }, select: { slug: true, updatedAt: true } }),
  ]);
  return [
    ...["/", "/projects", "/services", "/testimonials", "/privacy", "/terms"].map(path => ({ url: absoluteUrl(path) })),
    ...properties.map(p => ({ url: absoluteUrl(`/property/${p.id}`), lastModified: p.updatedAt })),
    ...projects.map(p => ({ url: absoluteUrl(`/projects/${encodeURIComponent(p.slug)}`), lastModified: p.updatedAt })),
  ];
}
