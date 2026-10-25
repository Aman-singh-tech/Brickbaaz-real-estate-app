import { postingLink } from "@/lib/posting-links";
import { cloudinaryConfig, signCloudinary } from "@/lib/media";
export async function POST(request, { params }) {
  const link = await postingLink((await params).token);
  if (!link)
    return Response.json(
      { error: "Posting link is unavailable" },
      { status: 403 },
    );
  const c = cloudinaryConfig();
  if (!c) return Response.json({ mode: "local" });
  const signed = {
    folder: `brickbaaz/invites/${link.id}`,
    timestamp: Math.floor(Date.now() / 1000),
  };
  return Response.json(
    {
      mode: "cloudinary",
      cloud: c.cloud,
      apiKey: c.key,
      ...signed,
      signature: signCloudinary(signed),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
