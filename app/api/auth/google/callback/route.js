import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { normalizeEmail } from "@/lib/password";
import { publicOrigin } from "@/lib/origin";

const fail = (request, code) => NextResponse.redirect(new URL(`/login?error=${code}`, publicOrigin(request)));

export async function GET(request) {
  const sp = request.nextUrl.searchParams;
  const origin = publicOrigin(request);
  const [state, next = "/"] = (request.cookies.get("g_state")?.value ?? "").split("|");
  if (sp.get("error") || !sp.get("code") || !state || state !== sp.get("state")) return fail(request, "google");

  // Exchange the code directly with Google over TLS; the returned id_token is trusted per Google's docs.
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: sp.get("code"),
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${origin}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return fail(request, "google");
  const { id_token } = await tokenRes.json();
  let claims;
  try {
    claims = JSON.parse(Buffer.from(id_token.split(".")[1], "base64url").toString());
  } catch {
    return fail(request, "google");
  }
  if (claims.aud !== process.env.GOOGLE_CLIENT_ID || !claims.sub || !claims.email || claims.email_verified !== true) return fail(request, "google");

  const email = normalizeEmail(claims.email);
  if (email === normalizeEmail(process.env.OWNER_EMAIL)) return fail(request, "owner");

  let user = await prisma.user.findUnique({ where: { googleId: claims.sub } });
  if (!user) {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail && byEmail.role !== "BUYER") return fail(request, "owner");
    user = byEmail
      ? await prisma.user.update({ where: { id: byEmail.id }, data: { googleId: claims.sub, emailVerified: true } })
      : await prisma.user.create({ data: { email, googleId: claims.sub, emailVerified: true, name: claims.name || email.split("@")[0], role: "BUYER" } });
  }
  if (user.role !== "BUYER") return fail(request, "owner");

  await createSession("BUYER", user.id);
  const res = NextResponse.redirect(new URL(next.startsWith("/") && !next.startsWith("//") ? next : "/", origin));
  res.cookies.delete({ name: "g_state", path: "/api/auth/google" });
  return res;
}
