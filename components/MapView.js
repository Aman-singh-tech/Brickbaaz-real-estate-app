"use client";

import { useEffect, useRef } from "react";

// Leaflet map. Modes:
//  - markers: [{id, lat, lng, label, href}] shows price pins
//  - pin: {lat,lng} shows a single marker; onPick enables click-to-set
// OpenStreetMap tiles; keep usage light or switch to a paid tile provider for heavy traffic.
export default function MapView({ markers = [], pin = null, onPick, className = "h-full w-full", zoom, interactive = true, onMarkerClick, center }) {
  const el = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const cb = useRef({ onPick, onMarkerClick });
  cb.current = { onPick, onMarkerClick };

  useEffect(() => {
    let dead = false;
    let resizeTimer;
    (async () => {
      const L = (await import("leaflet")).default;
      if (dead || !el.current) return;
      const first = pin ?? markers[0] ?? center;
      const m = L.map(el.current, {
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: false,
        doubleClickZoom: interactive,
        touchZoom: interactive,
        attributionControl: true,
      }).setView(first ? [first.lat, first.lng] : [19.076, 72.8777], zoom ?? (first ? 14 : 11));
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(m);
      layer.current = L.layerGroup().addTo(m);
      map.current = { L, m };
      if (onPick) m.on("click", (e) => cb.current.onPick?.({ lat: e.latlng.lat, lng: e.latlng.lng }));
      draw();
      resizeTimer = setTimeout(() => { if (!dead) m.invalidateSize(); }, 150);
    })();
    return () => {
      dead = true;
      clearTimeout(resizeTimer);
      map.current?.m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw() {
    const ctx = map.current;
    if (!ctx) return;
    const { L, m } = ctx;
    layer.current.clearLayers();
    if (pin) {
      L.marker([pin.lat, pin.lng], { icon: L.divIcon({ className: "", html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#e07a1f;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 6px #0004"></div>', iconSize: [22, 22], iconAnchor: [11, 22] }) }).addTo(layer.current);
    }
    const pts = [];
    for (const k of markers) {
      pts.push([k.lat, k.lng]);
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:#0b1426;color:#fff;font:700 11px system-ui;padding:3px 8px;border-radius:99px;white-space:nowrap;border:2px solid #fff;box-shadow:0 2px 6px #0004;transform:translate(-50%,-50%)">${k.label}</div>`,
        iconSize: [0, 0],
      });
      L.marker([k.lat, k.lng], { icon }).on("click", () => cb.current.onMarkerClick?.(k)).addTo(layer.current);
    }
    if (pts.length > 1) m.fitBounds(pts, { padding: [40, 40], maxZoom: 15 });
    else if (pts.length === 1 && !pin) m.setView(pts[0], 14);
    if (pin) m.setView([pin.lat, pin.lng], Math.max(m.getZoom(), zoom ?? 14));
  }

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(markers), pin?.lat, pin?.lng]);

  return <div ref={el} className={className} />;
}
