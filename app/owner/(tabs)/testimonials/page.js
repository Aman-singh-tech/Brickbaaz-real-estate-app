import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, btn } from "@/components/ui";
export default async function Testimonials() {
  await requireOwner();
  const items = await prisma.testimonial.findMany({
    orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
  });
  return (
    <div className="space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Testimonials</h1>
        <Link href="/owner/testimonials/new" className={btn("brand")}>
          Add testimonial
        </Link>
      </div>
      {items.map((t) => (
        <Card key={t.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold">{t.name}</p>
              <p className="text-xs text-mute">
                {t.published ? "Published" : "Draft"} · Order {t.sort}
              </p>
              <p className="mt-3 line-clamp-2 text-sm">{t.feedback}</p>
            </div>
            <Link href={`/owner/testimonials/${t.id}`} className={btn("soft")}>
              Edit
            </Link>
          </div>
        </Card>
      ))}
      {!items.length && <Card>Add your first customer story.</Card>}
    </div>
  );
}
