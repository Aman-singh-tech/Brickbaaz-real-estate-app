import { headers } from "next/headers";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createPostingLink,
  disablePostingLink,
} from "@/app/actions/posting-links";
import PostingLinkShare from "@/components/PostingLinkShare";
import { Card, btn, inputCls } from "@/components/ui";
export default async function PostingLinks() {
  const owner = await requireOwner();
  const links = await prisma.postingLink.findMany({
    where: { ownerId: owner.id },
    include: { _count: { select: { submissions: true } } },
    orderBy: { createdAt: "desc" },
  });
  const h = await headers();
  const base = (
    process.env.APP_URL ||
    `${h.get("x-forwarded-proto") || "http"}://${h.get("host")}`
  ).replace(/\/$/, "");
  return (
    <div className="space-y-5 p-5">
      <h1 className="text-2xl font-bold">Property posting links</h1>
      <p>
        Share the full property form. Each link accepts one successful property
        submission. Properties publish directly; submitter contacts stay
        private.
      </p>
      <Card>
        <form action={createPostingLink} className="space-y-3">
          <label className="block">
            Link label
            <input
              name="label"
              placeholder="Builder / contact name"
              maxLength={100}
              className={inputCls}
            />
          </label>
          <button className={btn("brand")}>Create posting link</button>
        </form>
      </Card>
      {links.map((link) => (
        <Card key={link.id} className="space-y-4">
          <h2 className="font-bold">{link.label}</h2>
          <p className="text-sm">
            {link.usedAt
              ? "Used · Submission complete"
              : link.active
                ? "Active · One submission"
                : "Disabled"}{" "}
            · {link._count.submissions} submitted
          </p>
          {link.active && !link.usedAt && (
            <>
              <PostingLinkShare url={`${base}/post-property/${link.token}`} />
              <form action={disablePostingLink}>
                <input type="hidden" name="id" value={link.id} />
                <button className={btn("soft")}>Disable link</button>
              </form>
            </>
          )}
        </Card>
      ))}
    </div>
  );
}
