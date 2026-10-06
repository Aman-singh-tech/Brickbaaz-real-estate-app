import Link from "next/link";
import InterestForm from "@/components/InterestForm";
import { LOANS } from "@/lib/crm-options";
import { Card } from "@/components/ui";
export const metadata = { title: "Loans & Finance" };
export default async function Services({ searchParams }) {
  const sp = await searchParams;
  const loan = LOANS.includes(sp.loan) ? sp.loan : LOANS[0];
  return (
    <div className="space-y-8 p-4 md:p-8">
      <section className="owner-banner rounded-3xl p-7 text-white md:p-12">
        <p className="text-xs font-bold tracking-widest text-[#f2bc87]">
          BRICKBAAZ SERVICES
        </p>
        <h1 className="mt-4 text-3xl font-extrabold md:text-5xl">
          Finance for your next step.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70">
          Explore loan assistance for your home, business, education and more.
          Tell us what you need and our team will connect with you.
        </p>
      </section>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="grid content-start gap-3 sm:grid-cols-2">
          {LOANS.map((l) => (
            <Link
              key={l}
              href={`/services?loan=${encodeURIComponent(l)}#enquire`}
            >
              <Card
                className={`h-full !p-6 transition hover:border-brand ${loan === l ? "!border-brand !bg-brand-soft" : ""}`}
              >
                <p className="text-lg font-bold">{l}</p>
                <p className="mt-3 text-xs text-mute">Request assistance →</p>
              </Card>
            </Link>
          ))}
        </section>
        <div id="enquire">
          <InterestForm
            key={loan}
            type="LOAN"
            loan={loan}
            source={sp.utm_source || "website"}
            campaign={sp.utm_campaign}
          />
          <p className="mt-4 text-xs leading-relaxed text-mute">
            Brickbaaz collects requests for loan assistance. Approval, rates and
            eligibility depend on the lender. Submitting this form does not
            approve or disburse a loan.
          </p>
        </div>
      </div>
    </div>
  );
}
