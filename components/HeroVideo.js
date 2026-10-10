"use client";
import { useEffect, useRef, useState } from "react";

export default function HeroVideo() {
  const video = useRef(null);
  const [paused, setPaused] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (preference.matches) video.current?.pause();
      else video.current?.play().catch(() => {});
    };
    sync(); preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, []);
  return <>
    <div className="absolute inset-0 bg-navy" style={{ backgroundImage: "url('/hero.jpg')", backgroundSize: "cover", backgroundPosition: "center" }} />
    {!failed && <video ref={video} src="/videos/brickbaaz-promotional.mp4" poster="/hero.jpg" muted loop playsInline preload="none" aria-label="Brickbaaz promotional video" className="absolute inset-0 h-full w-full object-cover" onPlay={() => setPaused(false)} onPause={() => setPaused(true)} onError={() => setFailed(true)} />}
    <div className="absolute bottom-20 right-5 z-10 flex items-center gap-3 rounded-full border border-white/20 bg-navy/75 px-4 py-2 text-xs font-bold text-white backdrop-blur md:bottom-24 md:right-8">
      {!failed && <button type="button" aria-label={paused ? "Play promotional video" : "Pause promotional video"} onClick={() => { if (video.current.paused) video.current.play().catch(() => {}); else video.current.pause(); }}>{paused ? "Play" : "Pause"}</button>}
      <a href="/videos/brickbaaz-promotional.mp4" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Watch full video ↗</a>
    </div>
  </>;
}
