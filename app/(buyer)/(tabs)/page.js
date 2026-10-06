import Link from "next/link";
import { getPurpose, getCity } from "@/components/TopBar";
import PropertyCard from "@/components/PropertyCard";
import ProjectCard from "@/components/projects/ProjectCard";
import TestimonialCard from "@/components/TestimonialCard";
import { prisma } from "@/lib/prisma";
import { projectInclude } from "@/lib/projects";
import Hero from "@/components/Hero";
import { Card, Icon, SectionTitle, btn } from "@/components/ui";
import { TYPE_LABEL, cityLabel } from "@/lib/format";
import { CUSTOMER_CITIES, cityWhere } from "@/lib/city";
import { categoryCounts, featured, savedIds } from "@/lib/properties";
import { getBuyer } from "@/lib/auth";

export const metadata = { title: "Explore homes" };

const CATS = [
  ["APARTMENT", "building"],
  ["VILLA", "home"],
  ["BUILDER_FLOOR", "list"],
  ["COMMERCIAL", "calc"],
  ["PLOT", "map"],
];

export default async function Explore() {
  const [purpose, city, user] = await Promise.all([
    getPurpose(),
    getCity(),
    getBuyer(),
  ]);
  const [counts, items, saved] = await Promise.all([
    categoryCounts(purpose === "rent" ? "RENT" : "SALE", city),
    featured(purpose === "rent" ? "RENT" : "SALE", city, 5),
    savedIds(user?.id),
  ]);
  const cities = CUSTOMER_CITIES;
  const projects = await prisma.project.findMany({
    where: { status: "PUBLISHED", ...cityWhere(city) },
    include: projectInclude,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 3,
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const stories = await prisma.testimonial.findMany({
    where: { published: true },
    orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
    take: 3,
  });

  return (
    <div className="home-page space-y-8 px-4 pb-10 pt-6 md:space-y-12">
      <Hero />

      <Card
        className="home-search relative z-10 space-y-4 !rounded-3xl !p-5 shadow-xl md:!p-7"
        style={{ marginTop: -56 }}
      >
        <form action="/search" className="space-y-3">
          <div className="grid grid-cols-2 rounded-xl bg-fill p-1 text-center text-[13px] font-bold">
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
                  defaultChecked={purpose === v}
                  className="sr-only"
                />
                {l}
              </label>
            ))}
          </div>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-mute">
              Selected city
            </span>
            <select
              name="city"
              defaultValue={city}
              className="w-full rounded-xl border border-line bg-fill px-3.5 py-3 text-sm font-semibold"
            >
              {cities.map((c) => (
                <option key={c} value={c}>
                  {cityLabel(c)}
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
              placeholder="e.g. Sector 67, Golf Course Road, 3 BHK"
              className="w-full rounded-xl border border-line bg-fill px-3.5 py-3 text-sm outline-none focus:border-navy"
            />
          </label>
          <button className={btn("primary", "w-full")}>
            <Icon name="search" className="h-4 w-4" /> Search Properties
          </button>
        </form>
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {[
            ["Ready to Move", `/search?p=${purpose}&poss=READY`],
            ["Near Metro", `/search?p=${purpose}&q=metro`],
            ["Under ₹1 Cr", `/search?p=${purpose}&max=10000000`],
          ].map(([l, h]) => (
            <Link
              key={l}
              href={h}
              className="shrink-0 rounded-full bg-fill px-3 py-1.5 text-[11.5px] font-semibold"
            >
              {l}
            </Link>
          ))}
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          href="/services"
          className="owner-banner rounded-3xl p-6 text-white"
        >
          <p className="text-xs font-bold tracking-widest text-[#f2bc87]">
            LOANS & FINANCE
          </p>
          <h2 className="mt-3 text-2xl font-extrabold">
            Your plans. Our assistance.
          </h2>
          <p className="mt-3 text-sm text-white/70">
            Home, business, personal, education and more.
          </p>
          <p className="mt-5 text-sm font-bold">Explore loan services →</p>
        </Link>
        <Link
          href="/testimonials"
          className="rounded-3xl border border-line bg-white p-6"
        >
          <p className="text-xs font-bold tracking-widest text-brand">
            CUSTOMER STORIES
          </p>
          <h2 className="mt-3 text-2xl font-extrabold">
            Hear it from our customers.
          </h2>
          <p className="mt-3 text-sm text-mute">
            Feedback, photos and video stories.
          </p>
          <p className="mt-5 text-sm font-bold text-brand">
            View testimonials →
          </p>
        </Link>
      </section>

      <section className="space-y-3">
        <SectionTitle action="View all →" href={`/search?p=${purpose}`}>
          Explore categories
        </SectionTitle>
        <div className="category-grid grid grid-cols-3 gap-2.5">
          {CATS.map(([t]) => (
            <Link
              key={t}
              href={`/search?p=${purpose}&type=${t}`}
              className="rounded-2xl border border-line bg-white p-4 text-center transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg md:p-6"
            >
              <span className="mx-auto mb-1.5 grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
                <Icon
                  name={
                    t === "PLOT" ? "map" : t === "COMMERCIAL" ? "calc" : "home"
                  }
                  className="h-[18px] w-[18px]"
                />
              </span>
              <p className="text-xs font-extrabold">
                {TYPE_LABEL[t].split(" / ")[0]}
              </p>
              <p className="text-[10.5px] text-mute">
                {counts[t] ?? 0} listings
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2 rounded-3xl bg-navy p-4 text-white">
        <p className="col-span-3 flex items-center gap-2 text-sm font-extrabold">
          <Icon name="shield" className="h-4 w-4 text-brand" /> The Brickbaaz
          Advantage
        </p>
        {[
          ["Zero Brokerage", "More value for you"],
          ["Direct Contact", "Owner desk"],
          ["Site Visits", "Request your preferred slot"],
        ].map(([a, b]) => (
          <div key={a} className="rounded-xl bg-white/10 p-2.5">
            <p className="text-[11.5px] font-bold">{a}</p>
            <p className="text-[10px] text-white/60">{b}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <SectionTitle action={`${total} live`}>
          Featured properties
        </SectionTitle>
        {items.length === 0 ? (
          <Card className="py-10 text-center text-sm text-mute">
            New homes in {city} are on their way. Check back soon.
          </Card>
        ) : (
          <div className="property-grid space-y-4">
            {items.map((p) => (
              <PropertyCard key={p.id} property={p} saved={saved.has(p.id)} />
            ))}
          </div>
        )}
        {items.length > 0 && (
          <Link
            href={`/search?p=${purpose}${city ? `&city=${encodeURIComponent(city)}` : ""}`}
            className={btn("soft", "w-full")}
          >
            See all properties
          </Link>
        )}
      </section>

      <Card className="flex items-center gap-3 !bg-brand-soft">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-brand">
          <Icon name="pin" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-extrabold">Need a free site cab?</p>
          <p className="text-[11.5px] text-mute">
            We pick you up and drop you home.
          </p>
        </div>
        <Link href="/search" className={btn("primary", "!px-3 !py-2 text-xs")}>
          Book Cab
        </Link>
      </Card>

      <section className="space-y-3">
        <SectionTitle action="All projects" href="/projects">
          New builder projects
        </SectionTitle>
        {projects.length ? (
          <div className="project-grid space-y-4">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        ) : (
          <Card>New projects coming soon.</Card>
        )}
      </section>
      <footer className="space-y-3 text-xs text-mute">
        {stories.length > 0 && (
          <section className="space-y-4">
            <SectionTitle action="All stories" href="/testimonials">
              What our customers say
            </SectionTitle>
            <div className="project-grid space-y-4">
              {stories.map((t) => (
                <TestimonialCard key={t.id} item={t} />
              ))}
            </div>
          </section>
        )}
        <p className="text-sm font-extrabold text-ink">Brickbaaz Real Estate</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {cities.slice(0, 12).map((c) => (
            <Link key={c} href={`/search?city=${encodeURIComponent(c)}`}>
              {c}
            </Link>
          ))}
        </div>
        <div className="flex gap-4">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/services">Loan services</Link>
          <Link href="/testimonials">Testimonials</Link>
        </div>
        <p>© {new Date().getFullYear()} Brickbaaz Technologies Pvt Ltd.</p>
      </footer>
    </div>
  );
}
