import InventoryRefresh from "@/components/InventoryRefresh";
import TopBar from "@/components/TopBar";
import CustomerExperience from "@/components/CustomerExperience";

export default function TabsLayout({ children }) {
  return (
    <CustomerExperience>
      <div className="shell customer-shell">
        <InventoryRefresh />
        <TopBar />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </CustomerExperience>
  );
}
