import Link from "next/link";
import { cookies } from "next/headers";
import { Logo, Icon } from "@/components/ui";
import PurposeToggle from "@/components/PurposeToggle";
import { getBuyer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CITY } from "@/lib/city";

export async function getPurpose() {
  return (await cookies()).get("purpose")?.value === "rent" ? "rent" : "sale";
}

export async function getCity() {
  return DEFAULT_CITY;
}

// Customer app header: logo, Buy/Rent toggle, bell, avatar/login.
export default async function TopBar() {
  const [purpose, user] = await Promise.all([getPurpose(), getBuyer()]);
  const unread = user
    ? await prisma.notification.count({
        where: { userId: user.id, read: false },
      })
    : 0;
  return (
    <header className="sticky top-0 z-30 flex items-center gap-1 border-b border-line bg-white/95 px-3 py-2.5 backdrop-blur">
      <Link href="/" aria-label="Brickbaaz home">
        <Logo size="text-[14px]" />
      </Link>
      <span className="flex-1" />
      <nav
        aria-label="Customer shortcuts"
        className="mr-8 hidden items-center gap-5 text-sm font-semibold lg:flex"
      >
        <Link href="/">Explore</Link>
        <Link href="/saved">Saved homes</Link>
        <Link href="/inquiries">My inquiries</Link>
        <Link href="/services">Loans & Finance</Link>
        <Link href="/testimonials">Stories</Link>
      </nav>
      <PurposeToggle value={purpose} />
      <Link
        href="/notifications"
        aria-label="Notifications"
        className="relative grid h-8 w-8 place-items-center rounded-full bg-fill"
      >
        <Icon name="bell" className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-white" />
        )}
      </Link>
      <Link
        href={user ? "/profile" : "/login"}
        aria-label={user ? "Profile" : "Log in"}
        className="grid h-8 w-8 place-items-center rounded-full bg-navy text-xs font-extrabold text-white"
      >
        {user ? (
          (user.name?.[0] ?? "U").toUpperCase()
        ) : (
          <Icon name="user" className="h-4 w-4" />
        )}
      </Link>
    </header>
  );
}
