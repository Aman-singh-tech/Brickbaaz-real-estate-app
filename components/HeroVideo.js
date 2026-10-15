"use client";
import { useEffect, useRef, useState } from "react";

export default function HeroVideo() {
  const video = useRef(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (preference.matches) { video.current?.pause(); }
      else video.current?.play().catch(() => {});
    };
    sync(); preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, []);
  return <>
    <div className="absolute inset-0 bg-navy" />
    {!failed && <video ref={video} src="/videos/brickbaaz-tour-landscape.mp4?v=hd-20261015" muted loop playsInline preload="none" aria-label="Brickbaaz promotional video" className="hero-video-main" onError={() => setFailed(true)} />}

  </>;
}
