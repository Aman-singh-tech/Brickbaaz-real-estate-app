import { prisma } from "@/lib/prisma";
import TestimonialCard from "@/components/TestimonialCard";
export const dynamic = "force-dynamic";
export const metadata = { title: "Customer stories" };
export default async function Testimonials() {
  const items = await prisma.testimonial.findMany({
    where: { published: true },
    orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
  });
  return (
    <div className="space-y-6 p-5 md:p-8">
      <div>
        <p className="text-xs font-bold tracking-widest text-brand">
          CUSTOMER STORIES
        </p>
        <h1 className="mt-3 text-3xl font-extrabold">
          Real people. New beginnings.
        </h1>
        <p className="mt-3 text-sm text-mute">
          Feedback and experiences shared by our customers.
        </p>
      </div>
      {items.length ? (
        <div className="project-grid space-y-4">
          {items.map((t) => (
            <TestimonialCard key={t.id} item={t} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-line bg-white p-8 text-sm text-mute">
          Customer stories will appear here soon.
        </p>
      )}
    </div>
  );
}
