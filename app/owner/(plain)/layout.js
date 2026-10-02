import { requireOwner } from "@/lib/auth";

export default async function OwnerPlainLayout({ children }) {
  await requireOwner();
  return <div className="shell">{children}</div>;
}
