"use client";
import { useEffect, useRef, useState } from "react";

export default function HeroVideo() {
  const video = useRef(null);
  const background = useRef(null);
  const [paused, setPaused] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (preference.matches) { video.current?.pause(); background.current?.pause(); }
      else video.current?.play().catch(() => {});
    };
    sync(); preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, []);
  return <>
    <div className="absolute inset-0 bg-navy" />
    {!failed && <video ref={background} src="/videos/brickbaaz-promotional.mp4" muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} className="hero-video-background" />}
    {!failed && <video ref={video} src="/videos/brickbaaz-promotional.mp4" muted loop playsInline preload="none" aria-label="Brickbaaz promotional video" className="hero-video-main" onPlay={() => { setPaused(false); if (background.current) { background.current.currentTime = video.current.currentTime; background.current.play().catch(() => {}); } }} onPause={() => { setPaused(true); background.current?.pause(); }} onError={() => setFailed(true)} />}
    <div className="hero-video-controls flex items-center justify-center gap-4 bg-navy py-3 text-xs font-bold text-white">
      {!failed && <button type="button" aria-label={paused ? "Play promotional video" : "Pause promotional video"} onClick={() => { if (video.current.paused) video.current.play().catch(() => {}); else video.current.pause(); }}>{paused ? "Play" : "Pause"}</button>}
      <a href="/videos/brickbaaz-promotional.mp4" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Watch full video ↗</a>
    </div>
  </>;
}
