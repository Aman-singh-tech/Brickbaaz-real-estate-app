import TopBar from "@/components/TopBar";
import TabBar from "@/components/TabBar";

export default function TabsLayout({ children }) {
  return (
    <div className="shell">
      <TopBar />
      <main className="flex flex-1 flex-col">{children}</main>
      <TabBar variant="buyer" />
    </div>
  );
}
