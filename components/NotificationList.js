import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, btn } from "@/components/ui";
import { timeAgo } from "@/lib/format";

export default async function NotificationList({ userId, markRead }) {
  const items = await prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 60 });
  const unread = items.filter((n) => !n.read).length;
  return (
    <div className="space-y-3 px-4 pb-8 pt-4">
      {unread > 0 && (
        <form action={markRead} className="flex justify-end">
          <button className="text-xs font-bold text-brand">Mark all as read ({unread})</button>
        </form>
      )}
      {items.length === 0 ? (
        <Card className="py-12 text-center text-sm text-mute">No notifications yet.</Card>
      ) : (
        items.map((n) => {
          const body = (
            <Card className="flex items-start gap-3">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-brand"}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-extrabold leading-snug">{n.title}</p>
                {n.body && <p className="truncate text-xs text-mute">{n.body}</p>}
                <p className="mt-0.5 text-[11px] text-mute">{timeAgo(n.createdAt)}</p>
              </div>
            </Card>
          );
          return n.href ? <Link key={n.id} href={n.href} className="block">{body}</Link> : <div key={n.id}>{body}</div>;
        })
      )}
    </div>
  );
}

export { btn };
