"use client";
import { useActionState } from "react";
import { updateLead } from "@/app/actions/projects";
import { LEAD_STAGES } from "@/lib/lead-stages";
import { Card, Field, inputCls } from "@/components/ui";
import SubmitButton from "@/components/SubmitButton";
const local = (d) => {
  if (!d) return "";
  const x = new Date(d);
  return new Date(x.getTime() - x.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
export default function LeadEditor({ lead }) {
  const [state, action] = useActionState(updateLead, null);
  return (
    <Card>
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
        <input name="id" type="hidden" value={lead.id} />
        <Field label="Pipeline stage">
          <select name="stage" defaultValue={lead.stage} className={inputCls}>
            {Object.entries(LEAD_STAGES).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Visit date/time">
          <input
            name="visitAt"
            type="datetime-local"
            defaultValue={local(lead.visitAt)}
            className={inputCls}
          />
        </Field>
        <Field label="Next follow-up">
          <input
            name="followUpAt"
            type="datetime-local"
            defaultValue={local(lead.followUpAt)}
            className={inputCls}
          />
        </Field>
        <Field label="Add a note">
          <textarea
            name="note"
            maxLength={3000}
            rows={4}
            className={inputCls}
          />
        </Field>
        {state?.error && (
          <p role="alert" className="text-red-600">
            {state.error}
          </p>
        )}
        {state?.ok && (
          <p role="status" className="text-ok">
            Lead updated.
          </p>
        )}
        <SubmitButton>Update lead</SubmitButton>
      </form>
    </Card>
  );
}
