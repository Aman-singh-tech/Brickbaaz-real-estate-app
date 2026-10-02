import Link from "next/link";
import BackBar from "@/components/BackBar";
import { ResendVerification } from "@/components/AuthForms";
import { Icon, btn } from "@/components/ui";
import { getBuyer } from "@/lib/auth";

export const metadata = { title: "Verify email" };

export default async function VerifyEmail({ searchParams }) {
  const sp = await searchParams;
  const user = await getBuyer();
  const next = typeof sp.next === "string" && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/";
  const done = sp.done === "1" || user?.emailVerified;

  return (
    <>
      <BackBar title="Verify email" fallback="/" />
      <div className="space-y-5 px-4 pt-10 text-center">
        {done ? (
          <>
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-ok text-white"><Icon name="check" className="h-8 w-8" /></span>
            <h1 className="text-2xl font-extrabold tracking-tight">Email verified</h1>
            <p className="text-sm text-mute">You can now contact owners and book visits.</p>
            <Link href={next} className={btn("primary", "mx-auto")}>Continue</Link>
          </>
        ) : sp.error ? (
          <>
            <h1 className="text-2xl font-extrabold tracking-tight">Link expired</h1>
            <p className="text-sm text-mute">This verification link is invalid or has expired.</p>
            {user ? <ResendVerification /> : <Link href="/login" className={btn("primary", "mx-auto")}>Log in to resend</Link>}
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold tracking-tight">Check your inbox</h1>
            <p className="text-sm text-mute">We sent a verification link to <b className="text-ink">{user?.email ?? "your email"}</b>. Verify it to contact owners. You can keep browsing meanwhile.</p>
            {sp.dev && (
              <p className="break-all rounded-xl bg-brand-soft px-3 py-2 text-left text-xs font-semibold text-brand">
                Dev mode: no email service is configured. <a className="underline" href={sp.dev}>Open the verification link</a>
              </p>
            )}
            {user && <ResendVerification />}
            <Link href={next} className={btn("soft", "mx-auto")}>Skip for now</Link>
          </>
        )}
      </div>
    </>
  );
}
