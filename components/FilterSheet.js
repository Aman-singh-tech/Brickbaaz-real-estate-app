"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sheet from "@/components/Sheet";
import { Icon, cx, btn } from "@/components/ui";
import { TYPE_LABEL } from "@/lib/format";
import { CUSTOMER_CITIES, DEFAULT_CITY } from "@/lib/city";

const SALE_STEPS = [0, 1e6, 2.5e6, 5e6, 7.5e6, 1e7, 1.5e7, 2e7, 2.5e7, 3e7, 5e7, 1e8];
const RENT_STEPS = [0, 10000, 20000, 30000, 50000, 75000, 100000, 200000];
const label = (n, rent) => (n === 0 ? "Any" : rent ? `₹${n.toLocaleString("en-IN")}` : n >= 1e7 ? `₹${n / 1e7} Cr` : `₹${n / 1e5} L`);

const toggle = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
const csv = (v) => (v ? v.split(",").filter(Boolean) : []);

function Group({ title, children }) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-[11px] font-bold text-mute">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
function Chip({ on, children, ...p }) {
  return (
    <button type="button" aria-pressed={on} className={cx("rounded-full px-3.5 py-2 text-xs font-bold", on ? "bg-navy text-white" : "bg-fill text-ink")} {...p}>
      {children}
    </button>
  );
}

// Filter chip bar + sheet. Filters live in the URL so results are shareable and server-rendered.
export default function FilterSheet({ count }) {
  const cities = CUSTOMER_CITIES;
  const router = useRouter();
  const sp = useSearchParams();
  const rent = sp.get("p") === "rent";
  const steps = rent ? RENT_STEPS : SALE_STEPS;
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(null);

  const start = () => {
    setF({
      min: Number(sp.get("min") ?? 0),
      max: Number(sp.get("max") ?? 0),
      bhk: csv(sp.get("bhk")).map(Number),
      type: csv(sp.get("type")),
      poss: csv(sp.get("poss")),
      furn: csv(sp.get("furn")),
      city: DEFAULT_CITY,
    });
    setOpen(true);
  };

  const apply = (next) => {
    const q = new URLSearchParams(sp.toString());
    q.delete("limit");
    const put = (k, v) => (v && String(v).length ? q.set(k, v) : q.delete(k));
    put("min", next.min || "");
    put("max", next.max || "");
    put("bhk", next.bhk.join(","));
    put("type", next.type.join(","));
    put("poss", next.poss.join(","));
    put("furn", next.furn.join(","));
    put("city", next.city);
    router.push(`/search?${q}`);
    setOpen(false);
  };

  const active = ["min", "max", "bhk", "type", "poss", "furn"].filter((k) => sp.get(k)).length;
  const chips = [];
  if (sp.get("min") || sp.get("max")) chips.push([`${label(Number(sp.get("min") ?? 0), rent)} – ${sp.get("max") ? label(Number(sp.get("max")), rent) : "Any"}`, ["min", "max"]]);
  if (sp.get("bhk")) chips.push([`${sp.get("bhk").split(",").join(" & ")} BHK`, ["bhk"]]);
  if (sp.get("type")) chips.push([sp.get("type").split(",").map((t) => TYPE_LABEL[t]).join(", "), ["type"]]);
  if (sp.get("poss")) chips.push([sp.get("poss") === "READY" ? "Ready to move" : sp.get("poss").includes("READY") ? "Any possession" : "Under construction", ["poss"]]);
  if (sp.get("furn")) chips.push([sp.get("furn").split(",").join(", "), ["furn"]]);

  const drop = (keys) => {
    const q = new URLSearchParams(sp.toString());
    keys.forEach((k) => q.delete(k));
    q.delete("limit");
    router.push(`/search?${q}`);
  };

  return (
    <>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <button type="button" onClick={start} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-navy px-3.5 py-2 text-xs font-bold text-white">
          <Icon name="filter" className="h-3.5 w-3.5" /> Filters
          {active > 0 && <span className="grid h-4 w-4 place-items-center rounded-full bg-brand text-[10px]">{active}</span>}
        </button>
        {chips.map(([t, keys]) => (
          <button key={t} type="button" onClick={() => drop(keys)} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold">
            {t} <Icon name="x" className="h-3 w-3" />
          </button>
        ))}
      </div>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Filters"
        footer={
          f && (
            <div className="flex gap-2">
              <button type="button" onClick={() => apply({ min: 0, max: 0, bhk: [], type: [], poss: [], furn: [], city: f.city })} className={btn("soft", "flex-1")}>
                Reset
              </button>
              <button type="button" onClick={() => apply(f)} className={btn("primary", "flex-[2]")}>
                Apply filters
              </button>
            </div>
          )
        }
      >
        {f && (
          <>
            <Group title="City">
              {cities.map((c) => (
                <Chip key={c} on={f.city === c} onClick={() => setF({ ...f, city: c })}>
                  {c}
                </Chip>
              ))}
            </Group>
            <div className="mb-4 grid grid-cols-2 gap-3">
              {[["min", "Min budget"], ["max", "Max budget"]].map(([k, l]) => (
                <label key={k} className="block">
                  <span className="mb-1 block text-[11px] font-bold text-mute">{l}</span>
                  <select value={f[k]} onChange={(e) => setF({ ...f, [k]: Number(e.target.value) })} className="w-full rounded-xl border border-line bg-fill px-3 py-3 text-sm">
                    {steps.map((s) => (
                      <option key={s} value={s}>{label(s, rent)}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <Group title="BHK">
              {[1, 2, 3, 4, 5].map((n) => (
                <Chip key={n} on={f.bhk.includes(n)} onClick={() => setF({ ...f, bhk: toggle(f.bhk, n) })}>
                  {n === 5 ? "5+" : n}
                </Chip>
              ))}
            </Group>
            <Group title="Property type">
              {Object.entries(TYPE_LABEL).map(([k, l]) => (
                <Chip key={k} on={f.type.includes(k)} onClick={() => setF({ ...f, type: toggle(f.type, k) })}>
                  {l}
                </Chip>
              ))}
            </Group>
            <Group title="Possession">
              {[["READY", "Ready to move"], ["UNDER_CONSTRUCTION", "Under construction"]].map(([k, l]) => (
                <Chip key={k} on={f.poss.includes(k)} onClick={() => setF({ ...f, poss: toggle(f.poss, k) })}>
                  {l}
                </Chip>
              ))}
            </Group>
            <Group title="Furnishing">
              {["Unfurnished", "Semi-Furnished", "Fully Furnished"].map((k) => (
                <Chip key={k} on={f.furn.includes(k)} onClick={() => setF({ ...f, furn: toggle(f.furn, k) })}>
                  {k}
                </Chip>
              ))}
            </Group>
          </>
        )}
      </Sheet>
    </>
  );
}
