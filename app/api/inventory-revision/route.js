import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export async function GET() {
  const result = await prisma.property.aggregate({
    _count: true,
    _max: { updatedAt: true },
  });
  return Response.json(
    {
      revision: `${result._count}:${result._max.updatedAt?.toISOString() || ""}`,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
