import "server-only";
import { prisma } from "@/lib/prisma";
import { cityWhere } from "@/lib/city";
export const projectInclude = {
  builder: true,
  configurations: { orderBy: { area: "asc" } },
  assets: { orderBy: { sort: "asc" } },
};
export const priceOf = (p) => {
  const a = p.configurations
    .filter((c) => c.price != null)
    .map((c) => Number(c.price));
  return a.length ? Math.min(...a) : null;
};
export function projectWhere(sp = {}) {
  const and = [{ status: "PUBLISHED" }];
  if (sp.city) and.push(cityWhere(String(sp.city)));
  if (sp.q)
    and.push({
      OR: [
        { name: { contains: String(sp.q), mode: "insensitive" } },
        { locality: { contains: String(sp.q), mode: "insensitive" } },
        { builder: { name: { contains: String(sp.q), mode: "insensitive" } } },
      ],
    });
  if (sp.possession) and.push({ possession: String(sp.possession) });
  const conf = {};
  if (sp.bhk && Number.isInteger(Number(sp.bhk)) && Number(sp.bhk) > 0)
    conf.bedrooms = Number(sp.bhk);
  const min = Number(sp.min),
    max = Number(sp.max);
  if (
    (sp.min && Number.isFinite(min) && min >= 0) ||
    (sp.max && Number.isFinite(max) && max >= 0)
  )
    conf.price = {
      ...(sp.min && Number.isFinite(min) && min >= 0 ? { gte: min } : {}),
      ...(sp.max && Number.isFinite(max) && max >= 0 ? { lte: max } : {}),
    };
  if (Object.keys(conf).length) and.push({ configurations: { some: conf } });
  return { AND: and };
}
export async function projectCities() {
  return (
    await prisma.project.findMany({
      where: { status: "PUBLISHED" },
      distinct: ["city"],
      select: { city: true },
      orderBy: { city: "asc" },
    })
  ).map((p) => p.city);
}
