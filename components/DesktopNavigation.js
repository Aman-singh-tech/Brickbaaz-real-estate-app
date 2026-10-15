"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DesktopNavigation() {
  const path = usePathname();
  return <nav aria-label="Main navigation" className="desktop-discovery-nav">
    {[["Properties", "/search"], ["Projects", "/projects"], ["Services", "/services"], ["Contact", "/#contact"]].map(([label, href]) => <Link key={href} href={href} aria-current={href !== "/#contact" && path.startsWith(href) ? "page" : undefined}>{label}</Link>)}
  </nav>;
}
