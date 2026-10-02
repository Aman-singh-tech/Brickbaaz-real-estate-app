import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getBuyer } from "@/lib/auth";
import PropertyCard from "@/components/PropertyCard";
import { Card, btn } from "@/components/ui";

export const metadata = { title: "Saved" };

export default async function Saved() {
  const user = await getBuyer();
  if (!user)
    return (
      <div className="space-y-4 px-4 pt-10 text-center">
        <h1 className="text-xl font-extrabold">Your shortlist</h1>
        <p className="text-sm text-mute">Log in to save properties and get alerts when prices change.</p>
        <Link href="/login?next=/saved" className={btn("primary", "mx-auto")}>Log in</Link>
      </div>
    );

  const rows = await prisma.saved.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { property: { include: { media: { orderBy: { sort: "asc" }, take: 1 } } } },
  });
  const items = rows.map((r) => r.property);

  return (
    <div className="space-y-4 px-4 pb-8 pt-4">
      <div className="flex items-end justify-between">
        <h1 className="text-[22px] font-extrabold tracking-tight">Saved</h1>
        <span className="pb-1 text-xs font-semibold text-mute">{items.length} properties</span>
      </div>
      {items.length === 0 ? (
        <Card className="space-y-2 py-12 text-center">
          <p className="text-base font-extrabold">Nothing saved yet</p>
          <p className="text-sm text-mute">Tap ♡ on any listing to shortlist it here.</p>
          <Link href="/search" className={btn("primary", "mx-auto mt-2")}>Browse properties</Link>
        </Card>
      ) : (
        items.map((p) => (
          <div key={p.id} className="space-y-1.5">
            {p.status !== "ACTIVE" && (
              <p className="px-1 text-[11px] font-bold text-brand">No longer available ({p.status.toLowerCase()})</p>
            )}
            <PropertyCard property={p} saved />
          </div>
        ))
      )}
    </div>
  );
}
