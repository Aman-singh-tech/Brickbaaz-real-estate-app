import Link from "next/link";
import HomeLoanCalculator from "@/components/HomeLoanCalculator";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Home Loan EMI Calculator", "Calculate your estimated home loan EMI, total interest and repayment using your loan amount, interest rate and tenure.", "/emi-calculator");

export default function CalculatorPage() {
  return <div className="mx-auto w-full max-w-5xl space-y-8 p-4 md:p-8">
    <div className="space-y-3"><p className="home-eyebrow">PLAN YOUR HOME LOAN</p><h1 className="home-heading">Home Loan EMI Calculator</h1><p className="text-sm leading-7 text-mute">Calculate independently—no property selection or login needed.</p></div>
    <HomeLoanCalculator />
    <p className="text-sm text-mute">Need help with your loan? <Link href="/services?loan=Home%20Loan#enquire" className="font-semibold text-brand underline">Request home loan assistance</Link>.</p>
  </div>;
}
