"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon, cx } from "@/components/ui";

// Conversation thread. `me` is "BUYER" or "OWNER"; `send` is the matching server action.
export default function Chat({ inquiryId, messages, me, send, quick = [] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const end = useRef(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    const t = setInterval(() => document.visibilityState === "visible" && router.refresh(), 8000);
    return () => clearInterval(t);
  }, [router]);

  const submit = (body) => {
    const v = (body ?? text).trim();
    if (!v) return;
    setErr("");
    start(async () => {
      const res = await send(inquiryId, v);
      if (res?.error) setErr(res.error);
      else {
        setText("");
        router.refresh();
      }
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages.length === 0 && <p className="py-10 text-center text-sm text-mute">No messages yet. Say hello below.</p>}
        {messages.map((m) => (
          <div key={m.id} className={cx("flex", m.sender === me ? "justify-end" : "justify-start")}>
            <div className={cx("max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug", m.sender === me ? "rounded-br-md bg-navy text-white" : "rounded-bl-md bg-white text-ink border border-line")}>
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
              <p className={cx("mt-1 text-[10px]", m.sender === me ? "text-white/60" : "text-mute")}>
                {new Date(m.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>
      {quick.length > 0 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
          {quick.map((q) => (
            <button key={q} type="button" disabled={pending} onClick={() => submit(q)} className="shrink-0 rounded-full bg-fill px-3.5 py-2 text-xs font-bold">
              {q}
            </button>
          ))}
        </div>
      )}
      {err && <p role="alert" className="px-4 pb-1 text-xs font-semibold text-red-600">{err}</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-center gap-2 border-t border-line bg-white px-3 pt-2.5"
        style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="Type a message…" aria-label="Message" className="min-w-0 flex-1 rounded-xl border border-line bg-fill px-3.5 py-3 text-sm outline-none" />
        <button type="submit" disabled={pending || !text.trim()} aria-label="Send" className="grid h-11 w-11 place-items-center rounded-xl bg-navy text-white disabled:opacity-40">
          <Icon name="send" className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
