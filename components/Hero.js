import Link from "next/link";
import HeroVideo from "@/components/HeroVideo";
import { btn } from "@/components/ui";

export default function Hero() {
  return <section className="home-hero discovery-hero">
    <div className="hero-copy">
      <p className="text-xs font-bold tracking-widest text-[#e0b589]">PROPERTY DISCOVERY · GURUGRAM</p>
      <h1>Find your next address <span>in Gurugram.</span></h1>
      <p className="max-w-md text-sm leading-7 text-white/80">Explore homes and builder projects. Compare the details, build your shortlist and arrange a visit with Brickbaaz.</p>
      <div className="flex flex-wrap gap-3"><a href="#properties" className={btn("brand")}>Explore properties <span aria-hidden="true">→</span></a><Link href="/saved" className={btn("outline", "!bg-transparent !text-white !border-white/40")}>My shortlist</Link></div>
    </div>
    <div className="discovery-film"><HeroVideo /></div>
  </section>;
}
