"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setPurpose } from "@/app/actions/buyer";
import { cx } from "@/components/ui";

export default function PurposeToggle({ value }) {
  const router = useRouter();
  const path = usePathname();
  const [pending, start] = useTransition();
  const set = (v) =>
    start(async () => {
      await setPurpose(v);
      router.refresh();
    });
  return (
    <div
      role="group"
      aria-label="Buy or rent"
      className={cx(
        "flex rounded-full bg-fill p-0.5 text-xs font-bold",
        pending && "opacity-70",
      )}
    >
      {[
        ["sale", "Buy"],
        ["rent", "Rent"],
      ].map(([v, l]) => (
        <button
          key={v}
          type="button"
          aria-pressed={!path.startsWith("/projects") && value === v}
          onClick={() => {
            if (path.startsWith("/projects")) router.push(`/search?p=${v}`);
            else if (value !== v) set(v);
          }}
          className={cx(
            "rounded-full px-2 py-1.5",
            !path.startsWith("/projects") && value === v
              ? "bg-white text-navy shadow-sm"
              : "text-mute",
          )}
        >
          {l}
        </button>
      ))}
      <Link
        href="/projects"
        className={cx(
          "rounded-full px-2 py-1.5",
          path.startsWith("/projects")
            ? "bg-white text-navy shadow-sm"
            : "text-mute",
        )}
      >
        Projects
      </Link>
    </div>
  );
}
