"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Sheet from "@/components/Sheet";
import SubmitButton from "@/components/SubmitButton";
import { Icon, btn, cx, inputCls } from "@/components/ui";
import { createInquiry } from "@/app/actions/buyer";

const SLOTS = [["10:00 AM", 10], ["1:00 PM", 13], ["4:00 PM", 16], ["6:00 PM", 18]];
const MODES = [["VISIT", "Visit"], ["MESSAGE", "Message"], ["CALLBACK", "Callback"]];

function Chip({ on, children, ...p }) {
  return (
    <button type="button" aria-pressed={on} className={cx("rounded-full px-3.5 py-2 text-xs font-bold", on ? "bg-navy text-white" : "bg-fill text-ink")} {...p}>
      {children}
    </button>
  );
}

export default function DetailActions({ propertyId, title, ownerPhone, loggedIn, userPhone, openVisit = false }) {
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("VISIT");
  const [state, action] = useActionState(createInquiry, null);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState(2);
  const [autoOpened, setAutoOpened] = useState(false);

  const days = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i + 1);
      return { d, label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }) };
    });
  }, []);
  const visitAt = useMemo(() => {
    const d = new Date(days[day].d);
    d.setHours(SLOTS[slot][1], 0, 0, 0);
    return d.toISOString();
  }, [days, day, slot]);

  const show = (m) => {
    if (!loggedIn) return router.push(`/login?next=${encodeURIComponent(path + (m === "VISIT" ? "?visit=1" : ""))}`);
    setMode(m);
    setOpen(true);
  };

  // opened from a card's "Book Visit" link (?visit=1)
  if (openVisit && !autoOpened && loggedIn) {
    setAutoOpened(true);
    setOpen(true);
  }

  const wa = `https://wa.me/91${ownerPhone}?text=${encodeURIComponent(`Hi, I'm interested in "${title}" on Brickbaaz.`)}`;

  return (
    <>
      <div
        className="sticky bottom-0 z-30 flex items-center gap-2 border-t border-line bg-white px-3 pt-2.5"
        style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy text-xs font-extrabold text-white">BB</span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-extrabold">Owner desk</p>
            <p className="truncate text-[10.5px] text-mute">Brickbaaz</p>
          </div>
        </div>
        <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" className="grid h-11 w-11 place-items-center rounded-xl bg-[#1f8f5f] text-white">
          <Icon name="chat" className="h-5 w-5" />
        </a>
        <a href={`tel:+91${ownerPhone}`} aria-label="Call owner" className="grid h-11 w-11 place-items-center rounded-xl bg-fill">
          <Icon name="phone" className="h-5 w-5" />
        </a>
        <button type="button" onClick={() => show("VISIT")} className={btn("primary", "h-11")}>
          Request Visit <Icon name="cal" className="h-4 w-4" />
        </button>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title={state?.ok ? "Request sent" : "Contact owner"}>
        {state?.ok ? (
          <div className="space-y-4 pb-2 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ok text-white">
              <Icon name="check" className="h-7 w-7" />
            </span>
            <p className="text-sm text-mute">The owner has been notified and will get back to you soon. You can follow up in your inquiries.</p>
            <Link href={`/inquiries/${state.id}`} className={btn("primary", "w-full")}>
              Open conversation
            </Link>
          </div>
        ) : (
          <form action={action} className="space-y-4 pb-2">
            <input type="hidden" name="propertyId" value={propertyId} />
            <input type="hidden" name="kind" value={mode} />
            <div className="flex gap-2" role="tablist">
              {MODES.map(([v, l]) => (
                <Chip key={v} on={mode === v} onClick={() => setMode(v)} role="tab">
                  {l}
                </Chip>
              ))}
            </div>
            {mode === "VISIT" && (
              <>
                <input type="hidden" name="visitAt" value={visitAt} />
                <div>
                  <p className="mb-1.5 text-[11px] font-bold text-mute">Pick a day</p>
                  <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
                    {days.map((x, i) => (
                      <Chip key={x.label} on={day === i} onClick={() => setDay(i)}>
                        {x.label}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-bold text-mute">Time slot</p>
                  <div className="flex flex-wrap gap-2">
                    {SLOTS.map(([l], i) => (
                      <Chip key={l} on={slot === i} onClick={() => setSlot(i)}>
                        {l}
                      </Chip>
                    ))}
                  </div>
                </div>
              </>
            )}
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold text-mute">Your phone</span>
              <input name="phone" defaultValue={userPhone} inputMode="numeric" maxLength={10} required placeholder="10-digit mobile number" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold text-mute">{mode === "MESSAGE" ? "Message" : "Note to owner (optional)"}</span>
              <textarea name="note" rows={3} maxLength={500} required={mode === "MESSAGE"} placeholder={mode === "VISIT" ? "e.g. Coming with family" : mode === "CALLBACK" ? "Best time to call" : "Is it still available?"} className={inputCls} />
            </label>
            {state?.error && (
              <p role="alert" className="text-xs font-semibold text-red-600">
                {state.error} {state.unverified && <Link href={`/verify-email?next=${encodeURIComponent(path)}`} className="underline">Resend link</Link>}
              </p>
            )}
            <SubmitButton pendingText="Sending…">
              {mode === "VISIT" ? "Send visit request" : mode === "CALLBACK" ? "Request callback" : "Send message"}
            </SubmitButton>
          </form>
        )}
      </Sheet>
    </>
  );
}
