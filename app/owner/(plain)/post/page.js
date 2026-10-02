import { notFound } from "next/navigation";
import PostWizard from "@/components/PostWizard";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Post property" };

export default async function PostPage({ searchParams }) {
  const owner = await requireOwner();
  const { edit } = await searchParams;
  let initial = null;
  let id = null;
  if (edit) {
    const p = await prisma.property.findUnique({ where: { id: Number(edit) || 0 }, include: { media: { orderBy: { sort: "asc" } } } });
    if (!p || p.ownerId !== owner.id) notFound();
    id = p.id;
    const nearby = Array.isArray(p.nearby) ? p.nearby : [];
    initial = {
      status: p.status, purpose: p.purpose, type: p.type, title: p.title, city: p.city, locality: p.locality, society: p.society ?? "",
      lat: p.lat ?? "", lng: p.lng ?? "", bedrooms: p.bedrooms ?? 2, bathrooms: p.bathrooms ?? 2, balconies: p.balconies ?? 1,
      carpetArea: p.carpetArea ?? "", superArea: p.superArea ?? "", floor: p.floor ?? "", totalFloors: p.totalFloors ?? "",
      furnishing: p.furnishing ?? "", facing: p.facing ?? "", possession: p.possession ?? "READY", possessionBy: p.possessionBy ?? "",
      amenities: p.amenities, nearby: [0, 1, 2].map((i) => nearby[i] ?? { label: "", distance: "" }),
      description: p.description ?? "", reraId: p.reraId ?? "", price: p.price || "", negotiable: p.negotiable, deposit: p.deposit ?? "",
      media: p.media.map((m) => ({ url: m.url, kind: m.kind })), confirmed: p.status !== "DRAFT",
    };
  }
  return <PostWizard initial={initial} id={id} key={id ?? "new"} />;
}
