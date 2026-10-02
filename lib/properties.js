import "server-only";
import { prisma } from "@/lib/prisma";

export const PAGE = 8;

const csv = (v) => (v ? String(v).split(",").map((s) => s.trim()).filter(Boolean) : []);
const TYPES = ["APARTMENT", "VILLA", "BUILDER_FLOOR", "PLOT", "COMMERCIAL"];

export function parseFilters(sp, defaults = {}) {
  const purpose = String(sp.p ?? defaults.p ?? "sale").toLowerCase() === "rent" ? "RENT" : "SALE";
  return {
    purpose,
    city: sp.city ?? defaults.city ?? "",
    q: String(sp.q ?? "").trim(),
    min: sp.min ? Number(sp.min) : null,
    max: sp.max ? Number(sp.max) : null,
    bhk: csv(sp.bhk).map(Number).filter(Boolean),
    types: csv(sp.type).filter((t) => TYPES.includes(t)),
    poss: csv(sp.poss),
    furn: csv(sp.furn),
    sort: sp.sort ?? "new",
    limit: Math.min(Number(sp.limit) || PAGE, 200),
    featured: sp.featured === "1",
  };
}

export function whereFrom(f) {
  const and = [{ status: "ACTIVE", purpose: f.purpose }];
  if (f.city) and.push({ city: f.city });
  if (f.min != null || f.max != null)
    and.push({ price: { ...(f.min != null ? { gte: f.min } : {}), ...(f.max != null ? { lte: f.max } : {}) } });
  if (f.bhk.length) {
    and.push({ OR: [{ bedrooms: { in: f.bhk } }, ...(f.bhk.includes(5) ? [{ bedrooms: { gte: 5 } }] : [])] });
  }
  if (f.types.length) and.push({ type: { in: f.types } });
  if (f.poss.length) and.push({ possession: { in: f.poss } });
  if (f.furn.length) and.push({ furnishing: { in: f.furn } });
  if (f.featured) and.push({ featured: true });
  if (f.q) {
    const m = f.q.match(/(\d)\s*bhk/i);
    const text = f.q.replace(/\d\s*bhk/gi, "").trim();
    if (m) and.push({ bedrooms: Number(m[1]) });
    if (text)
      and.push({
        OR: ["title", "locality", "society", "city"].map((k) => ({ [k]: { contains: text, mode: "insensitive" } })),
      });
  }
  return { AND: and };
}

const ORDER = {
  price_asc: [{ price: "asc" }],
  price_desc: [{ price: "desc" }],
  new: [{ featured: "desc" }, { publishedAt: "desc" }],
};

const cardInclude = { media: { orderBy: { sort: "asc" }, take: 6 } };

export async function searchProperties(f) {
  const where = whereFrom(f);
  const [items, total] = await Promise.all([
    prisma.property.findMany({ where, orderBy: ORDER[f.sort] ?? ORDER.new, take: f.limit, include: cardInclude }),
    prisma.property.count({ where }),
  ]);
  return { items, total };
}

export const featured = (purpose, city, take = 3) =>
  prisma.property.findMany({
    where: { status: "ACTIVE", purpose, ...(city ? { city } : {}) },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    take,
    include: cardInclude,
  });

export const categoryCounts = async (purpose, city) => {
  const rows = await prisma.property.groupBy({
    by: ["type"],
    where: { status: "ACTIVE", purpose, ...(city ? { city } : {}) },
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((r) => [r.type, r._count._all]));
};

export const getProperty = (id) =>
  prisma.property.findUnique({ where: { id }, include: { media: { orderBy: { sort: "asc" } } } });

export const savedIds = async (userId) =>
  userId
    ? new Set((await prisma.saved.findMany({ where: { userId }, select: { propertyId: true } })).map((s) => s.propertyId))
    : new Set();

// Cities that currently have active listings, followed by the default cities that do not.
export async function activeCities(defaults = []) {
  const rows = await prisma.property.groupBy({ by: ["city"], where: { status: "ACTIVE" }, _count: { _all: true } });
  const live = rows.map((r) => r.city).filter(Boolean).sort((a, b) => a.localeCompare(b));
  return [...live, ...defaults.filter((d) => !live.includes(d))];
}
