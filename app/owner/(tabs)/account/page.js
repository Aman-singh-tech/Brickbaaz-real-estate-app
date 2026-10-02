import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { ownerLogout } from "@/app/actions/auth";
import { Card, Icon, Pill, btn } from "@/components/ui";

export const metadata = { title: "Account" };

export default async function Account() {
  const owner = await requireOwner();
  return (
    <div className="space-y-4 px-4 pb-8 pt-4">
      <Card className="flex items-center gap-3.5">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-brand text-xl font-extrabold text-white">{(owner.name?.[0] ?? "O").toUpperCase()}</span>
        <div className="space-y-1">
          <p className="text-base font-extrabold">{owner.name}</p>
          <p className="text-xs text-mute">{owner.email}</p>
          <Pill tone="ok">✔ Owner account</Pill>
        </div>
      </Card>
      <Card className="divide-y divide-line !py-1">
        {[["/owner/notifications", "bell", "Notifications"], ["/owner/listings", "list", "All listings"], [process.env.APP_URL || "/", "home", "View customer app"]].map(([h, ic, l]) => (
          <Link key={h} href={h} className="flex items-center gap-3 py-3 text-[13.5px] font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-fill"><Icon name={ic} className="h-[18px] w-[18px]" /></span>
            <span className="flex-1">{l}</span>
            <Icon name="back" className="h-4 w-4 rotate-180 text-mute" />
          </Link>
        ))}
      </Card>
      <form action={ownerLogout}><button className={btn("soft", "w-full")}>Log out</button></form>
    </div>
  );
}
