"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Icon, Pill, btn, cx } from "@/components/ui";
import { setStatus, setFeatured, deleteProperty } from "@/app/actions/owner";
import { formatPrice, STATUS_LABEL, perSqft } from "@/lib/format";

const TONE = { ACTIVE: "ok", DRAFT: "brand", PAUSED: "soft", RENTED: "dark", SOLD: "dark" };

export default function OwnerPropertyCard({ p, inquiries }) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();

  const run = (fn) =>
    start(async () => {
      setErr("");
      const res = await fn();
      if (res?.error) setErr(res.error);
      setMenu(false);
      setConfirm(false);
      router.refresh();
    });

  const done = p.purpose === "RENT" ? "RENTED" : "SOLD";
  const sq = perSqft(p);

  return (
    <Card className={cx("space-y-2.5", pending && "opacity-60")}>
      <div className="flex items-center gap-2">
        <Pill tone={TONE[p.status]}>{p.status === "ACTIVE" ? "● " : ""}{STATUS_LABEL[p.status].toUpperCase()}</Pill>
        <Pill tone="soft">{p.purpose === "RENT" ? "RENT" : "SALE"}</Pill>
        {p.featured && <Pill tone="brand">★ PROMOTED</Pill>}
        <button type="button" onClick={() => setMenu(!menu)} aria-label="More actions" aria-expanded={menu} className="ml-auto grid h-8 w-8 place-items-center rounded-full hover:bg-fill">
          <Icon name="dots" className="h-5 w-5" />
        </button>
      </div>

      {menu && (
        <div className="space-y-1 rounded-xl bg-fill p-2 text-sm font-bold">
          {p.status === "ACTIVE" && <button className="block w-full rounded-lg px-3 py-2 text-left" onClick={() => run(() => setStatus(p.id, "PAUSED"))}>Pause listing</button>}
          {(p.status === "PAUSED" || p.status === "RENTED" || p.status === "SOLD") && <button className="block w-full rounded-lg px-3 py-2 text-left" onClick={() => run(() => setStatus(p.id, "ACTIVE"))}>Make active again</button>}
          {p.status === "ACTIVE" && <button className="block w-full rounded-lg px-3 py-2 text-left" onClick={() => run(() => setFeatured(p.id, !p.featured))}>{p.featured ? "Remove promotion" : "Promote on Explore"}</button>}
          {!confirm ? (
            <button className="block w-full rounded-lg px-3 py-2 text-left text-red-600" onClick={() => setConfirm(true)}>Delete listing…</button>
          ) : (
            <div className="rounded-lg bg-white p-3 text-xs">
              <p className="mb-2 font-bold">Delete this listing and its inquiries permanently?</p>
              <div className="flex gap-2">
                <button className={btn("soft", "flex-1 !py-2")} onClick={() => setConfirm(false)}>Cancel</button>
                <button className={btn("primary", "flex-1 !bg-red-600 !py-2")} onClick={() => run(() => deleteProperty(p.id))}>Delete</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <Link href={`/property/${p.id}`} className="block text-[15px] font-extrabold leading-snug">{p.title}</Link>
        <p className="flex items-center gap-1 text-xs text-mute"><Icon name="pin" className="h-3.5 w-3.5" />{p.locality}, {p.city}</p>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-xl font-extrabold tracking-tight">{formatPrice(p)}{p.purpose === "RENT" && <span className="text-xs font-semibold text-mute">/mo</span>}</p>
          {sq && <p className="text-[11px] text-mute">{sq}</p>}
        </div>
        <div className="flex gap-1.5">
          <Pill tone="soft"><Icon name="eye" className="mr-1 h-3 w-3" />{p.views}</Pill>
          <Link href="/owner/inquiries"><Pill tone="soft"><Icon name="chat" className="mr-1 h-3 w-3" />{inquiries} {inquiries === 1 ? "inquiry" : "inquiries"}</Pill></Link>
        </div>
      </div>
      <div className="flex gap-2">
        <Link href={`/owner/post?edit=${p.id}`} className={btn("primary", "flex-1")}><Icon name="edit" className="h-4 w-4" />{p.status === "DRAFT" ? "Continue" : "Edit"}</Link>
        {p.status === "ACTIVE" ? (
          <button type="button" disabled={pending} onClick={() => run(() => setStatus(p.id, done))} className={btn("brand", "flex-1")}>
            <Icon name="check" className="h-4 w-4" />Mark {done.toLowerCase()}
          </button>
        ) : p.status === "DRAFT" ? (
          <span className={btn("soft", "flex-1 cursor-default")}>Not published</span>
        ) : (
          <Link href={`/property/${p.id}`} className={btn("soft", "flex-1")}><Icon name="eye" className="h-4 w-4" />Preview</Link>
        )}
      </div>
      {err && <p role="alert" className="text-xs font-semibold text-red-600">{err}</p>}
    </Card>
  );
}
