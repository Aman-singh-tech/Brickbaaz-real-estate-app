"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, cx } from "@/components/ui";

const BUYER = [
  { href: "/", label: "Explore", icon: "home", match: (p) => p === "/" },
  { href: "/search", label: "Search", icon: "search", match: (p) => p.startsWith("/search") || p.startsWith("/property") },
  { href: "/saved", label: "Saved", icon: "heart", match: (p) => p.startsWith("/saved") },
  { href: "/profile", label: "Profile", icon: "user", match: (p) => p.startsWith("/profile") || p.startsWith("/inquiries") || p.startsWith("/notifications") },
];

const OWNER = [
  { href: "/owner/dashboard", label: "Dashboard", icon: "home", match: (p) => p.startsWith("/owner/dashboard") },
  { href: "/owner/listings", label: "Listings", icon: "list", match: (p) => p.startsWith("/owner/listings") },
  { href: "/owner/post", label: "Post", icon: "plus", fab: true, match: (p) => p.startsWith("/owner/post") },
  { href: "/owner/inquiries", label: "Inquiries", icon: "chat", match: (p) => p.startsWith("/owner/inquiries") },
  { href: "/owner/account", label: "Account", icon: "user", match: (p) => p.startsWith("/owner/account") || p.startsWith("/owner/notifications") },
];

export default function TabBar({ variant = "buyer" }) {
  const path = usePathname();
  const items = variant === "owner" ? OWNER : BUYER;
  return (
    <nav
      aria-label="Main"
      className="sticky bottom-0 z-30 mt-auto flex items-end justify-around border-t border-line bg-white/95 px-1 pt-1.5 backdrop-blur"
      style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
    >
      {items.map((t) => {
        const on = t.match(path);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={cx("flex min-w-14 flex-col items-center gap-0.5 py-1 text-[10.5px] font-semibold", on ? "text-navy" : "text-mute")}
          >
            {t.fab ? (
              <span className="-mt-6 grid h-12 w-12 place-items-center rounded-full bg-brand text-white shadow-lg shadow-brand/30">
                <Icon name="plus" className="h-6 w-6" />
              </span>
            ) : (
              <Icon name={t.icon} className={cx("h-[22px] w-[22px]", on && "stroke-[2.4]")} />
            )}
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
