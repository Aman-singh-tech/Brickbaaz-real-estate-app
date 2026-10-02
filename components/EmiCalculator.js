"use client";

import { useState } from "react";
import { Card, cx } from "@/components/ui";
import { emi, formatInr } from "@/lib/format";

const LENDERS = [
  ["HDFC Home Loans", 8.45],
  ["State Bank of India", 8.5],
  ["ICICI Bank", 8.6],
];

function Slider({ label, value, set, min, max, step, show }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <label htmlFor={label} className="font-bold text-mute">{label}</label>
        <span className="font-extrabold">{show(value)}</span>
      </div>
      <input id={label} type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} className="w-full accent-[#0b1426]" />
    </div>
  );
}

export default function EmiCalculator({ price, defaultRate = 8.45 }) {
  const [down, setDown] = useState(20);
  const [rate, setRate] = useState(defaultRate);
  const [years, setYears] = useState(20);
  const loan = Math.round(price * (1 - down / 100));
  const m = Math.round(emi(loan, rate, years));
  const total = m * years * 12;

  return (
    <div className="space-y-4 p-4">
      <Card className="text-center">
        <p className="text-xs font-semibold text-mute">Monthly EMI</p>
        <p className="text-3xl font-extrabold tracking-tight">₹{m.toLocaleString("en-IN")}</p>
        <p className="mt-1 text-xs text-mute">
          Loan {formatInr(loan)} · Interest {formatInr(Math.max(total - loan, 0))} · Total {formatInr(total)}
        </p>
        <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-fill" aria-hidden="true">
          <div className="bg-navy" style={{ width: `${(loan / total) * 100}%` }} />
          <div className="bg-brand" style={{ width: `${100 - (loan / total) * 100}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-[10.5px] font-semibold text-mute">
          <span>● Principal</span>
          <span className="text-brand">● Interest</span>
        </div>
      </Card>
      <Card className="space-y-4">
        <p className="text-xs text-mute">Property price <b className="text-ink">{formatInr(price)}</b></p>
        <Slider label="Down payment" value={down} set={setDown} min={5} max={80} step={1} show={(v) => `${v}% · ${formatInr((price * v) / 100)}`} />
        <Slider label="Interest rate" value={rate} set={setRate} min={6} max={14} step={0.05} show={(v) => `${v.toFixed(2)}%`} />
        <Slider label="Tenure" value={years} set={setYears} min={1} max={30} step={1} show={(v) => `${v} years`} />
      </Card>
      <Card className="space-y-1">
        <p className="text-sm font-extrabold">Compare lenders</p>
        {LENDERS.map(([n, r]) => (
          <button key={n} type="button" onClick={() => setRate(r)} className={cx("flex w-full items-center justify-between rounded-xl px-2.5 py-2.5 text-left text-sm", rate === r && "bg-fill")}>
            <span className="font-semibold">{n}</span>
            <span className="text-xs text-mute">{r}% · ₹{Math.round(emi(loan, r, years)).toLocaleString("en-IN")}/mo</span>
          </button>
        ))}
        <p className="pt-1 text-[11px] text-mute">Indicative rates. Actual rate depends on your profile and lender.</p>
      </Card>
    </div>
  );
}
