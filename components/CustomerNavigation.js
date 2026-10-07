"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, Logo } from "@/components/ui";

const items = [
  ["Explore", "/", "home", (p) => p === "/"],
  ["Search", "/search", "search", (p) => /^\/(search|projects|builders)(\/|$)/.test(p)],
  ["Saved", "/saved", "heart", (p) => p.startsWith("/saved")],
  ["Profile", "/profile", "user", (p) => /^\/(profile|inquiries|notifications)(\/|$)/.test(p)],
];

export default function CustomerNavigation() {
  const path = usePathname();
  return (
    <aside className="customer-navigation">
      <Link href="/" className="customer-navigation-logo" aria-label="Brickbaaz home">
        <Logo size="text-xl" />
      </Link>
      <nav aria-label="Customer navigation" className="customer-navigation-links">
        {items.map(([label, href, icon, matches]) => (
          <Link key={href} href={href} aria-current={matches(path) ? "page" : undefined}>
            <Icon name={icon} className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <nav aria-label="Customer services" className="customer-navigation-services">
        <Link href="/inquiries">My inquiries</Link>
        <Link href="/services" aria-current={path === "/services" ? "page" : undefined}>Loans & Finance</Link>
        <Link href="/testimonials" aria-current={path === "/testimonials" ? "page" : undefined}>Customer stories</Link>
      </nav>
    </aside>
  );
}
