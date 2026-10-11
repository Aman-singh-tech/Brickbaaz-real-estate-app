"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, Logo } from "@/components/ui";

const items = [
  ["Explore", "/", "home", (p) => p === "/"],
  [
    "Search",
    "/search",
    "search",
    (p) => /^\/(search|projects|builders)(\/|$)/.test(p),
  ],
  ["Saved", "/saved", "heart", (p) => p.startsWith("/saved")],
  [
    "Profile",
    "/profile",
    "user",
    (p) => /^\/(profile|inquiries|notifications)(\/|$)/.test(p),
  ],
];

export default function CustomerNavigation() {
  const path = usePathname();
  const dialog = useRef(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  const close = () => dialog.current?.close();
  return (
    <>
      <button
        type="button"
        aria-label="Open navigation menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="customer-menu"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-white text-navy hover:bg-fill"
        onClick={() => {
          dialog.current.showModal();
          setOpen(true);
        }}
      >
        <Icon name="list" className="h-5 w-5" />
      </button>
      <dialog
        ref={dialog}
        id="customer-menu"
        aria-label="Brickbaaz menu"
        className="customer-menu"
        onClose={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(
            event.currentTarget.querySelectorAll(
              "a[href], button:not([disabled])",
            ),
          );
          const first = controls[0],
            last = controls.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            close();
        }}
      >
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link href="/" onClick={close} aria-label="Brickbaaz home">
            <Logo size="text-xl" />
          </Link>
          <button
            type="button"
            onClick={close}
            aria-label="Close navigation menu"
            className="grid h-10 w-10 place-items-center rounded-xl bg-fill"
          >
            <Icon name="x" />
          </button>
        </div>
        <nav aria-label="Customer navigation" className="customer-menu-links">
          {items.map(([label, href, icon, matches]) => (
            <Link
              key={href}
              href={href}
              onClick={close}
              aria-current={matches(path) ? "page" : undefined}
            >
              <Icon name={icon} className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <nav aria-label="Customer services" className="customer-menu-services">
          <Link href="/inquiries" onClick={close}>
            My inquiries
          </Link>
          <Link
            href="/services"
            onClick={close}
            aria-current={path === "/services" ? "page" : undefined}
          >
            Loans & Finance
          </Link>
          <Link
            href="/testimonials"
            onClick={close}
            aria-current={path === "/testimonials" ? "page" : undefined}
          >
            Customer stories
          </Link>
        </nav>
        <nav aria-label="Homepage sections" className="customer-menu-services">
          <p className="px-4 text-[10px] font-bold tracking-widest text-mute">
            DISCOVER BRICKBAAZ
          </p>
          {[
            ["About Brickbaaz", "about"],
            ["Featured properties", "properties"],
            ["Builder projects", "projects"],
            ["Our services", "our-services"],
            ["How it works", "how-it-works"],
            ["Customer experiences", "experiences"],
            ["Contact & support", "contact"],
          ].map(([label, id]) => (
            <Link
              key={id}
              href={path === "/" ? `#${id}` : `/#${id}`}
              onClick={close}
            >
              {label}
            </Link>
          ))}
        </nav>
      </dialog>
    </>
  );
}
