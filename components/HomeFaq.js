import Link from "next/link";

const questions = [
  ["Which properties can I explore in Gurugram?", "Browse apartments, villas, builder floors, commercial properties, plots and farm houses. Available listings depend on what owners have published; use the property type cards and Buy or Rent filters to narrow your search."],
  ["How do I request a property site visit?", "Open a property or builder project, send an enquiry with your contact details and ask for a site visit. The Brickbaaz team will contact you to coordinate availability and a suitable time."],
  ["Can Brickbaaz help with a home loan?", "You can submit a home loan enquiry through our loan assistance page. Eligibility, interest rates and approval depend on the lender; calculator figures are estimates."],
  ["What should I check before choosing a property?", "Compare price, location, area, photos and available amenities. Confirm availability and property documents with the seller, and visit the property before making a decision."],
];

export default function HomeFaq() {
  return (
    <section id="property-faq" className="home-section space-y-6" aria-labelledby="faq-title">
      <div className="max-w-2xl space-y-3">
        <p className="home-eyebrow">YOUR PROPERTY QUESTIONS</p>
        <h2 id="faq-title" className="home-heading">Buying or renting in Gurugram?</h2>
        <p className="text-sm leading-7 text-mute">A few helpful answers before you take the next step.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {questions.map(([question, answer]) => (
          <details key={question} className="rounded-2xl border border-line bg-white p-5 open:border-brand/40">
            <summary className="cursor-pointer text-sm font-bold leading-6 focus-visible:outline-2 focus-visible:outline-brand">{question}</summary>
            <p className="mt-3 text-sm leading-7 text-mute">{answer}</p>
          </details>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-sm font-bold text-brand">
        <Link href="/projects">Explore Gurugram builder projects →</Link>
        <Link href="/services">Get home loan assistance →</Link>
        <a href="#contact">Ask the Brickbaaz team →</a>
      </div>
    </section>
  );
}
