import TopBar from "@/components/TopBar";
import CustomerNavigation from "@/components/CustomerNavigation";

export default function TabsLayout({ children }) {
  return (
    <div className="shell customer-shell">
      <TopBar />
      <CustomerNavigation />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
