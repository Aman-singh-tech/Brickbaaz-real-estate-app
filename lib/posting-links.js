import "server-only";
import { prisma } from "@/lib/prisma";

export async function postingLink(token) {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) return null;
  return prisma.postingLink.findFirst({
    where: { token, active: true, usedAt: null, owner: { role: "OWNER" } },
  });
}
