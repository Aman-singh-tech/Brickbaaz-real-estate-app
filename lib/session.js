import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

// Two independent sessions: customers use `bb_session`, the owner app uses `bb_owner`.
export const COOKIES = { BUYER: "bb_session", OWNER: "bb_owner" };
const DAYS = { BUYER: 30, OWNER: 7 };

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set (32+ chars)");
  return s;
}

const b64 = (buf) => Buffer.from(buf).toString("base64url");
const mac = (data) => crypto.createHmac("sha256", secret()).update(data).digest("base64url");

export function sign(payload) {
  const body = b64(JSON.stringify(payload));
  return `${body}.${mac(body)}`;
}

export function verify(token) {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = mac(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(kind, userId) {
  const maxAge = DAYS[kind] * 24 * 60 * 60;
  const token = sign({ uid: userId, kind, exp: Date.now() + maxAge * 1000 });
  (await cookies()).set(COOKIES[kind], token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function destroySession(kind) {
  (await cookies()).delete(COOKIES[kind]);
}

export async function readSession(kind) {
  const token = (await cookies()).get(COOKIES[kind])?.value;
  const p = verify(token);
  return p && p.kind === kind ? p : null;
}
