/* eslint-disable @next/next/no-img-element -- Cloudinary handles image delivery; uploads also support local development URLs. */
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProject } from "@/app/actions/projects";
import { Card, Field, inputCls, btn } from "@/components/ui";
import MiniMap from "@/components/MiniMap";
const blank = {
  name: "",
  builder: "",
  city: "",
  state: "",
  locality: "",
  lat: "",
  lng: "",
  reraId: "",
  possession: "UNDER_CONSTRUCTION",
  possessionDate: "",
  description: "",
  amenities: "",
  paymentPlan: "",
  featured: false,
  status: "DRAFT",
  configurations: [
    { label: "2 BHK", bedrooms: 2, area: "", price: "", floorPlan: "" },
  ],
  assets: [],
};
export default function ProjectEditor({ initial, builders }) {
  const [d, set] = useState(initial || blank),
    [error, setError] = useState(""),
    [uploading, setUploading] = useState(false),
    [pending, start] = useTransition(),
    router = useRouter();
  const field = (key, value) => set((x) => ({ ...x, [key]: value }));
  const config = (i, key, value) =>
    set((x) => ({
      ...x,
      configurations: x.configurations.map((c, j) =>
        i === j ? { ...c, [key]: value } : c,
      ),
    }));
  async function upload(file, kind, index) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const image = kind === "IMAGE" || kind === "FLOORPLAN",
        pdf = kind === "BROCHURE";
      if (image && !/^image\/(jpeg|png|webp)$/.test(file.type))
        throw Error("Choose a JPG, PNG or WebP image.");
      if (pdf && file.type !== "application/pdf")
        throw Error("Choose a PDF brochure.");
      if (kind === "VIDEO" && !/^video\/(mp4|webm|quicktime)$/.test(file.type))
        throw Error("Choose an MP4, WebM or MOV video.");
      if (file.size > (kind === "VIDEO" ? 80 : 8) * 1024 * 1024)
        throw Error("File exceeds the size limit.");
      const ticketResponse = await fetch("/api/owner/upload-sign", {
          method: "POST",
        }),
        t = await ticketResponse.json();
      if (!ticketResponse.ok) throw Error(t.error || "Sign in again.");
      const fd = new FormData();
      fd.append("file", file);
      let url;
      if (t.mode === "cloudinary") {
        for (const [k, v] of Object.entries({
          api_key: t.apiKey,
          timestamp: t.timestamp,
          signature: t.signature,
          folder: t.folder,
        }))
          fd.append(k, v);
        const type = pdf ? "raw" : kind === "VIDEO" ? "video" : "image";
        const r = await fetch(
            `https://api.cloudinary.com/v1_1/${t.cloud}/${type}/upload`,
            { method: "POST", body: fd },
          ),
          j = await r.json();
        if (!r.ok) throw Error(j.error?.message || "Upload failed");
        url = j.secure_url;
      } else {
        const r = await fetch("/api/owner/upload", {
            method: "POST",
            body: fd,
          }),
          j = await r.json();
        if (!r.ok) throw Error(j.error || "Upload failed");
        url = j.url;
      }
      if (kind === "FLOORPLAN") config(index, "floorPlan", url);
      else set((x) => ({ ...x, assets: [...x.assets, { url, kind }] }));
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }
  function save(status) {
    start(async () => {
      try {
        const r = await saveProject(initial?.id, { ...d, status });
        if (r.error) setError(r.error);
        else router.push("/owner/projects");
      } catch {
        setError("Could not save the project. Please retry.");
      }
    });
  }
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">
        {initial ? "Edit project" : "Add builder project"}
      </h1>
      <p className="text-sm text-mute">
        Projects can be in any city. Published location details are shown to
        customers.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(d.status);
        }}
        className="space-y-4"
      >
        <Card className="space-y-3">
          <h2 className="font-bold">Builder and location</h2>
          {[
            ["name", "Project name"],
            ["builder", "Builder name"],
            ["city", "City"],
            ["state", "State"],
            ["locality", "Locality / sector"],
            ["reraId", "RERA registration number"],
          ].map(([k, l]) => (
            <Field key={k} label={l}>
              <input
                value={d[k] || ""}
                onChange={(e) => field(k, e.target.value)}
                required={["name", "builder", "city", "locality"].includes(k)}
                list={k === "builder" ? "builders" : undefined}
                maxLength={k === "name" || k === "builder" ? 120 : 100}
                className={inputCls}
              />
            </Field>
          ))}
          <datalist id="builders">
            {builders.map((b) => (
              <option key={b.id} value={b.name} />
            ))}
          </datalist>
          <div className="grid grid-cols-2 gap-3">
            {["lat", "lng"].map((k) => (
              <Field key={k} label={k === "lat" ? "Latitude" : "Longitude"}>
                <input
                  type="number"
                  step="any"
                  value={d[k] ?? ""}
                  onChange={(e) => field(k, e.target.value)}
                  className={inputCls}
                />
              </Field>
            ))}
          </div>
          <div className="h-56 overflow-hidden rounded-xl">
            <MiniMap
              pin={
                d.lat !== "" && d.lng !== ""
                  ? { lat: Number(d.lat), lng: Number(d.lng) }
                  : null
              }
              center={{ lat: 20.5937, lng: 78.9629 }}
              zoom={d.lat !== "" ? 13 : 4}
              onPick={(p) => set((x) => ({ ...x, lat: p.lat, lng: p.lng }))}
            />
          </div>
          <button
            type="button"
            className={btn("soft")}
            onClick={() => {
              if (!navigator.geolocation)
                return setError("Location is unavailable.");
              navigator.geolocation.getCurrentPosition(
                (p) =>
                  set((x) => ({
                    ...x,
                    lat: p.coords.latitude,
                    lng: p.coords.longitude,
                  })),
                () =>
                  setError("Location permission failed. Place a pin manually."),
              );
            }}
          >
            Use my location
          </button>
          <p className="text-xs text-mute">Tap map to place a location pin.</p>
        </Card>
        <Card className="space-y-3">
          <h2 className="font-bold">Project details</h2>
          <Field label="Possession">
            <select
              value={d.possession}
              onChange={(e) => field("possession", e.target.value)}
              className={inputCls}
            >
              <option value="READY">Ready to move</option>
              <option value="UNDER_CONSTRUCTION">Under construction</option>
              <option value="NEW_LAUNCH">New launch</option>
            </select>
          </Field>
          <Field label="Expected possession">
            <input
              type="month"
              value={d.possessionDate || ""}
              onChange={(e) => field("possessionDate", e.target.value)}
              className={inputCls}
            />
          </Field>
          {[
            ["description", "Description"],
            ["amenities", "Amenities (comma separated)"],
            ["paymentPlan", "Payment plan / applicable charges"],
          ].map(([k, l]) => (
            <Field key={k} label={l}>
              <textarea
                value={d[k] || ""}
                onChange={(e) => field(k, e.target.value)}
                rows={4}
                className={inputCls}
              />
            </Field>
          ))}
        </Card>
        <section className="space-y-3">
          <h2 className="font-bold">Configurations</h2>
          {d.configurations.map((c, i) => (
            <Card key={i} className="space-y-3">
              {[
                ["label", "Label (e.g. 3 BHK)"],
                ["bedrooms", "Bedrooms"],
                ["area", "Area in sq.ft"],
                ["price", "Price in INR (blank = on request)"],
              ].map(([k, l]) => (
                <Field key={k} label={l}>
                  <input
                    type={k === "label" ? "text" : "number"}
                    min={k === "bedrooms" ? 0 : 1}
                    step={k === "price" ? "0.01" : 1}
                    value={c[k] ?? ""}
                    onChange={(e) => config(i, k, e.target.value)}
                    className={inputCls}
                  />
                </Field>
              ))}
              <Field label="Floor plan image">
                <input
                  disabled={uploading}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => upload(e.target.files[0], "FLOORPLAN", i)}
                />
              </Field>
              {c.floorPlan && (
                <>
                  <img
                    src={c.floorPlan}
                    alt={`${c.label} floor plan`}
                    className="max-h-48 w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => config(i, "floorPlan", "")}
                    className={btn("soft")}
                  >
                    Remove floor plan
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() =>
                  field(
                    "configurations",
                    d.configurations.filter((_, j) => j !== i),
                  )
                }
                className={btn("soft")}
              >
                Remove configuration
              </button>
            </Card>
          ))}
          <button
            type="button"
            className={btn("soft")}
            onClick={() =>
              field("configurations", [
                ...d.configurations,
                { label: "", bedrooms: "", area: "", price: "", floorPlan: "" },
              ])
            }
          >
            Add configuration
          </button>
        </section>
        <Card className="space-y-3">
          <h2 className="font-bold">Photos, video and brochure</h2>
          {[
            ["IMAGE", "Photos", "image/jpeg,image/png,image/webp"],
            ["VIDEO", "Video", "video/mp4,video/webm,video/quicktime"],
            ["BROCHURE", "Brochure PDF", "application/pdf"],
          ].map(([k, l, a]) => (
            <Field key={k} label={l}>
              <input
                type="file"
                accept={a}
                disabled={uploading}
                onChange={(e) => upload(e.target.files[0], k)}
              />
            </Field>
          ))}
          {uploading && <p role="status">Uploading…</p>}
          {d.assets.map((a, i) => (
            <div
              key={`${a.url}-${i}`}
              className="flex items-center gap-2 border-t border-line pt-2"
            >
              {a.kind === "IMAGE" ? (
                <img
                  src={a.url}
                  alt={`Project photo ${i + 1}`}
                  className="h-16 w-20 rounded object-cover"
                />
              ) : (
                <span className="text-xs">{a.kind}</span>
              )}
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline"
              >
                Open
              </a>
              <button
                type="button"
                className={btn("soft", "ml-auto")}
                onClick={() =>
                  field(
                    "assets",
                    d.assets.filter((_, j) => j !== i),
                  )
                }
              >
                Remove
              </button>
            </div>
          ))}
        </Card>
        <Card className="space-y-3">
          <Field label="Visibility">
            <select
              value={d.status}
              onChange={(e) => field("status", e.target.value)}
              className={inputCls}
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>
          <label className="flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={d.featured}
              onChange={(e) => field("featured", e.target.checked)}
            />
            Featured project
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            disabled={pending || uploading}
            className={btn("primary", "w-full")}
          >
            {pending ? "Saving…" : "Save project"}
          </button>
        </Card>
      </form>
    </div>
  );
}
