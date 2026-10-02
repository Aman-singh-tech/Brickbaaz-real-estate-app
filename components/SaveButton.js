"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toggleSave } from "@/app/actions/buyer";
import { cx } from "@/components/ui";

export default function SaveButton({ propertyId, initial = false, className }) {
  const [saved, setSaved] = useState(initial);
  const [, start] = useTransition();
  const router = useRouter();
  const path = usePathname();

  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !saved;
    setSaved(next);
    start(async () => {
      const res = await toggleSave(propertyId);
      if (res?.login) {
        setSaved(!next);
        router.push(`/login?next=${encodeURIComponent(path)}`);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save property"}
      className={cx("grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow", className)}
    >
      <svg viewBox="0 0 24 24" className={cx("h-[18px] w-[18px]", saved ? "fill-brand stroke-brand" : "fill-none stroke-ink")} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" />
      </svg>
    </button>
  );
}
