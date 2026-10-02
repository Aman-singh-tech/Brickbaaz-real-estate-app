"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setPurpose } from "@/app/actions/buyer";
import { cx } from "@/components/ui";

export default function PurposeToggle({ value }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const set = (v) =>
    start(async () => {
      await setPurpose(v);
      router.refresh();
    });
  return (
    <div role="group" aria-label="Buy or rent" className={cx("flex rounded-full bg-fill p-0.5 text-xs font-bold", pending && "opacity-70")}>
      {[["sale", "Buy"], ["rent", "Rent"]].map(([v, l]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => value !== v && set(v)}
          className={cx("rounded-full px-3.5 py-1.5", value === v ? "bg-white text-navy shadow-sm" : "text-mute")}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
