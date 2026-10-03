export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { projectInclude, priceOf } from "@/lib/projects";
import { Card, inputCls, btn } from "@/components/ui";
import { formatInr } from "@/lib/format";
import Link from "next/link";
export default async function Compare({ searchParams }) {
  const sp = await searchParams,
    options = await prisma.project.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, name: true, city: true },
      orderBy: { name: "asc" },
    }),
    ids = [sp.a, sp.b, sp.c]
      .map(Number)
      .filter(Number.isInteger)
      .filter((n) => n > 0),
    items = ids.length
      ? await prisma.project.findMany({
          where: { id: { in: ids }, status: "PUBLISHED" },
          include: projectInclude,
        })
      : [];
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">Compare projects</h1>
      <form className="space-y-3">
        {["a", "b", "c"].map((k, i) => (
          <select
            key={k}
            name={k}
            defaultValue={sp[k] || ""}
            aria-label={`Project ${i + 1}`}
            className={inputCls}
          >
            <option value="">Select project {i + 1}</option>
            {options.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.city}
              </option>
            ))}
          </select>
        ))}
        <button className={btn("primary")}>Compare</button>
      </form>
      {items.length < 2 ? (
        <Card>Select at least two different projects.</Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left">Feature</th>
                {items.map((p) => (
                  <th key={p.id} className="min-w-40 p-2 text-left">
                    <Link href={`/projects/${p.slug}`} className="underline">
                      {p.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Builder", (p) => p.builder.name],
                ["Location", (p) => `${p.locality}, ${p.city}`],
                [
                  "Starting price",
                  (p) => (priceOf(p) ? formatInr(priceOf(p)) : "On request"),
                ],
                [
                  "Configurations",
                  (p) =>
                    p.configurations
                      .map((c) => `${c.label}: ${c.area} sq.ft`)
                      .join("; "),
                ],
                [
                  "Possession",
                  (p) =>
                    `${p.possession.replaceAll("_", " ")} ${p.possessionDate || ""}`,
                ],
                ["RERA", (p) => p.reraId || "Not provided"],
                ["Amenities", (p) => p.amenities.join(", ")],
              ].map(([l, fn]) => (
                <tr key={l} className="border-t border-line">
                  <th className="p-2 text-left">{l}</th>
                  {items.map((p) => (
                    <td key={p.id} className="p-2 align-top">
                      {fn(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
