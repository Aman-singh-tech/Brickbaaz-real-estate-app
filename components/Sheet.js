"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui";

// Bottom sheet used for filters, visit/contact requests and the map pin picker.
export default function Sheet({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-navy/45" />
      <div className="relative flex max-h-[88dvh] w-full max-w-[480px] flex-col rounded-t-3xl bg-white shadow-2xl">
        <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-line" />
        <div className="flex items-center justify-between px-5 pb-2 pt-3">
          <h2 className="text-base font-extrabold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full bg-fill">
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-4">{children}</div>
        {footer && (
          <div className="border-t border-line px-5 pt-3" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
