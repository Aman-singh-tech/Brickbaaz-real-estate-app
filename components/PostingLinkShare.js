"use client";
import { useState } from "react";
import { btn } from "@/components/ui";
export default function PostingLinkShare({ url }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-3">
      <input
        aria-label="Posting link"
        readOnly
        value={url}
        className="w-full rounded-lg border border-line p-3 text-sm"
        onFocus={(e) => e.target.select()}
      />
      <div className="flex flex-wrap gap-3">
        <button
          className={btn("soft")}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "Copied" : "Copy link"}
        </button>
        <a
          className={btn("brand")}
          href={`https://wa.me/?text=${encodeURIComponent(`Post your property on Brickbaaz: ${url}`)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Share on WhatsApp
        </a>
      </div>
    </div>
  );
}
