"use client";

import { useRef, useState } from "react";
import { Icon, cx } from "@/components/ui";
import { imgUrl } from "@/lib/format";

// Swipeable photo/video gallery with a 1/N counter and arrows.
export default function Gallery({ media, title, children }) {
  const ref = useRef(null);
  const [i, setI] = useState(0);
  const go = (n) => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.max(0, Math.min(media.length - 1, n));
    el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
  };
  return (
    <div className="relative">
      <div
        ref={ref}
        onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="no-scrollbar flex h-72 snap-x snap-mandatory overflow-x-auto bg-fill"
      >
        {media.length === 0 ? (
          <div className="grid w-full shrink-0 place-items-center text-mute/60">
            <Icon name="home" className="h-14 w-14" />
          </div>
        ) : (
          media.map((m, idx) => (
            <div key={m.id ?? m.url} className="relative h-full w-full shrink-0 snap-center">
              {m.kind === "VIDEO" ? (
                <video src={m.url} controls playsInline preload="metadata" className="h-full w-full bg-black object-contain" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgUrl(m.url, 1200)} alt={`${title} photo ${idx + 1}`} className="h-full w-full object-cover" loading={idx ? "lazy" : "eager"} />
              )}
            </div>
          ))
        )}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
      {media.length > 1 && (
        <>
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-navy/70 px-3 py-1 text-[11px] font-bold text-white">
            <Icon name="camera" className="h-3.5 w-3.5" /> {i + 1}/{media.length}
          </div>
          <div className="absolute bottom-3 right-3 flex gap-2">
            {[-1, 1].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => go(i + d)}
                aria-label={d < 0 ? "Previous photo" : "Next photo"}
                className={cx("grid h-8 w-8 place-items-center rounded-full bg-white/90")}
              >
                <Icon name="back" className={cx("h-4 w-4", d > 0 && "rotate-180")} />
              </button>
            ))}
          </div>
        </>
      )}
      {children}
    </div>
  );
}
