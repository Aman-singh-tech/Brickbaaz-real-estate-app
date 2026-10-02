import Link from "next/link";

export const cx = (...a) => a.filter(Boolean).join(" ");

export function Logo({ size = "text-lg" }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 font-extrabold tracking-tight", size)}>
      <svg viewBox="0 0 200 200" className="h-[1.4em] w-[1.4em]" aria-hidden="true">
        <circle cx="100" cy="100" r="96" fill="#fff" stroke="#0b1426" strokeWidth="8" />
        <circle cx="100" cy="100" r="82" fill="#0b1426" />
        <path d="M62 76L100 44L138 76" fill="none" stroke="#e07a1f" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        <g transform="translate(68 88) scale(.8) translate(-70 -62)">
          <path fillRule="evenodd" fill="#fff" d="M70 62H112C134 62 144 74 144 87C144 96 139 103 131 107C142 111 150 120 150 131C150 146 138 156 116 156H70ZM92 80H108C116 80 120 84 120 88C120 92 116 96 108 96H92ZM92 114H110C119 114 124 119 124 124C124 129 119 134 110 134H92Z" />
          <rect x="66" y="103" width="90" height="6" fill="#0b1426" />
        </g>
      </svg>
      <span className="text-navy">
        Brick<span className="text-brand">baaz</span>
      </span>
    </span>
  );
}

export function Pill({ children, tone = "plain", className }) {
  const tones = {
    plain: "bg-white text-ink border border-line",
    ok: "bg-white text-ok border border-line",
    brand: "bg-brand-soft text-brand border border-transparent",
    dark: "bg-navy text-white border border-transparent",
    soft: "bg-fill text-ink border border-transparent",
  };
  return (
    <span className={cx("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10.5px] font-bold", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Card({ children, className, as: Tag = "div", ...rest }) {
  return (
    <Tag className={cx("rounded-2xl border border-line bg-white p-3.5", className)} {...rest}>
      {children}
    </Tag>
  );
}

const btnBase = "inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-[13.5px] font-bold transition active:scale-[.98] disabled:opacity-50";
const btnTone = {
  primary: "bg-navy text-white",
  brand: "bg-brand text-white",
  soft: "bg-fill text-ink",
  outline: "border-[1.5px] border-dashed border-line text-mute bg-white",
  ghost: "text-ink",
};
export const btn = (tone = "primary", extra) => cx(btnBase, btnTone[tone], extra);

export function LinkButton({ href, tone = "primary", className, children, ...rest }) {
  return (
    <Link href={href} className={btn(tone, className)} {...rest}>
      {children}
    </Link>
  );
}

export function SectionTitle({ children, action, href }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[15px] font-extrabold tracking-tight">{children}</h2>
      {action && href ? (
        <Link href={href} className="text-xs font-bold text-brand">
          {action}
        </Link>
      ) : action ? (
        <span className="text-xs font-bold text-brand">{action}</span>
      ) : null}
    </div>
  );
}

export const inputCls =
  "w-full rounded-xl border border-line bg-fill px-3.5 py-3 text-sm outline-none placeholder:text-mute/70 focus:border-navy";

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-[11px] font-bold text-mute">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-[11px] text-mute">{hint}</span>}
    </label>
  );
}

export function Icon({ name, className = "h-5 w-5" }) {
  const p = {
    home: "M3 11 12 3l9 8M5 10v10h14V10",
    search: "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm10 2-4.3-4.3",
    heart: "M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0",
    plus: "M12 5v14M5 12h14",
    bell: "M6 17V11a6 6 0 1 1 12 0v6l2 2H4l2-2zm4 4h4",
    phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
    chat: "M4 5h16v11H9l-5 4V5z",
    pin: "M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
    back: "M15 5l-7 7 7 7",
    share: "M18 8a3 3 0 1 0-2.8-4M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm12 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 10.5l6.8-4M8.6 13.5l6.8 4",
    check: "M5 12.5 10 17.5 19 7",
    x: "M6 6l12 12M18 6 6 18",
    list: "M4 6h16M4 12h16M4 18h16",
    grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
    map: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14",
    filter: "M4 6h16M7 12h10M10 18h4",
    cal: "M5 6h14v14H5zM5 10h14M9 3v4M15 3v4",
    calc: "M6 3h12v18H6zM9 7h6M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01",
    eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    edit: "M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4",
    dots: "M12 6h.01M12 12h.01M12 18h.01",
    bed: "M3 18V7M3 14h18v4M21 14v-3a3 3 0 0 0-3-3h-7v6M7 11h.01",
    area: "M4 20V4h16M4 20 20 4",
    up: "M12 19V5M5 12l7-7 7 7",
    send: "M4 12 20 4l-4 16-4-6-8-2z",
    shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z",
    play: "M8 5v14l11-7z",
    camera: "M4 8h4l2-3h4l2 3h4v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={p[name] ?? ""} />
    </svg>
  );
}
