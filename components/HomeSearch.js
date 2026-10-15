"use client";
import { useState } from "react";
import Link from "next/link";
import { TYPE_LABEL } from "@/lib/format";
import { CUSTOMER_CITIES } from "@/lib/city";
import { btn, Icon } from "@/components/ui";
export default function HomeSearch({ purpose: initialPurpose, city }) {
  const [purpose, setPurpose] = useState(initialPurpose);
  return (<form action="/search" className="space-y-3">
          <div className="grid grid-cols-3 rounded-xl bg-fill p-1 text-center text-[13px] font-bold">
            {[
              ["sale", "Buy Properties"],
              ["rent", "Rent Homes"],
            ].map(([v, l]) => (
              <label
                key={v}
                className="cursor-pointer rounded-lg py-2.5 has-[:checked]:bg-white has-[:checked]:shadow-sm"
              >
                <input
                  type="radio"
                  name="p"
                  value={v}
                  checked={purpose === v}
                  onChange={() => setPurpose(v)}
                  className="sr-only"
                />
                {l}
              </label>
            ))}
            <Link href="/projects" className="rounded-lg py-2.5 hover:bg-white">Builder Projects</Link>
          </div>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-mute">
              Selected city
            </span>
            <select
              name="city"
              aria-label="Selected city"
              defaultValue={city}
              className="w-full rounded-xl border border-line bg-fill px-3.5 py-3 text-sm font-semibold"
            >
              {CUSTOMER_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-mute">
              Locality, project or BHK
            </span>
            <input
              name="q"
              aria-label="Locality, project or BHK"
              placeholder="e.g. Sector 67, Golf Course Road, 3 BHK"
              className="w-full rounded-xl border border-line bg-fill px-3.5 py-3 text-sm outline-none focus:border-navy"
            />
          </label>
          <label className="block"><span className="mb-1 block text-[11px] font-bold text-mute">Property type</span><select aria-label="Property type" name="type" className="w-full rounded-xl border border-line bg-fill px-3.5 py-3 text-sm" defaultValue=""><option value="">All types</option>{Object.entries(TYPE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="block"><span className="mb-1 block text-[11px] font-bold text-mute">Maximum budget</span><select aria-label="Maximum budget" key={purpose} name="max" className="w-full rounded-xl border border-line bg-fill px-3.5 py-3 text-sm" defaultValue=""><option value="">Any budget</option>{(purpose === "rent" ? [[25000,"₹25,000 / month"],[50000,"₹50,000 / month"],[100000,"₹1 lakh / month"]] : [[10000000,"₹1 Cr"],[30000000,"₹3 Cr"],[50000000,"₹5 Cr"]]).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <button className={btn("primary", "w-full")}>
            <Icon name="search" className="h-4 w-4" />
            Search Properties
          </button>
        </form>);
}
