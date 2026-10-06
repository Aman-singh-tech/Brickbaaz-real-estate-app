"use client";
import { useActionState, useState } from "react";
import { createProjectLead } from "@/app/actions/projects";
import { Card, inputCls, Field } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
export default function LeadForm(props) {
  const [attempt, setAttempt] = useState(0);
  return (
    <RequestForm
      key={attempt}
      {...props}
      onAnother={() => setAttempt((n) => n + 1)}
    />
  );
}
function RequestForm({
  projectId,
  source,
  campaign,
  onAnother,
  visitsOnly = false,
}) {
  const [state, action] = useActionState(createProjectLead, null),
    [kind, setKind] = useState(visitsOnly ? "VISIT" : "ENQUIRY");
  if (state?.ok)
    return (
      <Card className="!bg-brand-soft">
        <h2 className="font-bold">Request received</h2>
        <p className="mt-2 text-sm">
          Our team will contact you to discuss the project and confirm your
          preferred visit slot.
        </p>
        <button
          type="button"
          onClick={onAnother}
          className="mt-3 text-sm font-bold underline"
        >
          Send another request
        </button>
      </Card>
    );
  return (
    <Card>
      <h2 className="mb-4 text-lg font-bold">
        {visitsOnly ? "Plan a site visit" : "Interested in this project?"}
      </h2>
      <form
        action={(fd) => {
          for (const key of ["visitAt", "followUpAt"]) {
            const value = fd.get(key);
            if (value) fd.set(key, new Date(String(value)).toISOString());
          }
          return action(fd);
        }}
        className="space-y-3"
      >
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="source" value={source || "website"} />
        <input type="hidden" name="campaign" value={campaign || ""} />
        <Field label="Request">
          <select
            name="kind"
            aria-label="Request"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className={inputCls}
          >
            {!visitsOnly && (
              <option value="ENQUIRY">Get price and project details</option>
            )}
            <option value="VISIT">Request a site visit</option>
          </select>
        </Field>
        <Field label="Your name">
          <input name="name" required maxLength={80} className={inputCls} />
        </Field>
        <Field label="Mobile number">
          <input
            name="phone"
            type="tel"
            required
            pattern="[6-9][0-9]{9}"
            maxLength={10}
            className={inputCls}
          />
        </Field>
        <Field label="Email (optional)">
          <input name="email" type="email" className={inputCls} />
        </Field>
        {kind === "VISIT" && (
          <>
            <Field label="Preferred date and time">
              <input
                name="visitAt"
                type="datetime-local"
                required
                className={inputCls}
              />
            </Field>
            <Field label="Pickup address (optional; availability confirmed by team)">
              <input
                name="pickupAddress"
                maxLength={300}
                className={inputCls}
              />
            </Field>
          </>
        )}
        <label className="flex items-start gap-2 text-xs">
          <input name="consent" type="checkbox" required />I agree to be
          contacted by Brickbaaz about this enquiry by phone or WhatsApp. See
          our{" "}
          <a href="/privacy" className="underline">
            privacy policy
          </a>
          .
        </label>
        {state?.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
        <SubmitButton>Send request</SubmitButton>
        <p className="text-xs text-mute">
          No login required. A requested slot is confirmed by our team.
        </p>
      </form>
    </Card>
  );
}
