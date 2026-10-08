import BankingPartners from "@/components/BankingPartners";
import Link from "next/link";
import { getPurpose, getCity } from "@/components/TopBar";
import PropertyCard from "@/components/PropertyCard";
import ProjectCard from "@/components/projects/ProjectCard";
import TestimonialCard from "@/components/TestimonialCard";
import InterestForm from "@/components/InterestForm";
import HomeMotion from "@/components/HomeMotion";
import Hero from "@/components/Hero";
import { Card, Icon, Logo, SectionTitle, btn } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { projectInclude } from "@/lib/projects";
import { businessInfo } from "@/lib/business";
import { TYPE_LABEL, cityLabel, imgUrl } from "@/lib/format";
import { CUSTOMER_CITIES, cityWhere } from "@/lib/city";
import { categoryCounts, featured, savedIds } from "@/lib/properties";
import { getBuyer } from "@/lib/auth";

export const metadata = {
  title: "Brickbaaz | Homes, projects & property assistance in Gurugram",
  description:
    "Explore Gurugram properties and builder projects, request site visits, and connect with Brickbaaz for property and loan assistance.",
};
const CATS = [
  ["APARTMENT", "home"],
  ["VILLA", "home"],
  ["BUILDER_FLOOR", "list"],
  ["COMMERCIAL", "calc"],
  ["PLOT", "map"],
];
const SERVICES = [
  [
    "Find a home to buy",
    "Explore prices, photos and property details, then enquire about a home that fits your plans.",
    "home",
    "/search?p=sale",
    "Explore homes",
  ],
  [
    "Discover your next rental",
    "Browse rental homes by location, budget and space. Contact the property desk about availability.",
    "pin",
    "/search?p=rent",
    "Browse rentals",
  ],
  [
    "Experience it in person",
    "Choose a property or project and request a site visit. Our team will coordinate the details with you.",
    "map",
    "/#properties",
    "Find a property to visit",
  ],
  [
    "Explore loan assistance",
    "Tell us the loan type and amount you need. Submit an enquiry to discuss the next steps with our team.",
    "calc",
    "/services",
    "Request loan assistance",
  ],
];
const STEPS = [
  [
    "Explore your options",
    "Browse properties and projects. Check the photos, location, price and available details.",
    "search",
  ],
  [
    "Send an enquiry",
    "Tell us what interests you and leave your contact details. No account is needed for an interest enquiry.",
    "chat",
  ],
  [
    "Speak to our team",
    "Discuss your budget, questions and preferred next steps with the Brickbaaz property desk.",
    "phone",
  ],
  [
    "Visit the property",
    "Request a visit and coordinate a suitable time with our team before making your decision.",
    "map",
  ],
];
function Heading({ eyebrow, title, children }) {
  return (
    <div className="max-w-2xl space-y-3">
      <p className="home-eyebrow">{eyebrow}</p>
      <h2 className="home-heading">{title}</h2>
      {children && (
        <p className="text-sm leading-7 text-mute md:text-base">{children}</p>
      )}
    </div>
  );
}

export default async function Explore({ searchParams }) {
  const [purpose, city, user, sp] = await Promise.all([
    getPurpose(),
    getCity(),
    getBuyer(),
    searchParams,
  ]);
  const [counts, items, saved, projects, stories] = await Promise.all([
    categoryCounts(purpose === "rent" ? "RENT" : "SALE", city),
    featured(purpose === "rent" ? "RENT" : "SALE", city, 6),
    savedIds(user?.id),
    prisma.project.findMany({
      where: { status: "PUBLISHED", ...cityWhere(city) },
      include: projectInclude,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 3,
    }),
    prisma.testimonial.findMany({
      where: { published: true },
      orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
      take: 3,
    }),
  ]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const business = businessInfo();
  return (
    <HomeMotion>
      <Hero
        photos={items
          .flatMap((property) => {
            const photo = property.media.find(
              (media) => media.kind === "IMAGE",
            );
            return photo
              ? [{ url: imgUrl(photo.url, 1600), title: property.title }]
              : [];
          })
          .slice(0, 2)}
      />
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
              {CUSTOMER_CITIES.map((c) => (
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
            <Icon name="search" className="h-4 w-4" />
            Search Properties
          </button>
        </form>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {[
            ["Ready to Move", `/search?p=${purpose}&poss=READY`],
            ["Near Metro", `/search?p=${purpose}&q=metro`],
            ["Under ₹1 Cr", `/search?p=${purpose}&max=10000000`],
          ].map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="shrink-0 rounded-full bg-fill px-3 py-1.5 text-xs font-semibold"
            >
              {label}
            </Link>
          ))}
        </div>
      </Card>

      <section
        id="about"
        data-reveal
        className="home-section grid items-center gap-8 lg:grid-cols-2 lg:gap-14"
      >
        <div className="space-y-6">
          <Heading
            eyebrow="ABOUT BRICKBAAZ"
            title="A clearer path to your next address."
          >
            {business.intro}
          </Heading>
          <div className="space-y-3">
            {[
              [
                "Real listing details",
                "Explore the photos, pricing and information added by our property desk.",
              ],
              [
                "A conversation, not a guess",
                "Send your questions and discuss availability before planning a visit.",
              ],
              [
                "Your shortlist, in one place",
                "Save the properties you like and return when you are ready.",
              ],
            ].map(([title, body]) => (
              <div key={title} className="flex gap-3">
                <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                  <Icon name="check" className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-mute">{body}</p>
                </div>
              </div>
            ))}
          </div>
          <a href="#contact" className={btn("primary")}>
            Talk to Brickbaaz <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="about-panel relative overflow-hidden rounded-[32px] bg-navy p-7 text-white md:p-10">
          <div className="relative z-10">
            <p className="text-xs font-bold tracking-widest text-[#f2bc87]">
              FOCUSED ON GURUGRAM
            </p>
            <p className="mt-5 text-3xl font-extrabold leading-tight md:text-4xl">
              A place to live.
              <br />
              Space to grow.
              <br />
              <span className="text-[#f2bc87]">A move that feels right.</span>
            </p>
            <p className="mt-6 max-w-sm text-sm leading-7 text-white/70">
              Homes, builder floors, plots and commercial spaces. Discover your
              options at your own pace.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-3">
              {[
                ["home", "Properties"],
                ["building", "Builder projects"],
                ["map", "Site visits"],
                ["calc", "Loan enquiries"],
              ].map(([icon, label]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <Icon name={icon} className="mb-3 h-5 w-5 text-[#f2bc87]" />
                  <p className="text-xs font-semibold">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section data-reveal className="home-section space-y-5">
        <SectionTitle action="View all →" href={`/search?p=${purpose}`}>
          Explore by property type
        </SectionTitle>
        <div className="category-grid grid grid-cols-2 gap-3">
          {CATS.map(([type, icon]) => (
            <Link
              key={type}
              href={`/search?p=${purpose}&type=${type}`}
              className="home-service-card rounded-2xl border border-line bg-white p-5 text-center"
            >
              <span className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
                <Icon name={icon} />
              </span>
              <p className="text-sm font-bold">
                {TYPE_LABEL[type].split(" / ")[0]}
              </p>
              <p className="mt-1 text-xs text-mute">
                {counts[type] ?? 0} listings
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section id="properties" data-reveal className="home-section space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Heading
            eyebrow="DISCOVER YOUR NEXT HOME"
            title="Featured properties"
          >
            Explore {purpose === "rent" ? "rental homes" : "homes for sale"} in{" "}
            {city}, with photos, prices and the details that matter.
          </Heading>
          <span className="rounded-full bg-brand-soft px-4 py-2 text-xs font-bold text-brand">
            {total} active {purpose === "rent" ? "rental" : "sale"} listings
          </span>
        </div>
        {items.length ? (
          <div className="home-scroll-grid property-grid">
            {items.map((p) => (
              <PropertyCard key={p.id} property={p} saved={saved.has(p.id)} />
            ))}
          </div>
        ) : (
          <Card className="!p-8 text-center text-sm text-mute">
            No {purpose === "rent" ? "rental" : "sale"} listings are available
            in {city} right now.{" "}
            <a href="#contact" className="font-bold text-brand">
              Tell us what you are looking for.
            </a>
          </Card>
        )}
        <Link href={`/search?p=${purpose}`} className={btn("soft")}>
          See all properties <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section id="projects" data-reveal className="home-section space-y-6">
        <Heading eyebrow="NEW POSSIBILITIES" title="Explore builder projects">
          Compare project locations, available configurations and starting
          prices, then open the project for more details.
        </Heading>
        {projects.length ? (
          <div className="home-scroll-grid project-grid">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        ) : (
          <Card className="!p-8 text-sm text-mute">
            Published builder projects will appear here as they become
            available.
          </Card>
        )}
        <Link href="/projects" className={btn("soft")}>
          View all projects <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section id="our-services" data-reveal className="home-section space-y-7">
        <Heading
          eyebrow="OUR SERVICES"
          title="More support for your next move."
        >
          Start with a search. Take the next step with a conversation.
        </Heading>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map(([title, body, icon, href, label]) => (
            <div
              key={title}
              className="home-service-card flex flex-col rounded-3xl border border-line bg-white p-6"
            >
              <span className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand">
                <Icon name={icon} className="h-6 w-6" />
              </span>
              <h3 className="text-lg font-extrabold">{title}</h3>
              <p className="mb-6 mt-3 text-sm leading-7 text-mute">{body}</p>
              <Link
                href={href}
                className="mt-auto text-sm font-bold text-brand"
              >
                {label} <span aria-hidden="true">→</span>
              </Link>
            </div>
          ))}
        </div>
        <p className="text-xs leading-6 text-mute">
          Loan assistance begins with an enquiry. Eligibility, terms and
          approval are determined by the lending provider.
        </p>
      </section>

      <BankingPartners />

      <section
        id="how-it-works"
        data-reveal
        className="home-section rounded-[32px] bg-navy p-6 text-white md:p-10"
      >
        <p className="home-eyebrow !text-[#f2bc87]">HOW IT WORKS</p>
        <h2 className="home-heading mt-3 !text-white">
          From browsing to a better-informed decision.
        </h2>
        <div className="mt-9 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([title, body, icon], i) => (
            <div key={title} className="relative border-t border-white/15 pt-6">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-3xl font-extrabold text-[#f2bc87]">
                  0{i + 1}
                </span>
                <Icon name={icon} className="h-6 w-6 text-white/60" />
              </div>
              <h3 className="text-base font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/65">{body}</p>
            </div>
          ))}
        </div>
        <a
          href="#properties"
          className="mt-8 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-bold text-navy hover:bg-brand-soft"
        >
          Start exploring →
        </a>
      </section>

      <section id="experiences" data-reveal className="home-section space-y-6">
        <Heading
          eyebrow="CUSTOMER EXPERIENCES"
          title="Stories behind the next move."
        >
          Feedback, photos and video experiences shared by Brickbaaz customers.
        </Heading>
        {stories.length ? (
          <div className="home-scroll-grid project-grid">
            {stories.map((t) => (
              <TestimonialCard key={t.id} item={t} />
            ))}
          </div>
        ) : (
          <Card className="!p-8">
            <p className="text-base font-bold">Your experience matters.</p>
            <p className="mt-2 text-sm leading-7 text-mute">
              Customer stories will appear here when they are published. Have
              feedback to share? Let our team know.
            </p>
            <a
              href="#contact"
              className="mt-4 inline-block text-sm font-bold text-brand"
            >
              Get in touch →
            </a>
          </Card>
        )}
        <Link href="/testimonials" className={btn("soft")}>
          View customer stories →
        </Link>
      </section>

      <section
        id="contact"
        data-reveal
        className="home-section grid items-start gap-8 lg:grid-cols-2 lg:gap-14"
      >
        <div className="space-y-6">
          <Heading
            eyebrow="CONTACT & SUPPORT"
            title="Let’s talk about your next move."
          >
            Looking for a home, planning a visit, or have a question? Leave an
            enquiry and our property desk can follow up with you.
          </Heading>
          <div className="rounded-3xl border border-line bg-white p-6">
            <div className="flex gap-3">
              <Icon name="pin" className="mt-1 h-5 w-5 shrink-0 text-brand" />
              <div>
                <h3 className="text-sm font-bold">
                  Currently exploring Gurugram
                </h3>
                <p className="mt-1 text-sm leading-6 text-mute">
                  Properties and builder projects in Gurugram, Haryana.
                </p>
              </div>
            </div>
            {business.address && (
              <div className="mt-5 border-t border-line pt-5">
                <p className="text-xs font-bold text-mute">OFFICE ADDRESS</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6">
                  {business.address}
                </p>
              </div>
            )}
            {business.hours && (
              <div className="mt-5">
                <p className="text-xs font-bold text-mute">WORKING HOURS</p>
                <p className="mt-2 text-sm">{business.hours}</p>
              </div>
            )}
            {business.phone && (
              <a
                href={`tel:+${business.phone.number}`}
                className="mt-5 flex items-center gap-3 text-sm font-bold"
              >
                <Icon name="phone" className="h-5 w-5 text-brand" />
                {business.phone.label}
              </a>
            )}
            {business.email && (
              <a
                href={`mailto:${business.email}`}
                className="mt-4 block break-all text-sm font-bold text-brand"
              >
                {business.email}
              </a>
            )}
            {business.whatsapp && (
              <a
                href={`https://wa.me/${business.whatsapp}?text=${encodeURIComponent("Hi, I would like property assistance from Brickbaaz.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className={btn("soft", "mt-5")}
              >
                WhatsApp us <Icon name="chat" className="h-4 w-4" />
              </a>
            )}
          </div>
          <p className="text-xs leading-6 text-mute">
            Your contact details are used to respond to your enquiry. Read our{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>{" "}
            for more information.
          </p>
        </div>
        <InterestForm
          type="OTHER"
          title="Property assistance"
          source={sp?.utm_source || "homepage"}
          campaign={sp?.utm_campaign}
        />
      </section>

      <footer className="home-footer rounded-t-[32px] bg-navy p-6 text-white md:p-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="inline-flex rounded-xl bg-white px-3 py-2">
              <Logo />
            </div>
            <p className="mt-5 max-w-xs text-sm leading-7 text-white/65">
              Explore your options. Ask your questions. Find your next address
              with Brickbaaz.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-bold">Discover</h2>
            <div className="mt-4 flex flex-col gap-3 text-sm text-white/65">
              <Link href="/search?p=sale">Buy a property</Link>
              <Link href="/search?p=rent">Rent a home</Link>
              <Link href="/projects">Builder projects</Link>
              <Link href="/services">Loan assistance</Link>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold">Brickbaaz</h2>
            <div className="mt-4 flex flex-col gap-3 text-sm text-white/65">
              <a href="#about">About us</a>
              <a href="#experiences">Customer experiences</a>
              <a href="#contact">Contact & support</a>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms & Conditions</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-white/15 pt-6 text-xs text-white/55">
          <p>© {new Date().getFullYear()} Brickbaaz. All rights reserved.</p>
          <p>Property discovery in Gurugram, Haryana.</p>
        </div>
      </footer>
    </HomeMotion>
  );
}
