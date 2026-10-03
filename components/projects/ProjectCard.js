/* eslint-disable @next/next/no-img-element -- Cloudinary handles image delivery; uploads also support local development URLs. */
import Link from "next/link";
import { Card, Pill, btn } from "@/components/ui";
import { formatInr, imgUrl } from "@/lib/format";
import { priceOf } from "@/lib/projects";
export default function ProjectCard({ project: p }) {
  const photo = p.assets.find((a) => a.kind === "IMAGE"),
    price = priceOf(p);
  return (
    <Card className="overflow-hidden !p-0">
      <Link href={`/projects/${p.slug}`}>
        {photo ? (
          <img
            src={imgUrl(photo.url, 800)}
            alt={p.name}
            className="h-48 w-full object-cover"
          />
        ) : (
          <div className="grid h-40 place-items-center bg-fill text-mute">
            Project photos coming soon
          </div>
        )}
        <div className="space-y-2 p-4">
          <div className="flex flex-wrap gap-2">
            {p.featured && <Pill tone="brand">FEATURED</Pill>}
            <Pill>{p.possession.replaceAll("_", " ")}</Pill>
          </div>
          <h2 className="text-lg font-extrabold">{p.name}</h2>
          <p className="text-xs text-mute">By {p.builder.name}</p>
          <p className="text-sm">
            {p.locality}, {p.city}
            {p.state ? `, ${p.state}` : ""}
          </p>
          <p className="text-lg font-bold">
            {price ? `${formatInr(price)} onwards` : "Price on request"}
          </p>
          <p className="text-xs text-mute">
            {p.configurations.map((c) => c.label).join(" · ")}
          </p>
          {p.reraId && <p className="text-xs">RERA: {p.reraId}</p>}
          <span className={btn("soft", "w-full")}>Explore project</span>
        </div>
      </Link>
    </Card>
  );
}
