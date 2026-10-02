"use server";

import crypto from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";
import { hashPassword, verifyPassword, validEmail, normalizeEmail, passwordError } from "@/lib/password";
import { sendVerification, sendReset, consumeToken } from "@/lib/email";
import { tooMany } from "@/lib/ratelimit";
import { getBuyer } from "@/lib/auth";

const safeNext = (n, fallback = "/") => (typeof n === "string" && n.startsWith("/") && !n.startsWith("//") ? n : fallback);
const ip = async () => (await headers()).get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
const LOCKED = "Too many attempts. Please try again in a few minutes.";
const ownerEmail = () => normalizeEmail(process.env.OWNER_EMAIL);

// ---------- customer ----------
export async function signUp(_prev, formData) {
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  if (!name) return { error: "Please enter your name." };
  if (!validEmail(email)) return { error: "Enter a valid email address." };
  const pe = passwordError(password);
  if (pe) return { error: pe };
  if (tooMany(`signup:${await ip()}`, 10)) return { error: LOCKED };
  if (email === ownerEmail()) return { error: "This email belongs to the owner account. Use the owner app." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      error: existing.passwordHash
        ? "An account with this email already exists. Log in instead."
        : "This email is registered with Google. Use Continue with Google.",
    };
  }
  const user = await prisma.user.create({ data: { name, email, passwordHash: hashPassword(password), role: "BUYER" } });
  const devLink = await sendVerification(user).catch(() => null);
  await createSession("BUYER", user.id);
  if (devLink) redirect(`/verify-email?dev=${encodeURIComponent(devLink)}&next=${encodeURIComponent(next)}`);
  redirect(`/verify-email?sent=1&next=${encodeURIComponent(next)}`);
}

export async function logIn(_prev, formData) {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  if (tooMany(`login:${email}:${await ip()}`)) return { error: LOCKED };
  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  // same message for unknown email / wrong password / google-only accounts
  if (!user || user.role !== "BUYER" || !verifyPassword(password, user.passwordHash)) {
    return { error: "Wrong email or password." };
  }
  await createSession("BUYER", user.id);
  redirect(next);
}

export async function buyerLogout() {
  await destroySession("BUYER");
  redirect("/");
}

export async function forgotPassword(_prev, formData) {
  const email = normalizeEmail(formData.get("email"));
  if (!validEmail(email)) return { error: "Enter a valid email address." };
  if (tooMany(`forgot:${email}:${await ip()}`, 5)) return { error: LOCKED };
  const user = await prisma.user.findUnique({ where: { email } });
  let devLink = null;
  if (user && user.role === "BUYER" && user.passwordHash) devLink = await sendReset(user).catch(() => null);
  // never reveal whether the email exists
  return { ok: true, devLink };
}

export async function resetPassword(_prev, formData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const pe = passwordError(password);
  if (pe) return { error: pe };
  const userId = await consumeToken(token, "RESET");
  if (!userId) return { error: "This reset link is invalid or has expired. Request a new one." };
  const user = await prisma.user.update({ where: { id: userId }, data: { passwordHash: hashPassword(password), emailVerified: true } });
  await createSession("BUYER", user.id);
  redirect("/");
}

export async function resendVerification() {
  const user = await getBuyer();
  if (!user?.email) return { error: "Please log in." };
  if (user.emailVerified) return { ok: true, already: true };
  if (tooMany(`verify:${user.id}`, 5)) return { error: LOCKED };
  const devLink = await sendVerification(user).catch(() => null);
  return { ok: true, devLink };
}

// ---------- owner ----------
export async function ownerLogin(_prev, formData) {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const expected = process.env.OWNER_PASSWORD ?? "";
  if (tooMany(`owner:${await ip()}`, 6)) return { error: LOCKED };
  // constant-time compare of the configured owner credentials
  const a = crypto.createHash("sha256").update(password).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  const ok = !!expected && !!ownerEmail() && email === ownerEmail() && crypto.timingSafeEqual(a, b);
  if (!ok) return { error: "Wrong email or password." };

  let owner = await prisma.user.findFirst({ where: { role: "OWNER" } });
  if (owner) {
    owner = await prisma.user.update({ where: { id: owner.id }, data: { email, emailVerified: true } });
  } else {
    owner = await prisma.user.create({
      data: { email, emailVerified: true, role: "OWNER", name: process.env.OWNER_NAME || "Owner" },
    });
  }
  await createSession("OWNER", owner.id);
  redirect("/owner/dashboard");
}

export async function ownerLogout() {
  await destroySession("OWNER");
  redirect("/owner/login");
}
