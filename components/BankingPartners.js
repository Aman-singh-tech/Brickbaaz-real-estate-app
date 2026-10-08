/* eslint-disable @next/next/no-img-element -- Partner logos are served as local static assets. */
import Link from "next/link";
import { btn } from "@/components/ui";

const PARTNERS = [
  ["Bank of Maharashtra", "maharashtra.png", "Banking partner"],
  ["Tata Housing", "tata.png", "Housing partner"],
  ["ICICI Bank Home Loans", "icici.jpg", "Home loan partner"],
  ["HDFC Home Loans", "hdfc.png", "Home loan partner"],
  ["Axis Bank", "axis.png", "Banking partner"],
];
export default function BankingPartners({ id = "banking-partners" }) {
  return (
    <section
      id={id}
      data-reveal
      className="home-section space-y-6 rounded-[32px] border border-line bg-white p-5 md:p-9"
    >
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl space-y-3">
          <p className="home-eyebrow">BANKING & HOUSING PARTNERS</p>
          <h2 className="home-heading">
            Support for your home-buying journey.
          </h2>
          <p className="text-sm leading-7 text-mute">
            Explore home loan assistance with Brickbaaz and our banking
            partners. Speak to our team about your financing requirements and
            next steps.
          </p>
        </div>
        <Link
          href="/services?loan=Home%20Loan#enquire"
          className={btn("primary")}
        >
          Enquire about a home loan →
        </Link>
      </div>
      <div className="banking-partner-grid grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {PARTNERS.map(([name, file, kind]) => (
          <div
            key={name}
            className="home-service-card rounded-2xl border border-line bg-white p-4 text-center"
          >
            <div className="flex h-24 items-center justify-center">
              <img
                src={`/banking-partners/${file}`}
                alt={`${name} logo`}
                loading="lazy"
                width={200}
                height={100}
                className="max-h-20 w-full object-contain"
              />
            </div>
            <h3 className="mt-3 text-sm font-bold">{name}</h3>
            <p className="mt-1 text-xs text-mute">{kind}</p>
          </div>
        ))}
      </div>
      <p className="text-xs leading-6 text-mute">
        Home loan eligibility, interest rates and approval are determined by the
        lending institution.
      </p>
    </section>
  );
}
