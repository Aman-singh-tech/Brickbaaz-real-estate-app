import { postingLink } from "@/lib/posting-links";
import PostWizard from "@/components/PostWizard";
export const metadata = {
  title: "Post a property · Brickbaaz",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";
export default async function InvitedPost({ params }) {
  const { token } = await params;
  if (!(await postingLink(token)))
    return (
      <main className="mx-auto max-w-xl p-10">
        <h1 className="text-2xl font-bold">Posting link unavailable</h1>
        <p className="mt-4">Please ask Brickbaaz for a new posting link.</p>
      </main>
    );
  return (
    <main className="mx-auto max-w-4xl pb-10">
      <PostWizard inviteToken={token} />
    </main>
  );
}
