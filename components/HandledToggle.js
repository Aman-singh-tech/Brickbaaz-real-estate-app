"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setInquiryHandled } from "@/app/actions/owner";

export default function HandledToggle({ id, handled, kind }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await setInquiryHandled(id, !handled);
          router.refresh();
        })
      }
      className="ml-auto rounded-full border border-line px-3 py-1.5 text-xs font-bold disabled:opacity-50"
    >
      {handled ? "Reopen" : kind === "VISIT" ? "Confirm visit" : "Mark handled"}
    </button>
  );
}
