import Link from "next/link";
import OwnerTopBar from "@/components/OwnerTopBar";
import TabBar from "@/components/TabBar";
import OwnerSidebar from "@/components/OwnerSidebar";
import { requireOwner } from "@/lib/auth";

export default async function OwnerTabsLayout({ children }) {
  await requireOwner();
  return (
    <div className="shell owner-shell">
      <OwnerSidebar />
      <OwnerTopBar />
      <nav
        aria-label="Inventory and CRM"
        className="owner-mobile-nav flex gap-2 overflow-x-auto border-b border-line bg-white px-4 py-2 text-xs font-bold"
      >
        <Link href="/owner/listings" className="rounded-full bg-fill px-3 py-2">
          Properties
        </Link>
        <Link href="/owner/projects" className="rounded-full bg-fill px-3 py-2">
          Builder Projects
        </Link>
        <Link
          href="/owner/crm"
          className="shrink-0 rounded-full bg-fill px-3 py-2"
        >
          Lead CRM
        </Link>
        <Link
          href="/owner/testimonials"
          className="shrink-0 rounded-full bg-fill px-3 py-2"
        >
          Testimonials
        </Link>
      </nav>
      <main className="flex flex-1 flex-col">{children}</main>
      <TabBar variant="owner" />
    </div>
  );
}
