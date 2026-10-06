"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui";

const links = [
  ["Dashboard", "/owner/dashboard", "home"],
  ["Properties", "/owner/listings", "list"],
  ["Builder projects", "/owner/projects", "home"],
  ["Property inquiries", "/owner/inquiries", "chat"],
  ["Lead CRM", "/owner/crm", "user"],
  ["Testimonials", "/owner/testimonials", "heart"],
  ["Account", "/owner/account", "shield"],
];

export default function OwnerSidebar() {
  const path = usePathname();
  return (
    <aside className="owner-sidebar">
      <Link
        href="/owner/dashboard"
        className="mb-8 text-2xl font-extrabold tracking-tight"
      >
        Brick<span className="text-brand">baaz</span>
        <span className="mt-2 block text-[10px] font-semibold tracking-[.24em] text-white/45">
          OWNER WORKSPACE
        </span>
      </Link>
      <p className="mb-2 px-3 text-[10px] font-bold tracking-[.18em] text-white/40">
        YOUR BUSINESS
      </p>
      <nav aria-label="Owner workspace" className="space-y-2">
        {links.map(([label, href, icon]) => {
          const active = path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
            >
              <Icon
                name={icon}
                className={`h-5 w-5 ${active ? "text-brand" : ""}`}
              />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-bold">Your next opportunity starts here.</p>
        <p className="text-xs leading-relaxed text-white/55">
          Publish a property and connect with interested buyers.
        </p>
        <Link
          href="/owner/post"
          className="flex items-center justify-center gap-2 rounded-xl bg-brand px-3 py-3 text-xs font-bold text-white"
        >
          <Icon name="plus" className="h-4 w-4" />
          Post a property
        </Link>
      </div>
    </aside>
  );
}
