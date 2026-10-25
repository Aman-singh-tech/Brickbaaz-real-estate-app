import { postingLink } from "@/lib/posting-links";
import { saveUpload } from "@/lib/media";
export async function POST(request, { params }) {
  if (!(await postingLink((await params).token)))
    return Response.json(
      { error: "Posting link is unavailable" },
      { status: 403 },
    );
  if (
    process.env.NODE_ENV === "production" &&
    process.env.CLOUDINARY_CLOUD_NAME
  )
    return Response.json({ error: "Use cloud upload" }, { status: 400 });
  const file = (await request.formData()).get("file");
  if (
    !(file instanceof File) ||
    !/^(image\/(jpeg|png|webp)|video\/(mp4|webm|quicktime))$/.test(file.type)
  )
    return Response.json({ error: "Choose a photo or video" }, { status: 400 });
  const result = await saveUpload(file);
  return Response.json(result, { status: result.error ? 400 : 200 });
}
