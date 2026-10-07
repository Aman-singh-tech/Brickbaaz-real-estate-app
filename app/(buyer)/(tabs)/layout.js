import TopBar from "@/components/TopBar";

export default function TabsLayout({ children }) {
  return (
    <div className="shell customer-shell">
      <TopBar />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
