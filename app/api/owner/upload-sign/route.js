import { getOwner } from "@/lib/auth";
import { cloudinaryConfig, signCloudinary } from "@/lib/media";

// Gives the owner's browser a signed Cloudinary upload ticket. Without Cloudinary config it answers "local" and the
// browser falls back to /api/owner/upload (dev only).
export async function POST() {
  if (!(await getOwner())) return Response.json({ error: "Not signed in" }, { status: 401 });
  const c = cloudinaryConfig();
  if (!c) return Response.json({ mode: "local" });
  const params = { folder: "brickbaaz", timestamp: Math.floor(Date.now() / 1000) };
  return Response.json({
    mode: "cloudinary",
    cloud: c.cloud,
    apiKey: c.key,
    folder: params.folder,
    timestamp: params.timestamp,
    signature: signCloudinary(params),
  });
}
