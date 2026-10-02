import "server-only";
import crypto from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

// ---- sending ----
// Uses Resend (https://resend.com) when RESEND_API_KEY is set. Without it, the message is logged and
// (outside production) the link is returned so the UI can show it.
export async function sendEmail({ to, subject, html, text }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email] to=${to} subject="${subject}"\n${text}`);
    return { sent: false };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || "Brickbaaz <onboarding@resend.dev>", to, subject, html, text }),
  });
  if (!res.ok) throw new Error(`Email provider error ${res.status}`);
  return { sent: true };
}

export async function appOrigin() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${h.get("host")}`;
}

// ---- one-time tokens (stored hashed) ----
const sha = (t) => crypto.createHash("sha256").update(t).digest("hex");

export async function createToken(userId, kind, minutes) {
  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.emailToken.deleteMany({ where: { userId, kind } });
  await prisma.emailToken.create({
    data: { userId, kind, hash: sha(token), expiresAt: new Date(Date.now() + minutes * 60_000) },
  });
  return token;
}

// Returns the userId if the token is valid, and removes it.
export async function consumeToken(token, kind) {
  if (!token) return null;
  const rec = await prisma.emailToken.findUnique({ where: { hash: sha(String(token)) } });
  if (!rec || rec.kind !== kind || rec.expiresAt < new Date()) return null;
  await prisma.emailToken.delete({ where: { id: rec.id } });
  return rec.userId;
}

const wrap = (title, body, link, cta) => `
<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px;color:#0b1426">
  <h2 style="margin:0 0 12px">Brick<span style="color:#e07a1f">baaz</span></h2>
  <h3 style="margin:0 0 8px">${title}</h3>
  <p style="color:#444;line-height:1.5">${body}</p>
  <p><a href="${link}" style="display:inline-block;background:#0b1426;color:#fff;padding:12px 22px;border-radius:12px;text-decoration:none;font-weight:700">${cta}</a></p>
  <p style="color:#888;font-size:12px">If the button does not work, copy this link: ${link}</p>
</div>`;

// Sends the verification email. Returns the link only in dev when no email provider is configured.
export async function sendVerification(user) {
  const link = `${await appOrigin()}/api/auth/verify-email?token=${await createToken(user.id, "VERIFY", 60 * 24)}`;
  const r = await sendEmail({
    to: user.email,
    subject: "Verify your Brickbaaz email",
    html: wrap("Verify your email", "Confirm your email so you can contact owners and book visits.", link, "Verify email"),
    text: `Verify your email: ${link}`,
  });
  return !r.sent && process.env.NODE_ENV !== "production" ? link : null;
}

export async function sendReset(user) {
  const link = `${await appOrigin()}/reset-password?token=${await createToken(user.id, "RESET", 30)}`;
  const r = await sendEmail({
    to: user.email,
    subject: "Reset your Brickbaaz password",
    html: wrap("Reset your password", "Use the button below to choose a new password. The link works for 30 minutes.", link, "Reset password"),
    text: `Reset your password: ${link}`,
  });
  return !r.sent && process.env.NODE_ENV !== "production" ? link : null;
}
