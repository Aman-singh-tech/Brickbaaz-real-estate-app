"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCity } from "@/app/actions/buyer";
import { cityLabel } from "@/lib/format";
import { btn, cx } from "@/components/ui";
import { DEFAULT_CITY } from "@/lib/city";

export default function CityPicker({ cities }) {
  const router = useRouter();
  const [city, set] = useState(DEFAULT_CITY);
  const [pending, start] = useTransition();
  const go = (to) =>
    start(async () => {
      await setCity(city);
      router.push(to);
    });
  return (
    <div className="space-y-4 text-left">
      <div className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold">{cityLabel(city)}</div>
      <div className="flex flex-wrap gap-2">
        {cities.map((c) => (
          <button key={c} type="button" onClick={() => set(c)} aria-pressed={city === c} className={cx("rounded-full px-4 py-2 text-xs font-bold", city === c ? "bg-navy text-white" : "bg-white ring-1 ring-line")}>
            {c}
          </button>
        ))}
      </div>
      <button disabled={pending} onClick={() => go("/login")} className={btn("primary", "w-full")}>Get started →</button>
      <button disabled={pending} onClick={() => go("/")} className={btn("soft", "w-full")}>Skip, just browse</button>
    </div>
  );
}
