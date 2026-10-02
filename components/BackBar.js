"use client";

import { useRouter } from "next/navigation";
import { Icon, Logo, Pill } from "@/components/ui";

// Back arrow + page title. `owner` adds the OWNER tag used across the owner app.
export default function BackBar({ title, fallback = "/", owner = false, right }) {
  const router = useRouter();
  const back = () => (window.history.length > 1 ? router.back() : router.push(fallback));
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2.5 border-b border-line bg-white/95 px-3 py-2.5 backdrop-blur">
      <button type="button" onClick={back} aria-label="Go back" className="grid h-9 w-9 place-items-center rounded-full bg-fill">
        <Icon name="back" className="h-[18px] w-[18px]" />
      </button>
      {owner && (
        <>
          <Logo size="text-sm" />
          <Pill tone="dark">OWNER</Pill>
        </>
      )}
      <h1 className="min-w-0 flex-1 truncate text-sm font-extrabold">{title}</h1>
      {right}
    </header>
  );
}
