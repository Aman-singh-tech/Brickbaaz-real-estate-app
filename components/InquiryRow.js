import Link from "next/link";
import { Icon, Pill } from "@/components/ui";
import { fmtDateTime, timeAgo } from "@/lib/format";

const KIND = { VISIT: "Visit request", CALLBACK: "Requested callback", MESSAGE: "Message" };
const initials = (n) => (n || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

// Owner-side inquiry row with quick call / WhatsApp buttons for the buyer.
export default function InquiryRow({ i, last }) {
  const name = i.user.name || i.user.email || `+91 ${i.phone}`;
  return (
    <div className="flex items-center gap-3 py-3">
      <Link href={`/owner/inquiries/${i.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-fill text-xs font-extrabold">{initials(i.user.name)}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[13.5px] font-extrabold">{name}</span>
            {!i.handled && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="New" />}
          </span>
          <span className="block truncate text-xs text-mute">For: {i.property.title}</span>
          <span className="block truncate text-xs font-semibold text-brand">
            {KIND[i.kind]}{i.visitAt ? ` · ${fmtDateTime(i.visitAt)}` : ""} · {timeAgo(i.createdAt)}
          </span>
          {last && <span className="block truncate text-[11px] text-mute">“{last}”</span>}
        </span>
      </Link>
      <a href={`tel:+91${i.phone}`} aria-label={`Call ${name}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-fill"><Icon name="phone" className="h-4 w-4" /></a>
      <a href={`https://wa.me/91${i.phone}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${name}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ok text-white"><Icon name="chat" className="h-4 w-4" /></a>
    </div>
  );
}

export { Pill };
