"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import BackBar from "@/components/BackBar";
import Sheet from "@/components/Sheet";
import MiniMap from "@/components/MiniMap";
import { Card, Icon, Pill, btn, cx, inputCls } from "@/components/ui";
import { saveProperty } from "@/app/actions/owner";
import { AMENITIES, CITIES, CITY_COORDS, FACING, FURNISHING, TYPE_LABEL, formatInr, imgUrl } from "@/lib/format";

const STEPS = [["Basic info", "Type & place"], ["Details", "BHK & area"], ["Pricing", "Price & media"]];
const MAX_PHOTOS = 20;

const EMPTY = {
  purpose: "SALE", type: "APARTMENT", title: "", city: "Mumbai", locality: "", society: "", lat: "", lng: "",
  bedrooms: 2, bathrooms: 2, balconies: 1, carpetArea: "", superArea: "", floor: "", totalFloors: "",
  furnishing: "Semi-Furnished", facing: "", possession: "READY", possessionBy: "", amenities: [],
  nearby: [{ label: "", distance: "" }, { label: "", distance: "" }, { label: "", distance: "" }],
  description: "", reraId: "", price: "", negotiable: false, deposit: "", media: [], confirmed: false,
};

function Chip({ on, children, ...p }) {
  return (
    <button type="button" aria-pressed={on} className={cx("rounded-full px-4 py-2.5 text-[13px] font-bold", on ? "bg-navy text-white" : "bg-fill text-ink")} {...p}>
      {children}
    </button>
  );
}
const Label = ({ children }) => <span className="mb-1.5 block text-[11px] font-bold text-mute">{children}</span>;

// Resize big phone photos before upload (max 1600px, JPEG 85%).
async function shrink(file) {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.85));
    return blob ? new File([blob], "photo.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

export default function PostWizard({ initial, id: initialId }) {
  const router = useRouter();
  const [id, setId] = useState(initialId ?? null);
  const [step, setStep] = useState(1);
  const [d, setD] = useState({ ...EMPTY, ...(initial ?? {}) });
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [pending, start] = useTransition();
  const photoRef = useRef(null);
  const videoRef = useRef(null);

  const set = (k, v) => setD((x) => ({ ...x, [k]: v }));
  const rent = d.purpose === "RENT";
  const land = d.type === "PLOT";
  const comm = d.type === "COMMERCIAL";
  const images = d.media.filter((m) => m.kind === "IMAGE");
  const video = d.media.find((m) => m.kind === "VIDEO");
  const center = CITY_COORDS[d.city];

  function checkStep(n) {
    if (n === 1) {
      if (!d.title.trim()) return "Add a property title.";
      if (!d.city || !d.locality.trim()) return "City and locality are required.";
    }
    if (n === 3) {
      if (!d.price || Number(d.price) <= 0) return "Enter the price.";
      if (images.length < 4) return "Add at least 4 photos.";
      if (!d.confirmed) return "Please confirm the details are correct.";
    }
    return "";
  }

  function next() {
    const e = checkStep(step);
    setErr(e);
    if (!e) {
      setStep(step + 1);
      window.scrollTo({ top: 0 });
    }
  }

  async function upload(files, kind) {
    setErr("");
    const list = [...files];
    if (kind === "IMAGE" && images.length + list.length > MAX_PHOTOS) return setErr(`You can add up to ${MAX_PHOTOS} photos.`);
    setUploading((n) => n + list.length);
    for (const f of list) {
      try {
        const file = kind === "IMAGE" ? await shrink(f) : f;
        if (kind === "IMAGE" && file.size > 8 * 1024 * 1024) throw new Error("Image must be under 8 MB.");
        if (kind === "VIDEO" && file.size > 80 * 1024 * 1024) throw new Error("Video must be under 80 MB.");
        const ticket = await (await fetch("/api/owner/upload-sign", { method: "POST" })).json();
        if (ticket.error) throw new Error(ticket.error);
        let out;
        if (ticket.mode === "cloudinary") {
          // straight from the browser to Cloudinary (signed), so big videos never pass through our server
          const body = new FormData();
          body.append("file", file);
          body.append("api_key", ticket.apiKey);
          body.append("timestamp", ticket.timestamp);
          body.append("signature", ticket.signature);
          body.append("folder", ticket.folder);
          const res = await fetch(`https://api.cloudinary.com/v1_1/${ticket.cloud}/${kind === "VIDEO" ? "video" : "image"}/upload`, { method: "POST", body });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error?.message || "Upload failed");
          out = { url: json.secure_url, kind };
        } else {
          const body = new FormData();
          body.append("file", file);
          const res = await fetch("/api/owner/upload", { method: "POST", body });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Upload failed");
          out = { url: json.url, kind: json.kind };
        }
        setD((x) => ({ ...x, media: [...x.media.filter((m) => !(kind === "VIDEO" && m.kind === "VIDEO")), out] }));
      } catch (e) {
        setErr(e.message || "Upload failed. Try again.");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  const removeMedia = (url) => set("media", d.media.filter((m) => m.url !== url));
  const makeCover = (url) => {
    const pick = d.media.find((m) => m.url === url);
    set("media", [pick, ...d.media.filter((m) => m.url !== url)]);
  };

  function submit(publish) {
    const e = publish ? checkStep(1) || checkStep(3) : !d.title.trim() ? "Add a title before saving a draft." : "";
    if (e) {
      setErr(e);
      if (publish && !checkStep(1)) setStep(3);
      else setStep(1);
      return;
    }
    setErr("");
    setNotice("");
    start(async () => {
      const res = await saveProperty(id, d, publish);
      if (res?.error) {
        setErr(res.error);
        if (res.step) setStep(res.step);
        return;
      }
      setId(res.id);
      if (publish) router.push(`/owner/post/done?id=${res.id}`);
      else setNotice("Draft saved. You can continue later from Listings.");
    });
  }

  function useMyLocation() {
    navigator.geolocation?.getCurrentPosition(
      (p) => setD((x) => ({ ...x, lat: p.coords.latitude, lng: p.coords.longitude })),
      () => setErr("Could not read your location. Tap the map to set the pin."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <>
      <BackBar owner title={id ? "Edit listing" : "Post Property"} fallback="/owner/dashboard" />
      <div className="flex-1 space-y-4 px-4 pb-6 pt-4">
        <div className="space-y-1">
          <Pill tone="brand">FREE LISTING</Pill>
          <h1 className="text-2xl font-extrabold tracking-tight">{id ? "Update your listing" : "List property for free"}</h1>
          <p className="text-sm text-mute">Fill the basics, set the price and add photos. Your listing goes live for buyers immediately.</p>
        </div>

        <div className="rounded-2xl bg-white p-2 ring-1 ring-line">
          <div className="grid grid-cols-3 gap-1.5">
            {STEPS.map(([t, s], i) => (
              <button key={t} type="button" onClick={() => i + 1 < step && setStep(i + 1)} className={cx("rounded-xl px-2.5 py-2 text-left", step === i + 1 ? "bg-navy text-white" : "text-mute")}>
                <span className="block text-[12px] font-extrabold">{i + 1} {t}</span>
                <span className="block text-[10px] opacity-70">{s}</span>
              </button>
            ))}
          </div>
          <div className="mx-1 mt-2 h-1 overflow-hidden rounded-full bg-fill"><div className="h-full rounded-full bg-navy transition-all" style={{ width: `${(step / 3) * 100}%` }} /></div>
        </div>

        {step === 1 && (
          <>
            <Card className="space-y-2.5">
              <Label>I want to</Label>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-fill p-1 text-[13px] font-bold">
                {[["SALE", "Sell / Resale"], ["RENT", "Rent / Lease"]].map(([v, l]) => (
                  <button key={v} type="button" aria-pressed={d.purpose === v} onClick={() => set("purpose", v)} className={cx("rounded-lg py-2.5", d.purpose === v ? "bg-navy text-white" : "text-mute")}>{l}</button>
                ))}
              </div>
            </Card>
            <Card className="space-y-2.5">
              <Label>Property type</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(TYPE_LABEL).map(([v, l]) => <Chip key={v} on={d.type === v} onClick={() => set("type", v)}>{l}</Chip>)}
              </div>
            </Card>
            <Card className="space-y-2">
              <label><Label>Property title</Label>
                <input value={d.title} onChange={(e) => set("title", e.target.value)} maxLength={120} placeholder="e.g. 3 BHK sea-facing flat in Bandra" className={inputCls} />
              </label>
              <p className="text-[11.5px] text-mute">💡 A descriptive title attracts more inquiries.</p>
            </Card>
            <Card className="space-y-3">
              <h2 className="text-[14px] font-extrabold">Location details</h2>
              <label><Label>City</Label>
                <select value={d.city} onChange={(e) => set("city", e.target.value)} className={inputCls}>
                  {CITIES.map((c) => <option key={c.name} value={c.name}>{c.name}, {c.state}</option>)}
                </select>
              </label>
              <label><Label>Locality</Label>
                <input value={d.locality} onChange={(e) => set("locality", e.target.value)} maxLength={120} placeholder="e.g. Bandra West" className={inputCls} />
              </label>
              <label><Label>Society / project name (optional)</Label>
                <input value={d.society} onChange={(e) => set("society", e.target.value)} maxLength={120} placeholder="e.g. Palm Grove Apartments" className={inputCls} />
              </label>
              <div className="flex items-center gap-3 rounded-xl bg-fill px-3.5 py-3">
                <Icon name="pin" className="h-5 w-5 shrink-0" />
                <p className="min-w-0 flex-1 text-xs font-semibold">{d.lat !== "" ? `Pin set (${Number(d.lat).toFixed(4)}, ${Number(d.lng).toFixed(4)})` : "Pin location on map for exact accuracy"}</p>
                <button type="button" onClick={() => setPinOpen(true)} className={btn("primary", "!px-3.5 !py-2 text-xs")}>{d.lat !== "" ? "Change" : "Set pin"}</button>
              </div>
            </Card>
          </>
        )}

        {step === 2 && (
          <>
            {!land && (
              <Card className="space-y-3">
                {!comm && (
                  <div><Label>Bedrooms</Label><div className="flex flex-wrap gap-2">{[1, 2, 3, 4, 5].map((n) => <Chip key={n} on={d.bedrooms === n} onClick={() => set("bedrooms", n)}>{n === 5 ? "5+" : n}</Chip>)}</div></div>
                )}
                <div><Label>{comm ? "Washrooms" : "Bathrooms"}</Label><div className="flex flex-wrap gap-2">{[1, 2, 3, 4].map((n) => <Chip key={n} on={d.bathrooms === n} onClick={() => set("bathrooms", n)}>{n === 4 ? "4+" : n}</Chip>)}</div></div>
                {!comm && <div><Label>Balconies</Label><div className="flex flex-wrap gap-2">{[0, 1, 2, 3].map((n) => <Chip key={n} on={d.balconies === n} onClick={() => set("balconies", n)}>{n === 3 ? "3+" : n}</Chip>)}</div></div>}
              </Card>
            )}
            <Card className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label><Label>{land ? "Plot area (sq.ft)" : "Carpet area (sq.ft)"}</Label><input inputMode="numeric" value={d.carpetArea} onChange={(e) => set("carpetArea", e.target.value.replace(/\D/g, ""))} className={inputCls} /></label>
                {!land && <label><Label>Super built-up (sq.ft)</Label><input inputMode="numeric" value={d.superArea} onChange={(e) => set("superArea", e.target.value.replace(/\D/g, ""))} className={inputCls} /></label>}
                {land && <label><Label>Super area (sq.ft, optional)</Label><input inputMode="numeric" value={d.superArea} onChange={(e) => set("superArea", e.target.value.replace(/\D/g, ""))} className={inputCls} /></label>}
              </div>
              {!land && (
                <div className="grid grid-cols-2 gap-3">
                  <label><Label>Floor</Label><input inputMode="numeric" value={d.floor} onChange={(e) => set("floor", e.target.value.replace(/\D/g, ""))} className={inputCls} /></label>
                  <label><Label>Total floors</Label><input inputMode="numeric" value={d.totalFloors} onChange={(e) => set("totalFloors", e.target.value.replace(/\D/g, ""))} className={inputCls} /></label>
                </div>
              )}
            </Card>
            <Card className="space-y-3">
              {!land && <div><Label>Furnishing</Label><div className="flex flex-wrap gap-2">{FURNISHING.map((f) => <Chip key={f} on={d.furnishing === f} onClick={() => set("furnishing", f)}>{f}</Chip>)}</div></div>}
              <div><Label>Facing</Label><div className="flex flex-wrap gap-2">{FACING.map((f) => <Chip key={f} on={d.facing === f} onClick={() => set("facing", d.facing === f ? "" : f)}>{f}</Chip>)}</div></div>
              <div><Label>Possession</Label>
                <div className="flex flex-wrap gap-2">{[["READY", "Ready to move"], ["UNDER_CONSTRUCTION", "Under construction"]].map(([v, l]) => <Chip key={v} on={d.possession === v} onClick={() => set("possession", v)}>{l}</Chip>)}</div>
                {d.possession === "UNDER_CONSTRUCTION" && <input value={d.possessionBy} onChange={(e) => set("possessionBy", e.target.value)} placeholder="Possession by, e.g. Dec 2027" maxLength={30} className={`${inputCls} mt-2`} />}
              </div>
            </Card>
            <Card className="space-y-2.5">
              <Label>Amenities</Label>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map((a) => <Chip key={a} on={d.amenities.includes(a)} onClick={() => set("amenities", d.amenities.includes(a) ? d.amenities.filter((x) => x !== a) : [...d.amenities, a])}>{a}</Chip>)}
              </div>
            </Card>
            <Card className="space-y-2.5">
              <Label>Nearby places (optional)</Label>
              {d.nearby.map((n, i) => (
                <div key={i} className="grid grid-cols-[1fr_6.5rem] gap-2">
                  <input value={n.label} onChange={(e) => set("nearby", d.nearby.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder={["Metro station", "Hospital", "Airport"][i]} maxLength={40} className={inputCls} />
                  <input value={n.distance} onChange={(e) => set("nearby", d.nearby.map((x, j) => (j === i ? { ...x, distance: e.target.value } : x)))} placeholder="800 m" maxLength={20} className={inputCls} />
                </div>
              ))}
            </Card>
            <Card className="space-y-3">
              <label><Label>Description</Label>
                <textarea value={d.description} onChange={(e) => set("description", e.target.value)} rows={5} maxLength={3000} placeholder="Describe the home: layout, view, flooring, kitchen, what is nearby…" className={inputCls} />
              </label>
              <label><Label>RERA ID (optional)</Label><input value={d.reraId} onChange={(e) => set("reraId", e.target.value)} maxLength={40} className={inputCls} /></label>
            </Card>
          </>
        )}

        {step === 3 && (
          <>
            <Card className="space-y-3">
              <label><Label>{rent ? "Monthly rent (₹)" : "Expected price (₹)"}</Label>
                <input inputMode="numeric" value={d.price} onChange={(e) => set("price", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder={rent ? "e.g. 38000" : "e.g. 37500000"} className={`${inputCls} text-lg font-extrabold`} />
              </label>
              {d.price && <p className="text-xs font-bold text-brand">{formatInr(Number(d.price))}{rent ? " per month" : ""}{!rent && d.superArea ? ` · ₹${Math.round(Number(d.price) / Number(d.superArea)).toLocaleString("en-IN")}/sq.ft` : ""}</p>}
              {rent && (
                <label><Label>Security deposit (₹)</Label><input inputMode="numeric" value={d.deposit} onChange={(e) => set("deposit", e.target.value.replace(/\D/g, ""))} className={inputCls} /></label>
              )}
              <label className="flex items-center gap-2.5 text-sm font-semibold">
                <input type="checkbox" checked={d.negotiable} onChange={(e) => set("negotiable", e.target.checked)} className="h-5 w-5 accent-[#0b1426]" /> Price is negotiable
              </label>
            </Card>

            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-extrabold">Photos & video</h2>
                <span className="text-[11px] font-bold text-mute">{images.length}/{MAX_PHOTOS} photos · min 4</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {images.map((m, i) => (
                  <div key={m.url} className="relative aspect-square overflow-hidden rounded-xl bg-fill">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl(m.url, 300)} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                    {i === 0 ? <span className="absolute left-1 top-1 rounded-full bg-navy px-2 py-0.5 text-[9px] font-bold text-white">COVER</span> : (
                      <button type="button" onClick={() => makeCover(m.url)} className="absolute left-1 top-1 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold">Make cover</button>
                    )}
                    <button type="button" onClick={() => removeMedia(m.url)} aria-label="Remove photo" className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/90"><Icon name="x" className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
                {uploading > 0 && Array.from({ length: uploading }).map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-xl bg-fill" />)}
              </div>
              <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { upload(e.target.files, "IMAGE"); e.target.value = ""; }} />
              <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/quicktime" hidden onChange={(e) => { upload(e.target.files, "VIDEO"); e.target.value = ""; }} />
              <button type="button" onClick={() => photoRef.current?.click()} className={btn("outline", "w-full")}><Icon name="camera" className="h-4 w-4" />Add photos</button>
              {video ? (
                <div className="space-y-2">
                  <video src={video.url} controls playsInline preload="metadata" className="aspect-video w-full rounded-xl bg-black" />
                  <button type="button" onClick={() => removeMedia(video.url)} className="text-xs font-bold text-red-600">Remove video</button>
                </div>
              ) : (
                <button type="button" onClick={() => videoRef.current?.click()} className={btn("outline", "w-full")}><Icon name="play" className="h-4 w-4" />Add video (optional, max 80 MB)</button>
              )}
            </Card>

            <Card className="space-y-2">
              <h2 className="text-[14px] font-extrabold">Contact shown to buyers</h2>
              <p className="text-xs text-mute">Buyers reach you through the Brickbaaz owner desk: WhatsApp, call and visit requests. Your inquiries arrive in this app.</p>
            </Card>
            <label className="flex items-start gap-2.5 text-[13px] font-semibold">
              <input type="checkbox" checked={d.confirmed} onChange={(e) => set("confirmed", e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#0b1426]" />
              I confirm these details are correct.
            </label>
          </>
        )}

        {err && <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-700">{err}</p>}
        {notice && <p role="status" className="rounded-xl bg-green-50 px-3.5 py-2.5 text-xs font-bold text-ok">{notice}</p>}
      </div>

      <div className="sticky bottom-0 z-30 space-y-2 border-t border-line bg-white px-4 pt-3" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <div className="flex gap-2">
          {step > 1 && <button type="button" onClick={() => setStep(step - 1)} className={btn("soft", "flex-1")}>← Back</button>}
          {step < 3 ? (
            <button type="button" onClick={next} className={btn("primary", "flex-[2]")}>Continue to {STEPS[step][0].toLowerCase()} →</button>
          ) : (
            <button type="button" disabled={pending || uploading > 0} onClick={() => submit(true)} className={btn("brand", "flex-[2]")}>
              {pending ? "Publishing…" : uploading ? "Uploading…" : id && initial?.status === "ACTIVE" ? "Save changes" : "🚀 Publish listing"}
            </button>
          )}
        </div>
        <button type="button" disabled={pending} onClick={() => submit(false)} className="w-full text-center text-xs font-bold text-mute">
          Save as draft
        </button>
      </div>

      <Sheet open={pinOpen} onClose={() => setPinOpen(false)} title="Set exact location" footer={
        <div className="flex gap-2">
          <button type="button" onClick={useMyLocation} className={btn("soft", "flex-1")}>Use my location</button>
          <button type="button" onClick={() => setPinOpen(false)} className={btn("primary", "flex-1")}>Done</button>
        </div>
      }>
        <p className="mb-2 text-xs text-mute">Tap the map to drop the pin on your building.</p>
        <div className="h-72 overflow-hidden rounded-2xl border border-line">
          <MiniMap
            center={center}
            pin={d.lat !== "" && d.lat != null ? { lat: Number(d.lat), lng: Number(d.lng) } : null}
            onPick={(p) => setD((x) => ({ ...x, lat: p.lat, lng: p.lng }))}
            zoom={d.lat !== "" ? 16 : 12}
          />
        </div>
      </Sheet>
    </>
  );
}
