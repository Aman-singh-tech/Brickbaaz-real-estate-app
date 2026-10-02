import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { publicOrigin } from "@/lib/origin";

// Starts Google sign-in. Requires GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (see .env.example).
export async function GET(request) {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id || !process.env.GOOGLE_CLIENT_SECRET) return NextResponse.redirect(new URL("/login?error=google", publicOrigin(request)));

  const origin = publicOrigin(request);
  const next = request.nextUrl.searchParams.get("next") ?? "/";
  const state = crypto.randomBytes(16).toString("base64url");

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: id,
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  }).toString();

  const res = NextResponse.redirect(url);
  res.cookies.set("g_state", `${state}|${next.startsWith("/") && !next.startsWith("//") ? next : "/"}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 600,
  });
  return res;
}
