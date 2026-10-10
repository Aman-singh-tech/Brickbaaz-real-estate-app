import fs from "node:fs";
import path from "node:path";
import { Pill } from "@/components/ui";
import HeroGallery from "@/components/HeroGallery";
import HeroVideo from "@/components/HeroVideo";

// Explore hero. Drop a photo at public/hero.jpg (landscape, ~1600px wide) and it is used automatically;
// until then a drawn city skyline is shown.
const hasPhoto = () => {
  try {
    return fs.existsSync(path.join(process.cwd(), "public", "hero.jpg"));
  } catch {
    return false;
  }
};

const TOWERS = [
  // x, width, height, shade
  [0, 34, 92, "#14213d"],
  [30, 40, 132, "#1a2a4d"],
  [68, 30, 78, "#14213d"],
  [96, 46, 158, "#22345c"],
  [140, 34, 104, "#1a2a4d"],
  [172, 42, 142, "#14213d"],
  [212, 30, 86, "#22345c"],
  [240, 48, 170, "#1a2a4d"],
  [286, 34, 110, "#14213d"],
  [318, 44, 136, "#22345c"],
  [360, 32, 90, "#1a2a4d"],
];

function Skyline() {
  return (
    <svg
      viewBox="0 0 400 220"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1426" />
          <stop offset=".62" stopColor="#1d3158" />
          <stop offset="1" stopColor="#c8692a" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill="url(#sky)" />
      <circle cx="318" cy="132" r="30" fill="#f3a254" opacity=".9" />
      <circle cx="318" cy="132" r="46" fill="#f3a254" opacity=".14" />
      {TOWERS.map(([x, w, h, c], i) => (
        <g key={i}>
          <rect x={x} y={220 - h} width={w} height={h} fill={c} />
          {Array.from({ length: Math.floor((h - 14) / 14) }).map((_, r) =>
            Array.from({ length: Math.floor((w - 8) / 10) }).map((__, k) => {
              const lit = (i * 7 + r * 3 + k * 5) % 4 === 0;
              return (
                <rect
                  key={`${r}-${k}`}
                  x={x + 6 + k * 10}
                  y={220 - h + 8 + r * 14}
                  width="4.5"
                  height="7"
                  rx="1"
                  fill={lit ? "#f3a254" : "#ffffff"}
                  opacity={lit ? 0.95 : 0.1}
                />
              );
            }),
          )}
        </g>
      ))}
    </svg>
  );
}

export default function Hero({ photos = [] }) {
  const photo = hasPhoto();
  const hasVideo = fs.existsSync(path.join(process.cwd(), "public", "videos", "brickbaaz-promotional.mp4"));
  const gallery = [
    ...(photo ? [{ url: "/hero.jpg", title: "Brickbaaz" }] : []),
    ...photos,
  ]
    .filter(
      (item, i, all) => all.findIndex((other) => other.url === item.url) === i,
    )
    .slice(0, 3);
  return (
    <section className={`${hasVideo ? "video-hero" : ""} home-hero relative -mx-4 -mt-6 h-[460px] overflow-hidden bg-navy md:mx-0 md:mt-0 md:h-[540px] md:rounded-[32px]`}>
      {hasVideo ? <HeroVideo /> : gallery.length ? <HeroGallery photos={gallery} /> : <Skyline />}
      <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/55 to-navy/20" />
      <div className="hero-copy relative flex h-full max-w-3xl flex-col justify-center gap-5 px-6 pb-24 md:px-14 md:pb-20">
        <Pill tone="brand" className="self-start !px-3 !py-1.5 tracking-wider">
          YOUR NEXT MOVE · GURUGRAM
        </Pill>
        <h1 className="text-[38px] font-extrabold leading-[1.08] tracking-tight text-white md:text-[64px]">
          Find your property
          <br />
          <span className="text-[#f2bc87]">in Gurugram.</span>
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-white/80 md:text-base">
          Discover homes and builder projects in Gurugram. Connect directly,
          explore freely, and find your place.
        </p>
        <div className="flex gap-5 text-[11px] font-semibold text-white/75 md:text-sm">
          <span>Buy &amp; rent</span>
          <span>Builder projects</span>
          <span>Site visits</span>
        </div>
      </div>
    </section>
  );
}
