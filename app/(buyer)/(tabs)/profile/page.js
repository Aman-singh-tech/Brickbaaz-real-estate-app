import Link from "next/link";
import { getBuyer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buyerLogout } from "@/app/actions/auth";
import ProfileName from "@/components/ProfileName";
import { ResendVerification } from "@/components/AuthForms";
import { Card, Icon, Pill, btn } from "@/components/ui";

export const metadata = { title: "Profile" };

function Row({ href, icon, title, sub, right }) {
  const body = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-fill"><Icon name={icon} className="h-[18px] w-[18px]" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-bold">{title}</span>
        {sub && <span className="block truncate text-[11.5px] text-mute">{sub}</span>}
      </span>
      {right ?? <Icon name="back" className="h-4 w-4 rotate-180 text-mute" />}
    </>
  );
  const cls = "flex items-center gap-3 px-1 py-3";
  return href.startsWith("tel:") || href.startsWith("http") ? <a href={href} className={cls}>{body}</a> : <Link href={href} className={cls}>{body}</Link>;
}

export default async function Profile() {
  const user = await getBuyer();
  if (!user)
    return (
      <div className="space-y-4 px-4 pt-10 text-center">
        <h1 className="text-xl font-extrabold">Welcome to Brickbaaz</h1>
        <p className="text-sm text-mute">Log in to track your inquiries, visits and shortlist.</p>
        <Link href="/login?next=/profile" className={btn("primary", "mx-auto")}>Log in / Sign up</Link>
      </div>
    );

  const [open, visits, unread] = await Promise.all([
    prisma.inquiry.count({ where: { userId: user.id } }),
    prisma.inquiry.count({ where: { userId: user.id, kind: "VISIT", visitAt: { gte: new Date() } } }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
  ]);
  const support = process.env.SUPPORT_PHONE || "1800-BRICK-IN";

  return (
    <div className="space-y-4 px-4 pb-8 pt-4">
      <Card className="flex items-center gap-3.5">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-navy text-xl font-extrabold text-white">{(user.name?.[0] ?? "U").toUpperCase()}</span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-base font-extrabold">{user.name}</p>
          <p className="text-xs text-mute">Buyer · since {user.createdAt.getFullYear()}</p>
          {user.emailVerified ? <Pill tone="ok">✔ Email verified</Pill> : <Pill tone="brand">Email not verified</Pill>}
          <p className="truncate text-[11.5px] text-mute">{user.email}</p>
        </div>
      </Card>
      {!user.emailVerified && (
        <Card className="space-y-2 !bg-brand-soft">
          <p className="text-[13px] font-extrabold">Verify your email to contact owners</p>
          <ResendVerification />
        </Card>
      )}
      <ProfileName name={user.name} phone={user.phone} />
      <Card className="divide-y divide-line !py-1.5">
        <Row href="/inquiries" icon="chat" title="My inquiries & visits" sub={`${open} inquiries · ${visits} upcoming visits`} />
        <Row href="/saved" icon="heart" title="Saved properties" />
        <Row href="/notifications" icon="bell" title="Notifications" sub={unread ? `${unread} unread` : "All caught up"} />
        <Row href={`tel:${support.replace(/[^\d+]/g, "") || "1800"}`} icon="phone" title="Help & support" sub={`Call ${support}`} />
        <Row href="/terms" icon="shield" title="Terms of Service" />
        <Row href="/privacy" icon="shield" title="Privacy Policy" />
      </Card>
      <form action={buyerLogout}>
        <button className={btn("soft", "w-full")}>Log out</button>
      </form>
    </div>
  );
}
