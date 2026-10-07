"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui";

export default function HomeMotion({ children }) {
  const root = useRef(null);
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          if (reduced.matches) continue;
          const animation = entry.target.animate(
            [
              { opacity: 0.35, transform: "translateY(20px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: 550, easing: "cubic-bezier(.2,.65,.3,1)" },
          );
          animations.add(animation);
          animation.finished
            .then(() => animations.delete(animation))
            .catch(() => {});
        }
      },
      { threshold: 0.08 },
    );
    root.current
      .querySelectorAll("[data-reveal]")
      .forEach((section) => observer.observe(section));
    const header = document.querySelector(".customer-shell > header");
    const scroll = () => {
      setShowTop(window.scrollY > 600);
      header?.classList.toggle("header-scrolled", window.scrollY > 24);
    };
    const preference = () => {
      if (reduced.matches)
        animations.forEach((animation) => animation.cancel());
    };
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    reduced.addEventListener("change", preference);
    return () => {
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
      window.removeEventListener("scroll", scroll);
      reduced.removeEventListener("change", preference);
      header?.classList.remove("header-scrolled");
    };
  }, []);
  return (
    <div
      ref={root}
      id="home-top"
      className="home-page space-y-12 px-4 pb-0 pt-6 md:space-y-20"
    >
      {children}
      {showTop && (
        <button
          type="button"
          aria-label="Back to top"
          onClick={() => {
            window.scrollTo({
              top: 0,
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                .matches
                ? "instant"
                : "smooth",
            });
          }}
          className="back-to-top fixed bottom-5 right-5 z-20 grid h-11 w-11 place-items-center rounded-full bg-navy text-white shadow-xl hover:bg-brand"
        >
          <Icon name="back" className="h-5 w-5 rotate-90" />
        </button>
      )}
    </div>
  );
}
