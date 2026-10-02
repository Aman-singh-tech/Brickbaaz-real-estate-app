import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo, Card, Icon } from "@/components/ui";
import AuthTabs from "@/components/AuthForms";
import { getBuyer } from "@/lib/auth";

export const metadata = { title: "Log in" };

const ERRORS = {
  google: "Google sign-in did not complete. Please try again.",
  owner: "That Google account cannot be used here. Owners sign in through the owner app.",
};

export default async function Login({ searchParams }) {
  const { next = "/", error, mode } = await searchParams;
  if (await getBuyer()) redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
  const google = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  return (
    <div className="space-y-5 px-4 pb-10 pt-8">
      <div className="space-y-2 text-center">
        <Link href="/" className="inline-block"><Logo size="text-xl" /></Link>
        <h1 className="pt-3 text-[26px] font-extrabold tracking-tight">Welcome to Brickbaaz</h1>
        <p className="text-sm text-mute">Search, shortlist and connect with genuine property owners.</p>
      </div>
      <Card className="space-y-4 !p-5 shadow-sm">
        {error && ERRORS[error] && <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-700">{ERRORS[error]}</p>}
        <AuthTabs next={next} google={google} initialMode={mode === "signup" ? "signup" : "login"} />
        <p className="flex flex-wrap justify-center gap-x-3 text-[11.5px] font-semibold text-mute">
          <span>✔ Zero Spam</span><span>✔ Zero Brokerage</span>
        </p>
        <p className="text-center text-[11px] text-mute">
          By continuing, you agree to Brickbaaz <Link href="/terms" className="font-bold text-ink">Terms of Service</Link> & <Link href="/privacy" className="font-bold text-ink">Privacy Policy</Link>.
        </p>
      </Card>
      <Card className="flex items-center gap-3 !bg-brand-soft">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-brand"><Icon name="home" /></span>
        <div>
          <p className="text-[13px] font-extrabold">Looking for broker-free flats?</p>
          <p className="text-[11.5px] text-mute">Zero brokerage on every listing.</p>
        </div>
      </Card>
    </div>
  );
}
