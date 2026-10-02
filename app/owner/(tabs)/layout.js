import OwnerTopBar from "@/components/OwnerTopBar";
import TabBar from "@/components/TabBar";
import { requireOwner } from "@/lib/auth";

export default async function OwnerTabsLayout({ children }) {
  await requireOwner();
  return (
    <div className="shell">
      <OwnerTopBar />
      <main className="flex flex-1 flex-col">{children}</main>
      <TabBar variant="owner" />
    </div>
  );
}
