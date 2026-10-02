import { getOwner } from "@/lib/auth";
import { saveUpload } from "@/lib/media";

export async function POST(request) {
  if (!(await getOwner())) return Response.json({ error: "Not signed in" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file" }, { status: 400 });
  const res = await saveUpload(file);
  if (res.error) return Response.json(res, { status: 400 });
  return Response.json(res);
}
