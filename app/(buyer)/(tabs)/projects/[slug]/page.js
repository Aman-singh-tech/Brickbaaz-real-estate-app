/* eslint-disable @next/next/no-img-element -- Cloudinary handles image delivery; uploads also support local development URLs. */
export const dynamic = "force-dynamic";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { projectInclude } from "@/lib/projects";
import { getBuyer } from "@/lib/auth";
import { Card, Pill } from "@/components/ui";
import { formatInr, imgUrl } from "@/lib/format";
import Gallery from "@/components/Gallery";
import MiniMap from "@/components/MiniMap";
import InterestForm from "@/components/InterestForm";
import EmiCalculator from "@/components/EmiCalculator";
import LeadForm from "@/components/projects/LeadForm";
import SaveProject from "@/components/projects/SaveProject";
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({ where: { slug }, include: projectInclude });
  if (!project || project.status !== "PUBLISHED")
    return { title: "Project unavailable", robots: { index: false, follow: false } };
  return pageMetadata(`${project.name} in ${project.city}`, `Explore ${project.name} by ${project.builder.name} in ${project.locality}, ${project.city}. View configurations, photos and amenities, and request a site visit with Brickbaaz.`, `/projects/${encodeURIComponent(slug)}`, project.assets.find(a => a.kind === "IMAGE")?.url || "/hero.jpg");
}
export default async function ProjectDetail({ params, searchParams }) {
  const { slug } = await params,
    sp = await searchParams,
    p = await prisma.project.findUnique({
      where: { slug },
      include: projectInclude,
    });
  if (!p || p.status !== "PUBLISHED") notFound();
  const u = await getBuyer(),
    saved = u
      ? !!(await prisma.savedProject.findUnique({
          where: { userId_projectId: { userId: u.id, projectId: p.id } },
        }))
      : false;
  const prices = p.configurations
    .filter((c) => c.price != null)
    .map((c) => Number(c.price));
  return (
    <div className="space-y-5 p-4">
      <Gallery
        media={p.assets.filter((a) => ["IMAGE", "VIDEO"].includes(a.kind))}
        title={p.name}
      />
      <div className="space-y-2">
        <Pill>{p.possession.replaceAll("_", " ")}</Pill>
        <h1 className="text-2xl font-extrabold">{p.name}</h1>
        <Link
          href={`/builders/${p.builderId}`}
          className="block text-sm underline"
        >
          By {p.builder.name}
        </Link>
        <p className="text-sm text-mute">
          {p.locality}, {p.city}
          {p.state ? `, ${p.state}` : ""}
        </p>
        <p className="text-xl font-bold">
          {prices.length
            ? `${formatInr(Math.min(...prices))} onwards`
            : "Price on request"}
        </p>
        <SaveProject id={p.id} initial={saved} />
        {p.reraId && <p className="text-xs">RERA registration: {p.reraId}</p>}
        {p.possessionDate && (
          <p className="text-sm">Expected possession: {p.possessionDate}</p>
        )}
      </div>
      <Card>
        <h2 className="mb-3 font-bold">About the project</h2>
        <p className="whitespace-pre-wrap text-sm">
          {p.description || "Contact our team for project details."}
        </p>
      </Card>
      <section className="space-y-3">
        <h2 className="font-bold">Configurations and floor plans</h2>
        {p.configurations.map((c) => (
          <Card key={c.id}>
            <p className="font-bold">{c.label}</p>
            <p className="text-sm">
              {c.area.toLocaleString("en-IN")} sq.ft ·{" "}
              {c.price ? formatInr(Number(c.price)) : "Price on request"}
            </p>
            {c.floorPlan && (
              <a href={c.floorPlan} target="_blank" rel="noopener noreferrer">
                <img
                  src={imgUrl(c.floorPlan, 800)}
                  alt={`${c.label} floor plan`}
                  className="mt-3 w-full rounded-xl"
                />
                <span className="text-xs underline">Open floor plan</span>
              </a>
            )}
          </Card>
        ))}
      </section>
      <Card>
        <h2 className="font-bold">Amenities</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {p.amenities.map((a) => (
            <Pill key={a}>{a}</Pill>
          ))}
        </div>
      </Card>
      {p.paymentPlan && (
        <Card>
          <h2 className="font-bold">Payment plan</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{p.paymentPlan}</p>
        </Card>
      )}
      {p.assets
        .filter((a) => a.kind === "BROCHURE")
        .map((a) => (
          <a
            key={a.id}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl bg-fill p-4 font-bold"
          >
            Download project brochure (PDF)
          </a>
        ))}
      {p.lat != null && p.lng != null && (
        <div>
          <div className="h-56 overflow-hidden rounded-xl">
            <MiniMap pin={{ lat: p.lat, lng: p.lng }} interactive={false} />
          </div>
          <a
            href={`https://www.google.com/maps?q=${p.lat},${p.lng}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Maps
          </a>
        </div>
      )}
      <LeadForm
        visitsOnly
        projectId={p.id}
        source={sp.utm_source}
        campaign={sp.utm_campaign}
      />
      <InterestForm
        type="PROJECT"
        referenceId={p.id}
        title={p.name}
        source={sp.utm_source || "website"}
        campaign={sp.utm_campaign}
      />
      {prices.length > 0 && <EmiCalculator price={Math.min(...prices)} />}
      <p className="text-xs text-mute">
        Prices and availability are supplied by the project administrator and
        may change. Confirm current pricing and applicable charges with our
        team.
      </p>
    </div>
  );
}
