import CustomerExperience from "@/components/CustomerExperience";
export default function PlainLayout({ children }) {
  return <CustomerExperience><div className="shell">{children}</div></CustomerExperience>;
}
