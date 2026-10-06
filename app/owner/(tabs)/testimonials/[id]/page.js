import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";
import TestimonialEditor from "@/components/TestimonialEditor";
export default async function Edit({ params }) {
  await requireOwner();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const t = await prisma.testimonial.findUnique({ where: { id } });
  if (!t) notFound();
  return (
    <div className="space-y-5 p-5">
      <h1 className="text-2xl font-bold">Edit testimonial</h1>
      <TestimonialEditor
        initial={{
          id: t.id,
          name: t.name,
          feedback: t.feedback,
          reference: t.reference,
          imageUrl: t.imageUrl,
          videoUrl: t.videoUrl,
          published: t.published,
          sort: t.sort,
        }}
      />
    </div>
  );
}
