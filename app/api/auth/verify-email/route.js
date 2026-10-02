import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consumeToken } from "@/lib/email";
import { createSession } from "@/lib/session";
import { publicOrigin } from "@/lib/origin";

export async function GET(request) {
  const userId = await consumeToken(request.nextUrl.searchParams.get("token"), "VERIFY");
  if (!userId) return NextResponse.redirect(new URL("/verify-email?error=1", publicOrigin(request)));
  const user = await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });
  if (user.role === "BUYER") await createSession("BUYER", user.id);
  return NextResponse.redirect(new URL("/verify-email?done=1", publicOrigin(request)));
}
