/* eslint-disable @next/next/no-img-element -- Signed Cloudinary photos are already transformed for delivery. */
"use client";
import { useEffect, useState } from "react";

export default function HeroGallery({ photos }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(preference.matches);
    sync();
    preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (paused || reduced || photos.length < 2) return;
    const timer = setInterval(() => {
      if (!document.hidden) setIndex((value) => (value + 1) % photos.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [paused, reduced, photos.length]);
  return (
    <>
      <div className="absolute inset-0" aria-hidden="true">
        {photos.map((photo, i) => (
          <img
            key={photo.url}
            src={photo.url}
            alt=""
            fetchPriority={i === 0 ? "high" : "low"}
            loading={i === 0 ? "eager" : "lazy"}
            className={`hero-photo absolute inset-0 h-full w-full object-cover object-[50%_62%] ${i === index ? "hero-photo-active" : ""}`}
          />
        ))}
      </div>
      {photos.length > 1 && (
        <div
          className="hero-gallery-controls absolute bottom-20 right-5 z-10 flex items-center gap-2 rounded-full border border-white/20 bg-navy/70 px-3 py-2 text-white backdrop-blur md:bottom-24 md:right-8"
          role="group"
          aria-label="Hero photo controls"
        >
          {photos.map((photo, i) => (
            <button
              key={photo.url}
              type="button"
              aria-label={`Show photo ${i + 1}: ${photo.title}`}
              aria-pressed={i === index}
              onClick={() => {
                setPaused(true);
                setIndex(i);
              }}
              className={`h-7 w-7 rounded-full border border-white/30 text-xs font-bold ${i === index ? "bg-brand text-white" : "hover:bg-white/20"}`}
            >
              {i + 1}
            </button>
          ))}
          {!reduced && (
            <button
              type="button"
              aria-label={
                paused ? "Play hero slideshow" : "Pause hero slideshow"
              }
              onClick={() => setPaused((value) => !value)}
              className="rounded-full px-2 py-1 text-xs font-semibold"
            >
              {paused ? "Play" : "Pause"}
            </button>
          )}
        </div>
      )}
    </>
  );
}
