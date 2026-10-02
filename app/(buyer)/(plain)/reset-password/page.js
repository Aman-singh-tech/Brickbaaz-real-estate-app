import Link from "next/link";
import BackBar from "@/components/BackBar";
import { ResetForm } from "@/components/AuthForms";
import { btn } from "@/components/ui";

export const metadata = { title: "Set new password" };

export default async function Reset({ searchParams }) {
  const { token } = await searchParams;
  return (
    <>
      <BackBar title="New password" fallback="/login" />
      <div className="space-y-5 px-4 pt-8">
        {token ? (
          <>
            <h1 className="text-2xl font-extrabold tracking-tight">Choose a new password</h1>
            <ResetForm token={token} />
          </>
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-sm text-mute">This reset link is missing or invalid.</p>
            <Link href="/forgot-password" className={btn("primary", "mx-auto")}>Request a new link</Link>
          </div>
        )}
      </div>
    </>
  );
}
