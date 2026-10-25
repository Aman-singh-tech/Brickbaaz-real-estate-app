"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
export default function InventoryRefresh() {
  const router = useRouter();
  const path = usePathname();
  useEffect(() => {
    // Do not interrupt forms or conversations; refresh inventory views only.
    if (
      ![
        "/",
        "/search",
        "/saved",
        "/owner/dashboard",
        "/owner/listings",
        "/owner/posting-links",
        "/owner/notifications",
      ].includes(path)
    )
      return;
    let revision,
      stopped = false,
      busy = false;
    async function check() {
      if (document.hidden || busy) return;
      busy = true;
      try {
        const res = await fetch("/api/inventory-revision", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (stopped) return;
        if (revision !== undefined && revision !== data.revision)
          router.refresh();
        revision = data.revision;
      } catch {
        /* Retry when the connection returns. */
      } finally {
        busy = false;
      }
    }
    check();
    const timer = setInterval(check, 5000);
    document.addEventListener("visibilitychange", check);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [router, path]);
  return null;
}
