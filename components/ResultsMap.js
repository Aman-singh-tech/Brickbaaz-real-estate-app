"use client";

import { useState } from "react";
import Link from "next/link";
import MapView from "@/components/MapView";
import { formatInr, imgUrl } from "@/lib/format";
import { Icon } from "@/components/ui";

// Map of search results: price pins, tap a pin for a summary card.
export default function ResultsMap({ items }) {
  const [sel, setSel] = useState(null);
  const withPin = items.filter((p) => p.lat != null && p.lng != null);
  const markers = withPin.map((p) => ({
    id: p.id,
    lat: p.lat,
    lng: p.lng,
    label: p.purpose === "RENT" ? `₹${Math.round(p.price / 1000)}k` : formatInr(p.price).replace(" Lakhs", "L").replace(" Lakh", "L"),
  }));
  const p = withPin.find((x) => x.id === sel);
  return (
    <div className="relative h-[calc(100dvh-210px)] min-h-[360px] overflow-hidden rounded-3xl border border-line">
      {markers.length ? (
        <MapView markers={markers} onMarkerClick={(m) => setSel(m.id)} />
      ) : (
        <div className="grid h-full place-items-center bg-fill p-6 text-center text-sm text-mute">No listings with a map pin match these filters.</div>
      )}
      {p && (
        <Link href={`/property/${p.id}`} className="absolute inset-x-3 bottom-3 z-[500] flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-xl">
          <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-fill">
            {p.media?.[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgUrl(p.media[0].url, 240)} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-extrabold">{formatInr(p.price)}{p.purpose === "RENT" && <span className="text-xs text-mute">/mo</span>}</p>
            <p className="truncate text-xs font-bold">{p.title}</p>
            <p className="truncate text-[11px] text-mute">{p.locality}, {p.city}</p>
          </div>
          <Icon name="back" className="h-4 w-4 rotate-180 text-mute" />
        </Link>
      )}
    </div>
  );
}
