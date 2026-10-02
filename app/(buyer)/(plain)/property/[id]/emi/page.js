import { notFound } from "next/navigation";
import BackBar from "@/components/BackBar";
import EmiCalculator from "@/components/EmiCalculator";
import { getProperty } from "@/lib/properties";

export const metadata = { title: "EMI calculator" };

export default async function EmiPage({ params }) {
  const { id } = await params;
  const p = Number(id) ? await getProperty(Number(id)) : null;
  if (!p || p.purpose !== "SALE") notFound();
  return (
    <>
      <BackBar title="EMI calculator" fallback={`/property/${p.id}`} />
      <EmiCalculator price={p.price} />
    </>
  );
}
