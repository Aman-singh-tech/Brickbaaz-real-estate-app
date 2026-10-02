import BackBar from "@/components/BackBar";
import NotificationList from "@/components/NotificationList";
import { requireBuyer } from "@/lib/auth";
import { markNotificationsRead } from "@/app/actions/buyer";

export const metadata = { title: "Notifications" };

export default async function Notifications() {
  const user = await requireBuyer("/notifications");
  return (
    <>
      <BackBar title="Notifications" fallback="/profile" />
      <NotificationList userId={user.id} markRead={markNotificationsRead} />
    </>
  );
}
