"use client";
import { useActionState } from "react";
import { submitInterest, addManualLead } from "@/app/actions/crm";
import { LOANS, LEAD_TYPES } from "@/lib/crm-options";
import { Field, inputCls, btn } from "@/components/ui";

export default function InterestForm({
  type = "PROPERTY",
  referenceId,
  title = "Builder Floor",
  loan,
  source = "website",
  campaign,
  manual = false,
}) {
  const [state, action, pending] = useActionState(
    manual ? addManualLead : submitInterest,
    {},
  );
  if (state.ok)
    return (
      <div
        role="status"
        className="rounded-2xl bg-green-50 p-6 text-sm text-ok"
      >
        {manual
          ? "Lead added to your CRM."
          : "Thank you. Your enquiry has been received. Our team will contact you."}
      </div>
    );
  return (
    <form
      action={action}
      className="space-y-4 rounded-3xl border border-line bg-white p-5 md:p-7"
    >
      <div>
        <p className="text-xs font-bold tracking-widest text-brand">
          {manual ? "OWNER CRM" : "LET’S TALK"}
        </p>
        <h2 className="mt-2 text-xl font-extrabold">
          {manual
            ? "Add a lead"
            : type === "LOAN"
              ? "Request loan assistance"
              : "I'm interested"}
        </h2>
        <p className="mt-1 text-xs text-mute">
          {manual
            ? "Keep your next conversation organized."
            : "Leave your details. No account needed."}
        </p>
      </div>
      {!manual && (
        <>
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="referenceId" value={referenceId || ""} />
          <input type="hidden" name="source" value={source} />
          <input type="hidden" name="campaign" value={campaign || ""} />
          <div className="hidden" aria-hidden="true">
            <input name="website" tabIndex={-1} autoComplete="off" />
          </div>
        </>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Your name">
          <input
            name="name"
            required
            maxLength={80}
            autoComplete="name"
            className={inputCls}
          />
        </Field>
        <Field label="Mobile number">
          <input
            name="phone"
            required
            type="tel"
            autoComplete="tel"
            placeholder="10-digit mobile number"
            className={inputCls}
          />
        </Field>
      </div>
      <Field label="Email (optional)">
        <input
          name="email"
          type="email"
          autoComplete="email"
          maxLength={200}
          className={inputCls}
        />
      </Field>
      {type === "LOAN" && !manual && (
        <>
          <Field label="Loan type">
            <select
              name="loan"
              defaultValue={LOANS.includes(loan) ? loan : LOANS[0]}
              className={inputCls}
            >
              {LOANS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
          <Field label="Required amount (₹)">
            <input
              name="amount"
              type="number"
              min="1"
              max="1000000000000"
              required
              className={inputCls}
            />
          </Field>
        </>
      )}
      {manual && (
        <>
          <Field label="Lead type">
            <select name="type" className={inputCls}>
              {Object.entries(LEAD_TYPES).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Interested property/service">
            <input name="interest" maxLength={200} className={inputCls} />
          </Field>
          <Field label="Source">
            <input
              name="source"
              defaultValue="manual"
              maxLength={80}
              className={inputCls}
            />
          </Field>
        </>
      )}
      <Field label="Message">
        <textarea
          name="message"
          rows={3}
          maxLength={3000}
          defaultValue={
            manual
              ? ""
              : `Hi, I'm interested in "${type === "LOAN" ? loan || LOANS[0] : title}" on Brickbaaz.`
          }
          className={inputCls}
        />
      </Field>
      {!manual && (
        <label className="flex items-start gap-3 text-xs leading-relaxed text-mute">
          <input type="checkbox" name="consent" required className="mt-0.5" />I
          agree to be contacted by Brickbaaz about this enquiry.
        </label>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <button disabled={pending} className={btn("brand", "w-full")}>
        {pending ? "Sending…" : manual ? "Add lead" : "Send enquiry"}
      </button>
    </form>
  );
}
