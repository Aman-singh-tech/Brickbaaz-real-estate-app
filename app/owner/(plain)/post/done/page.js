import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Icon, Pill, btn } from "@/components/ui";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Listing published" };

export default async function Done({ searchParams }) {
  const owner = await requireOwner();
  const { id } = await searchParams;
  const p = await prisma.property.findUnique({ where: { id: Number(id) || 0 } });
  if (!p || p.ownerId !== owner.id) notFound();
  return (
    <div className="flex flex-1 flex-col justify-center gap-5 px-5 py-10 text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-ok text-white"><Icon name="check" className="h-8 w-8" /></span>
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">{p.status === "ACTIVE" ? "Your listing is live" : "Listing saved"}</h1>
        <p className="text-sm text-mute">{p.status === "ACTIVE" ? "Buyers can now see it in search and Explore." : "This listing is not visible to buyers yet."}</p>
      </div>
      <Card className="space-y-1 text-left">
        <Pill tone={p.status === "ACTIVE" ? "ok" : "soft"}>{p.status === "ACTIVE" ? "● LIVE" : p.status}</Pill>
        <p className="text-[15px] font-extrabold">{p.title}</p>
        <p className="text-xs text-mute">{p.locality}, {p.city} · {formatPrice(p)}{p.purpose === "RENT" ? "/mo" : ""}</p>
      </Card>
      <div className="space-y-2.5">
        <Link href={`/property/${p.id}`} className={btn("primary", "w-full")}>View as buyer</Link>
        <Link href="/owner/dashboard" className={btn("soft", "w-full")}>Go to dashboard</Link>
        <Link href="/owner/listings" className={btn("brand", "w-full")}>Boost for more leads</Link>
        <a href={`https://wa.me/?text=${encodeURIComponent(`Check out ${p.title} on Brickbaaz`)}`} target="_blank" rel="noopener noreferrer" className={btn("soft", "w-full")}>Share on WhatsApp</a>
      </div>
    </div>
  );
}
