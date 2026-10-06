/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveTestimonial } from "@/app/actions/testimonials";
import { uploadMedia } from "@/lib/upload-client";
import { Card, Field, inputCls, btn } from "@/components/ui";
export default function TestimonialEditor({ initial }) {
  const [d, set] = useState(
      initial || {
        name: "",
        feedback: "",
        reference: "",
        imageUrl: "",
        videoUrl: "",
        sort: 0,
        published: false,
      },
    ),
    [error, setError] = useState(""),
    [uploading, upload] = useState(false),
    [pending, start] = useTransition();
  const router = useRouter();
  const field = (k, v) => set((x) => ({ ...x, [k]: v }));
  async function media(file, kind) {
    upload(true);
    setError("");
    try {
      field(
        kind === "VIDEO" ? "videoUrl" : "imageUrl",
        await uploadMedia(file, kind),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      upload(false);
    }
  }
  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            try {
              const r = await saveTestimonial(initial?.id, d);
              if (r.error) setError(r.error);
              else router.push("/owner/testimonials");
            } catch {
              setError("Unable to save. Try again.");
            }
          });
        }}
        className="space-y-4"
      >
        <Field label="Customer name">
          <input
            required
            value={d.name}
            maxLength={80}
            onChange={(e) => field("name", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Feedback">
          <textarea
            required
            rows={5}
            maxLength={3000}
            value={d.feedback}
            onChange={(e) => field("feedback", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Property/project reference (optional)">
          <input
            value={d.reference || ""}
            maxLength={200}
            onChange={(e) => field("reference", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Feedback image / customer photo">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading || pending}
            onChange={(e) =>
              e.target.files[0] && media(e.target.files[0], "IMAGE")
            }
          />
        </Field>
        {d.imageUrl && (
          <div className="space-y-2">
            <img
              src={d.imageUrl}
              alt="Feedback preview"
              className="max-h-64 rounded-xl"
            />
            <button
              type="button"
              onClick={() => field("imageUrl", "")}
              className={btn("soft")}
            >
              Remove image
            </button>
          </div>
        )}
        <Field label="Testimonial video">
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            disabled={uploading || pending}
            onChange={(e) =>
              e.target.files[0] && media(e.target.files[0], "VIDEO")
            }
          />
        </Field>
        {d.videoUrl && (
          <div className="space-y-2">
            <video
              src={d.videoUrl}
              controls
              preload="metadata"
              className="max-h-64 rounded-xl"
            />
            <button
              type="button"
              onClick={() => field("videoUrl", "")}
              className={btn("soft")}
            >
              Remove video
            </button>
          </div>
        )}
        <Field label="Display order (lower first)">
          <input
            type="number"
            min="-10000"
            max="10000"
            value={d.sort}
            onChange={(e) => field("sort", e.target.value)}
            className={inputCls}
          />
        </Field>
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={d.published}
            onChange={(e) => field("published", e.target.checked)}
          />
          Publish on customer app
        </label>
        {uploading && <p role="status">Uploading media…</p>}
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <button disabled={pending || uploading} className={btn("brand")}>
          {pending ? "Saving…" : "Save testimonial"}
        </button>
      </form>
    </Card>
  );
}
