import Link from "next/link";
import { Logo, Pill, Icon } from "@/components/ui";
import { getOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function OwnerTopBar() {
  const owner = await getOwner();
  const unread = owner ? await prisma.notification.count({ where: { userId: owner.id, read: false } }) : 0;
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-white/95 px-4 py-2.5 backdrop-blur">
      <Link href="/owner/dashboard" className="flex items-center gap-2">
        <Logo size="text-[17px]" />
        <Pill tone="dark">OWNER</Pill>
      </Link>
      <span className="flex-1" />
      <Link href="/owner/notifications" aria-label="Notifications" className="relative grid h-9 w-9 place-items-center rounded-full bg-fill">
        <Icon name="bell" className="h-[18px] w-[18px]" />
        {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-white" />}
      </Link>
      <Link href="/owner/account" aria-label="Account" className="grid h-9 w-9 place-items-center rounded-full bg-brand text-xs font-extrabold text-white">
        {(owner?.name?.[0] ?? "O").toUpperCase()}
      </Link>
    </header>
  );
}
