import NotificationList from "@/components/NotificationList";
import { requireOwner } from "@/lib/auth";
import { markOwnerNotificationsRead } from "@/app/actions/owner";

export const metadata = { title: "Notifications" };

export default async function OwnerNotifications() {
  const owner = await requireOwner();
  return (
    <>
      <h1 className="px-4 pt-4 text-[22px] font-extrabold tracking-tight">Notifications</h1>
      <NotificationList userId={owner.id} markRead={markOwnerNotificationsRead} />
    </>
  );
}
