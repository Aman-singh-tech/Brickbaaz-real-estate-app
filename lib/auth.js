import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/session";

const load = (kind, role) =>
  cache(async () => {
    const s = await readSession(kind);
    if (!s) return null;
    const user = await prisma.user.findUnique({ where: { id: s.uid } });
    return user && user.role === role ? user : null;
  });

export const getBuyer = load("BUYER", "BUYER");
export const getOwner = load("OWNER", "OWNER");

export async function requireBuyer(next = "/") {
  const u = await getBuyer();
  if (!u) redirect(`/login?next=${encodeURIComponent(next)}`);
  return u;
}

export async function requireOwner() {
  const u = await getOwner();
  if (!u) redirect("/owner/login");
  return u;
}
