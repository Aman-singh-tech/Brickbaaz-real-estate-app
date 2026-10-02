import "server-only";
import { prisma } from "@/lib/prisma";

export const notify = (userId, title, body, href) =>
  prisma.notification.create({ data: { userId, title, body, href } });
