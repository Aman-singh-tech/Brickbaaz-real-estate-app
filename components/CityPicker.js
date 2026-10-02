"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCity } from "@/app/actions/buyer";
import { CITIES, cityLabel } from "@/lib/format";
import { btn, cx } from "@/components/ui";

export default function CityPicker() {
  const router = useRouter();
  const [city, set] = useState("Mumbai");
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
        {CITIES.map((c) => (
          <button key={c.name} type="button" onClick={() => set(c.name)} aria-pressed={city === c.name} className={cx("rounded-full px-4 py-2 text-xs font-bold", city === c.name ? "bg-navy text-white" : "bg-white ring-1 ring-line")}>
            {c.name}
          </button>
        ))}
      </div>
      <button disabled={pending} onClick={() => go("/login")} className={btn("primary", "w-full")}>Get started →</button>
      <button disabled={pending} onClick={() => go("/")} className={btn("soft", "w-full")}>Skip, just browse</button>
    </div>
  );
}
