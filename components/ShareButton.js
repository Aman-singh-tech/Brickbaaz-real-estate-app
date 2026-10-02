"use client";

import { useState } from "react";
import { Icon } from "@/components/ui";

export default function ShareButton({ title }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) return await navigator.share({ title, url });
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };
  return (
    <button type="button" onClick={share} aria-label="Share" className="relative grid h-9 w-9 place-items-center rounded-full bg-fill">
      <Icon name="share" className="h-[18px] w-[18px]" />
      {copied && <span className="absolute right-0 top-11 whitespace-nowrap rounded-lg bg-navy px-2 py-1 text-[10px] font-bold text-white">Link copied</span>}
    </button>
  );
}
