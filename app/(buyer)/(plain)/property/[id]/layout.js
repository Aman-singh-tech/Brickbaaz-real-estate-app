import TopBar from "@/components/TopBar";

export default function PropertyLayout({ children }) {
  return <div className="property-detail customer-shell"><TopBar />{children}</div>;
}
