"use client";
import { useActionState } from "react";
import { updateCrmLead } from "@/app/actions/crm";
import { CRM_STAGES } from "@/lib/crm-options";
import { Field, inputCls, btn } from "@/components/ui";
function localDate(value) {
  if (!value) return "";
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export default function CrmLeadEditor({ lead }) {
  const [state, action, pending] = useActionState(updateCrmLead, {});
  return (
    <form
      action={(fd) => {
        for (const k of ["followUpAt", "visitAt"])
          if (fd.get(k)) fd.set(k, new Date(String(fd.get(k))).toISOString());
        action(fd);
      }}
      className="space-y-4 rounded-2xl border border-line bg-white p-5"
    >
      <input type="hidden" name="id" value={lead.id} />
      <Field label="Stage">
        <select name="stage" defaultValue={lead.stage} className={inputCls}>
          {Object.entries(CRM_STAGES).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Next follow-up (your local time)">
        <input
          type="datetime-local"
          name="followUpAt"
          defaultValue={localDate(lead.followUpAt)}
          className={inputCls}
        />
      </Field>
      <Field label="Visit date (your local time)">
        <input
          type="datetime-local"
          name="visitAt"
          defaultValue={localDate(lead.visitAt)}
          className={inputCls}
        />
      </Field>
      <Field label="Add a note">
        <textarea name="note" maxLength={3000} rows={4} className={inputCls} />
      </Field>
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="text-sm text-ok">
          Lead updated.
        </p>
      )}
      <button disabled={pending} className={btn("brand", "w-full")}>
        {pending ? "Saving…" : "Save follow-up"}
      </button>
    </form>
  );
}
