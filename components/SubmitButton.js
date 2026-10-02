"use client";

import { useFormStatus } from "react-dom";
import { btn } from "@/components/ui";

export default function SubmitButton({ children, pendingText = "Please wait…", tone = "primary", className }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={btn(tone, `w-full ${className ?? ""}`)}>
      {pending ? pendingText : children}
    </button>
  );
}
