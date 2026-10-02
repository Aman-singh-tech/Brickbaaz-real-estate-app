import { redirect } from "next/navigation";
import { Logo, Pill, Card } from "@/components/ui";
import OwnerLogin from "@/components/OwnerForms";
import { getOwner } from "@/lib/auth";

export const metadata = { title: "Owner sign in" };

export default async function OwnerLoginPage() {
  if (await getOwner()) redirect("/owner/dashboard");
  return (
    <div className="shell justify-center">
      <div className="space-y-5 px-5 py-10">
        <div className="space-y-2 text-center">
          <Logo size="text-xl" />
          <div><Pill tone="dark">OWNER APP</Pill></div>
          <h1 className="pt-2 text-2xl font-extrabold tracking-tight">Owner sign in</h1>
          <p className="text-sm text-mute">Manage listings, inquiries and visits.</p>
        </div>
        <Card className="!p-5 shadow-sm"><OwnerLogin /></Card>
        <p className="text-center text-xs text-mute">No sign-up. Access is limited to the Brickbaaz owner account.</p>
      </div>
    </div>
  );
}
