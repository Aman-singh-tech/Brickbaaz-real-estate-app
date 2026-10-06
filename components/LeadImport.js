"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { parseCsv } from "@/lib/csv-leads";
import { previewLeadImport, importLeads } from "@/app/actions/crm";
import { Field, inputCls, btn } from "@/components/ui";
const columns = ["name", "phone", "email", "interest", "message", "source"];
export default function LeadImport() {
  const [text, setText] = useState(""),
    [headers, setHeaders] = useState([]),
    [mapping, setMapping] = useState({}),
    [source, setSource] = useState("Meta CSV"),
    [preview, setPreview] = useState(null),
    [error, setError] = useState(""),
    [authorized, setAuthorized] = useState(false),
    [result, setResult] = useState(null),
    [pending, start] = useTransition();
  const router = useRouter();
  async function file(f) {
    setError("");
    setResult(null);
    setPreview(null);
    setHeaders([]);
    setText("");
    if (!f) return;
    try {
      if (f.size > 1_000_000) throw Error("CSV must be under 1 MB.");
      const raw = await f.text(),
        parsed = parseCsv(raw);
      setText(raw);
      setHeaders(parsed.headers);
      const aliases = {
        name: ["name", "full_name", "full name"],
        phone: [
          "phone",
          "phone_number",
          "phone number",
          "mobile",
          "mobile_number",
        ],
        email: ["email", "email_address"],
        interest: ["interest", "property", "project", "ad_name"],
        message: ["message", "notes"],
        source: ["source", "lead_source"],
      };
      setMapping(
        Object.fromEntries(
          columns.map((k) => {
            const i = parsed.headers.findIndex((h) =>
              aliases[k].includes(h.trim().toLowerCase()),
            );
            return [k, i < 0 ? "" : String(i)];
          }),
        ),
      );
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-fill p-5 text-sm leading-relaxed">
        <p>
          Upload a Facebook/Meta export or your own CSV. Maximum 1 MB / 1,000
          rows. Name and phone are required. Duplicates are matched by mobile
          number and skipped.
        </p>
        <a
          download="brickbaaz-leads-template.csv"
          href={
            "data:text/csv;charset=utf-8," +
            encodeURIComponent(
              "name,phone,email,interest,message,source\nSample Customer,9876543210,customer@example.com,Builder Floor,Requested a callback,Meta CSV\n",
            )
          }
          className="mt-3 inline-block font-bold text-brand"
        >
          Download CSV template
        </a>
      </div>
      <Field label="CSV file">
        <input
          type="file"
          accept=".csv,text/csv"
          disabled={pending}
          onChange={(e) => file(e.target.files[0])}
        />
      </Field>
      {!!headers.length && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {columns.map((k) => (
              <Field
                key={k}
                label={`${k}${["name", "phone"].includes(k) ? " *" : ""}`}
              >
                <select
                  disabled={pending}
                  value={mapping[k] ?? ""}
                  onChange={(e) => {
                    setMapping((x) => ({ ...x, [k]: e.target.value }));
                    setPreview(null);
                  }}
                  className={inputCls}
                >
                  <option value="">Not mapped</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `Column ${i + 1}`}
                    </option>
                  ))}
                </select>
              </Field>
            ))}
          </div>
          <Field label="Default source">
            <input
              value={source}
              maxLength={80}
              disabled={pending}
              onChange={(e) => {
                setSource(e.target.value);
                setPreview(null);
              }}
              className={inputCls}
            />
          </Field>
          <button
            disabled={pending}
            type="button"
            className={btn("primary")}
            onClick={() =>
              start(async () => {
                setError("");
                const r = await previewLeadImport(text, mapping, source);
                if (r.error) setError(r.error);
                else setPreview(r.rows);
              })
            }
          >
            {pending ? "Checking…" : "Preview import"}
          </button>
        </>
      )}
      {preview && (
        <>
          <p className="text-sm font-bold">
            {preview.filter((r) => !r.error).length} ready ·{" "}
            {preview.filter((r) => r.error).length} skipped · {preview.length}{" "}
            total rows
          </p>
          <div className="max-h-96 overflow-auto rounded-xl border border-line">
            <table className="w-full text-left text-xs">
              <thead className="bg-fill">
                <tr>
                  {["Row", "Name", "Phone", "Interest", "Status"].map((h) => (
                    <th key={h} className="p-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((r) => (
                  <tr key={r.row} className="border-t border-line">
                    <td className="p-3">{r.row}</td>
                    <td className="p-3">{r.data.name}</td>
                    <td className="p-3">{r.data.phone || "Invalid"}</td>
                    <td className="p-3">{r.data.interest}</td>
                    <td
                      className={`p-3 ${r.error ? "text-red-600" : "text-ok"}`}
                    >
                      {r.error || "Ready"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <label className="flex items-start gap-2 text-xs text-mute">
            <input
              type="checkbox"
              checked={authorized}
              onChange={(e) => setAuthorized(e.target.checked)}
            />
            I have permission to use these contacts. Import does not record
            customer opt-in consent.
          </label>
          <button
            disabled={pending || !authorized || !preview.some((r) => !r.error)}
            className={btn("brand")}
            onClick={() =>
              start(async () => {
                setError("");
                const r = await importLeads(text, mapping, source, authorized);
                if (r.error) setError(r.error);
                else {
                  setResult(r);
                  setPreview(null);
                  router.refresh();
                }
              })
            }
          >
            {pending ? "Importing…" : "Confirm import"}
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {result && (
        <p role="status" className="rounded-xl bg-green-50 p-4 text-sm text-ok">
          Imported {result.added} leads. Skipped {result.skipped}{" "}
          invalid/duplicate rows.
        </p>
      )}
    </div>
  );
}
