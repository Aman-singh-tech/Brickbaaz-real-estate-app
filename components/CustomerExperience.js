"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function ThemeControl() {
  const select = useRef(null);
  useEffect(() => {
    try { select.current.value = localStorage.getItem("bb-theme") || "auto"; } catch {}
  }, []);
  return <label className="theme-control"><span className="sr-only">Appearance</span><select ref={select} defaultValue="auto" aria-label="Appearance" onChange={e => {
    try { localStorage.setItem("bb-theme", e.target.value); } catch {}
    window.dispatchEvent(new CustomEvent("bb-theme-change", { detail: e.target.value }));
  }}><option value="auto">Auto theme</option><option value="light">Day theme</option><option value="dark">Night theme</option></select></label>;
}

export default function CustomerExperience({ children }) {
  const root = useRef(null);
  const path = usePathname();
  useEffect(() => {
    let preference = "auto";
    try { preference = localStorage.getItem("bb-theme") || "auto"; } catch {}
    const apply = () => {
      const hour = new Date().getHours();
      root.current.dataset.theme = preference === "dark" || (preference === "auto" && (hour < 7 || hour >= 19)) ? "dark" : "light";
    };
    const change = e => { preference = e.detail; apply(); };
    apply();
    const timer = setInterval(apply, 60000);
    window.addEventListener("bb-theme-change", change);
    return () => { clearInterval(timer); window.removeEventListener("bb-theme-change", change); };
  }, []);
  useEffect(() => {
    const observed = new WeakSet();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("heading-visible"); observer.unobserve(entry.target); }
    }), { threshold: .3 });
    const scan = () => root.current.querySelectorAll("main h2").forEach(heading => {
      if (observed.has(heading)) return;
      observed.add(heading); heading.classList.add("architectural-heading");
      if (reduced.matches) heading.classList.add("heading-visible"); else observer.observe(heading);
    });
    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(root.current, { childList: true, subtree: true });
    const scroll = () => root.current?.querySelector(".customer-shell > header")?.classList.toggle("header-scrolled", window.scrollY > 24);
    scroll(); window.addEventListener("scroll", scroll, { passive: true });
    return () => { observer.disconnect(); mutations.disconnect(); window.removeEventListener("scroll", scroll); };
  }, [path]);
  return <div ref={root} className="customer-experience">{children}</div>;
}
