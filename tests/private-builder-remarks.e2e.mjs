import "dotenv/config";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { chromium, expect } from "@playwright/test";

const schema = `bb_private_test_${Date.now()}`;
const database = new URL(process.env.DATABASE_URL);
assert.ok(["localhost", "127.0.0.1", "::1"].includes(database.hostname));
database.searchParams.set("schema", schema);
const secret = crypto.randomBytes(32).toString("hex");
const url = "http://127.0.0.1:3428";
const env = { ...process.env, DATABASE_URL: database.toString(), SESSION_SECRET: secret, OWNER_HOST: "", APP_URL: url };
const db = new PrismaClient({ datasources: { db: { url: database.toString() } } });
let server, browser;
async function authenticate(context, user, kind) {
  const body = Buffer.from(JSON.stringify({ uid: user.id, kind, exp: Date.now() + 3600000 })).toString("base64url");
  await context.addCookies([{ name: kind === "OWNER" ? "bb_owner" : "bb_session", value: `${body}.${crypto.createHmac("sha256", secret).update(body).digest("base64url")}`, url }]);
}
try {
  const migration = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], { env, encoding: "utf8" });
  assert.equal(migration.status, 0, migration.stderr);
  const owner = await db.user.create({ data: { role: "OWNER", name: "Desk", email: "private-owner@example.test" } });
  const other = await db.user.create({ data: { role: "OWNER", email: "other-owner@example.test" } });
  const buyer = await db.user.create({ data: { role: "BUYER", email: "buyer@example.test" } });
  const marker = "PRIVATE-BUILDER-9988776655";
  const property = await db.property.create({ data: { ownerId: owner.id, status: "ACTIVE", purpose: "SALE", type: "BUILDER_FLOOR", title: "Public home", city: "Gurugram", locality: "Sector 67", price: 15000000, amenities: [], privateDetails: { create: { remarks: marker } } } });
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3428"], { env, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { if ((await fetch(url)).ok) break; } catch {} await new Promise(r => setTimeout(r, 500)); }
  browser = await chromium.launch();
  const admin = await browser.newContext(); await authenticate(admin, owner, "OWNER");
  const page = await admin.newPage();
  await page.goto(url + "/owner/listings");
  await page.getByText("Private Builder Details / Remarks", { exact: true }).click();
  await expect(page.getByText(marker, { exact: true })).toBeVisible();
  await page.goto(url + `/owner/post?edit=${property.id}`);
  await page.getByRole("button", { name: "Continue to details" }).click();
  const remarks = page.getByLabel("Private Builder Details / Remarks");
  await expect(remarks).toHaveValue(marker);
  await remarks.fill(marker + " updated");
  await page.getByRole("button", { name: "Save as draft", exact: true }).click();
  await expect.poll(async () => (await db.propertyPrivateDetails.findUnique({ where: { propertyId: property.id } }))?.remarks).toBe(marker + " updated");
  const customer = await browser.newContext(); await authenticate(customer, buyer, "BUYER");
  for (const context of [customer, await browser.newContext()]) {
    for (const path of ["/", "/search", `/property/${property.id}`]) {
      const response = await context.request.get(url + path);
      assert.equal(response.status(), 200);
      assert.ok(!(await response.text()).includes(marker), `Private data leaked at ${path}`);
    }
  }
  const stranger = await browser.newContext(); await authenticate(stranger, other, "OWNER");
  const denied = await stranger.request.get(url + `/owner/post?edit=${property.id}`);
  assert.ok(!(await denied.text()).includes(marker));
  await remarks.fill(""); await page.getByRole("button", { name: "Save as draft", exact: true }).click();
  await expect.poll(() => db.propertyPrivateDetails.count({ where: { propertyId: property.id } })).toBe(0);
  console.log("PASS: owner remarks display/edit/save/clear, anonymous and buyer privacy, cross-owner restriction.");
} finally {
  await browser?.close(); server?.kill();
  await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await db.$disconnect();
}
