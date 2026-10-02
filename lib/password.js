import "server-only";
import crypto from "node:crypto";

const KEYLEN = 64;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEYLEN, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password, stored) {
  if (!stored) return false;
  const [kind, saltHex, hashHex] = stored.split("$");
  if (kind !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), KEYLEN, { N: 16384, r: 8, p: 1 });
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 120;
export const normalizeEmail = (e) => String(e ?? "").trim().toLowerCase();
export const passwordError = (p) =>
  typeof p !== "string" || p.length < 8 ? "Password must be at least 8 characters." : p.length > 100 ? "Password is too long." : null;
