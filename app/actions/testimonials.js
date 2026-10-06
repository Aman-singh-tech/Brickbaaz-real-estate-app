"use server";
import { prisma } from "@/lib/prisma";
import { getOwner } from "@/lib/auth";
import { isMediaUrl } from "@/lib/media";
import { revalidatePath } from "next/cache";
function refresh() {
  for (const p of ["/", "/testimonials", "/owner/testimonials"])
    revalidatePath(p);
}
export async function saveTestimonial(id, d) {
  if (!(await getOwner())) return { error: "Please sign in." };
  const name = String(d.name || "")
      .trim()
      .slice(0, 80),
    feedback = String(d.feedback || "")
      .trim()
      .slice(0, 3000),
    sort = Number(d.sort);
  if (!name || !feedback || !Number.isInteger(sort) || Math.abs(sort) > 10000)
    return { error: "Name, feedback and valid display order are required." };
  if ([d.imageUrl, d.videoUrl].some((u) => u && !isMediaUrl(u)))
    return { error: "Upload media through Brickbaaz." };
  const data = {
    name,
    feedback,
    sort,
    reference:
      String(d.reference || "")
        .trim()
        .slice(0, 200) || null,
    imageUrl: d.imageUrl || null,
    videoUrl: d.videoUrl || null,
    published: d.published === true,
  };
  if (id) await prisma.testimonial.update({ where: { id: Number(id) }, data });
  else await prisma.testimonial.create({ data });
  refresh();
  return { ok: true };
}
