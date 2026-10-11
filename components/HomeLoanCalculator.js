"use client";

import { useState } from "react";
import { Card, btn } from "@/components/ui";

const defaults = { amount: "2500000", rate: "6.5", years: "5" };
const money = value => `₹${Math.round(value).toLocaleString("en-IN")}`;

export default function HomeLoanCalculator() {
  const [values, setValues] = useState(defaults);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  function calculate(event) {
    event.preventDefault();
    const amount = Number(values.amount), rate = Number(values.rate), years = Number(values.years);
    if (![amount, rate, years].every(Number.isFinite) || amount <= 0 || amount > 1e10 || rate < 0 || rate > 50 || !Number.isInteger(years) || years < 1 || years > 40) {
      setError("Enter a valid loan amount, interest rate (0–50%) and tenure (1–40 whole years).");
      setResult(null);
      return;
    }
    const months = years * 12, monthlyRate = rate / 1200;
    const monthly = monthlyRate === 0 ? amount / months : amount * monthlyRate / -Math.expm1(-months * Math.log1p(monthlyRate));
    setResult({ monthly, principal: amount, interest: monthly * months - amount, total: monthly * months });
    setError("");
  }
  return (
    <div className="grid items-start gap-6 md:grid-cols-2">
      <Card>
        <form onSubmit={calculate} className="space-y-5">
          {[
            ["amount", "Loan Amount (₹)", 1, 1e10, "1"],
            ["rate", "Interest Rate (% per annum)", 0, 50, "0.01"],
            ["years", "Loan Tenure (Years)", 1, 40, "1"],
          ].map(([key, label, min, max, step]) => (
            <label key={key} className="block text-sm font-semibold">
              {label}
              <input type="number" required min={min} max={max} step={step} value={values[key]} onChange={event => { setValues({ ...values, [key]: event.target.value }); setResult(null); setError(""); }} className="mt-2 w-full rounded-xl border border-line bg-fill px-4 py-3 outline-none focus:border-brand" />
            </label>
          ))}
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <div className="flex gap-3">
            <button type="button" className={btn("soft", "flex-1")} onClick={() => { setValues(defaults); setResult(null); setError(""); }}>Reset</button>
            <button type="submit" className={btn("primary", "flex-1")}>Calculate EMI</button>
          </div>
        </form>
      </Card>
      <Card>
        <div aria-live="polite" aria-atomic="true">
          {result ? <>
            <p className="text-sm text-mute">Estimated monthly EMI</p>
            <p className="mt-3 text-4xl font-extrabold">{money(result.monthly)}</p>
            <dl className="mt-6 space-y-4 text-sm">
              {[["Loan amount", result.principal], ["Total interest", result.interest], ["Total repayment", result.total]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 border-b border-line pb-3"><dt>{label}</dt><dd className="font-bold">{money(value)}</dd></div>)}
            </dl>
          </> : <><h2 className="text-xl font-bold">Plan your monthly repayments</h2><p className="mt-3 text-sm leading-7 text-mute">Enter your loan amount, annual interest rate and tenure, then select Calculate EMI to see your estimate.</p></>}
        </div>
        <p className="mt-6 text-xs leading-6 text-mute">Estimate for a fixed-rate loan with monthly repayments. Fees, insurance and rate changes are excluded. Actual terms depend on your lender.</p>
      </Card>
    </div>
  );
}
