import "server-only";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

const TTL_MIN = 10;
const MAX_ATTEMPTS = 5;
const hash = (phone, code) =>
  crypto.createHmac("sha256", process.env.SESSION_SECRET).update(`${phone}:${code}`).digest("hex");

export const normalizePhone = (v) => {
  const d = String(v ?? "").replace(/\D/g, "");
  const ten = d.length > 10 ? d.slice(-10) : d;
  return /^[6-9]\d{9}$/.test(ten) ? ten : null;
};

// Sends the OTP via the configured gateway. Without one, the code is logged and (outside production)
// returned so the UI can display it. Plug MSG91/Twilio in here.
async function deliver(phone, code) {
  if (process.env.OTP_PROVIDER === "msg91" && process.env.MSG91_AUTH_KEY) {
    const res = await fetch("https://control.msg91.com/api/v5/otp", {
      method: "POST",
      headers: { authkey: process.env.MSG91_AUTH_KEY, "content-type": "application/json" },
      body: JSON.stringify({
        template_id: process.env.MSG91_TEMPLATE_ID,
        mobile: `91${phone}`,
        otp: code,
      }),
    });
    if (!res.ok) throw new Error("SMS gateway failed");
    return null;
  }
  console.log(`[otp] ${phone} -> ${code}`);
  return process.env.NODE_ENV === "production" ? null : code;
}

export async function issueOtp(phone) {
  const recent = await prisma.otp.count({
    where: { phone, createdAt: { gt: new Date(Date.now() - 60_000) } },
  });
  if (recent >= 1) return { error: "Please wait a minute before requesting another code." };
  const code = String(crypto.randomInt(100000, 1000000));
  await prisma.otp.deleteMany({ where: { phone } });
  await prisma.otp.create({
    data: { phone, codeHash: hash(phone, code), expiresAt: new Date(Date.now() + TTL_MIN * 60_000) },
  });
  const devCode = await deliver(phone, code);
  return { ok: true, devCode };
}

export async function checkOtp(phone, code) {
  const rec = await prisma.otp.findFirst({ where: { phone }, orderBy: { createdAt: "desc" } });
  if (!rec || rec.expiresAt < new Date()) return { error: "Code expired. Request a new one." };
  if (rec.attempts >= MAX_ATTEMPTS) return { error: "Too many attempts. Request a new code." };
  const a = Buffer.from(rec.codeHash);
  const b = Buffer.from(hash(phone, String(code).trim()));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    await prisma.otp.update({ where: { id: rec.id }, data: { attempts: { increment: 1 } } });
    return { error: "Wrong code. Try again." };
  }
  await prisma.otp.deleteMany({ where: { phone } });
  return { ok: true };
}
