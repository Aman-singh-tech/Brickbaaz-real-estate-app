import "dotenv/config";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { chromium, expect } from "@playwright/test";

// An isolated schema: never seed, reset or delete data in the app's normal schema.
const schema = `bb_e2e_${Date.now()}`;
const base = new URL(process.env.DATABASE_URL);
base.searchParams.set("schema", schema);
const secret = crypto.randomBytes(32).toString("hex"),
  url = "http://127.0.0.1:3417";
const env = {
  ...process.env,
  DATABASE_URL: base.toString(),
  SESSION_SECRET: secret,
  OWNER_HOST: "",
  APP_URL: url,
  OWNER_EMAIL: "test-owner@example.test",
  OWNER_PASSWORD: "test-owner-password",
  OWNER_NAME: "Test owner",
  CLOUDINARY_CLOUD_NAME: "",
  CLOUDINARY_API_KEY: "",
  CLOUDINARY_API_SECRET: "",
  RESEND_API_KEY: "",
  GOOGLE_CLIENT_ID: "",
  GOOGLE_CLIENT_SECRET: "",
  NODE_ENV: "production",
};
const db = new PrismaClient({ datasources: { db: { url: base.toString() } } });
let server,
  browser,
  log = "";
const artifacts = path.resolve(".tmp-projects");
function token(uid, kind) {
  const b = Buffer.from(
    JSON.stringify({ uid, kind, exp: Date.now() + 3600000 }),
  ).toString("base64url");
  return (
    b + "." + crypto.createHmac("sha256", secret).update(b).digest("base64url")
  );
}
async function cookie(context, uid, kind) {
  await context.addCookies([
    {
      name: kind === "OWNER" ? "bb_owner" : "bb_session",
      value: token(uid, kind),
      url,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}
try {
  await fs.mkdir(artifacts, { recursive: true });
  const migration = spawnSync(
    process.execPath,
    ["node_modules/prisma/build/index.js", "migrate", "deploy"],
    { env, encoding: "utf8" },
  );
  if (migration.status !== 0)
    throw Error("Isolated migration failed: " + migration.stderr);
  server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "-p",
      "3417",
      "-H",
      "127.0.0.1",
    ],
    { env, stdio: ["ignore", "pipe", "pipe"] },
  );
  server.stdout.on("data", (b) => (log += b));
  server.stderr.on("data", (b) => (log += b));
  for (let n = 0; n < 60; n++) {
    try {
      if ((await fetch(url + "/welcome")).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  browser = await chromium.launch({ headless: true });
  const adminContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    timezoneId: "Asia/Kolkata",
  });
  const customerContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    timezoneId: "Asia/Kolkata",
  });
  const admin = await adminContext.newPage(),
    customer = await customerContext.newPage();
  const errors = [];
  for (const page of [admin, customer])
    page.on("pageerror", (e) => errors.push(e.message));
  await admin.goto(url + "/owner/login");
  await admin.locator('input[name="email"]').fill(env.OWNER_EMAIL);
  await admin.locator('input[name="password"]').fill(env.OWNER_PASSWORD);
  await admin.getByRole("button", { name: "Sign in", exact: true }).click();
  await admin.waitForURL("**/owner/dashboard");
  console.log("PASS owner email/password login");
  await admin.goto(url + "/owner/projects/new");
  await admin.getByLabel("Project name", { exact: true }).fill("Test Skyline");
  await admin.getByLabel("Builder name").fill("Test Developer");
  await admin.getByLabel("City", { exact: true }).fill("Jaipur");
  await admin.getByLabel("State", { exact: true }).fill("Rajasthan");
  await admin.getByLabel("Locality / sector").fill("Vaishali Nagar");
  await admin.getByLabel("RERA registration number").fill("TEST-RERA");
  await admin.getByLabel("Latitude").fill("26.9124");
  await admin.getByLabel("Longitude").fill("75.7873");
  await admin.getByLabel("Area in sq.ft").fill("1200");
  await admin.getByLabel("Price in INR").fill("7500000");
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
    "base64",
  );
  await admin
    .getByLabel("Photos", { exact: true })
    .setInputFiles({ name: "test.png", mimeType: "image/png", buffer: png });
  await expect(admin.getByAltText("Project photo 1")).toBeVisible();
  await admin
    .getByLabel("Floor plan image")
    .setInputFiles({ name: "plan.png", mimeType: "image/png", buffer: png });
  await expect(admin.getByAltText("2 BHK floor plan")).toBeVisible();
  await admin.getByLabel("Brochure PDF").setInputFiles({
    name: "brochure.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n%%EOF"),
  });
  await expect(admin.getByText("BROCHURE", { exact: true })).toBeVisible();
  await admin
    .getByRole("button", { name: "Save project", exact: true })
    .click();
  await admin.waitForURL("**/owner/projects");
  let project = await db.project.findFirstOrThrow({
    where: { name: "Test Skyline" },
  });
  await customer.goto(url + "/projects");
  await expect(
    customer.getByRole("heading", { name: "Test Skyline" }),
  ).toHaveCount(0);
  assert.equal(await db.property.count(), 0);
  console.log("PASS draft hidden; local photo, floor-plan and PDF uploads");
  await admin.goto(url + `/owner/projects/${project.id}/edit`);
  await admin.getByLabel("Visibility").selectOption("PUBLISHED");
  await admin
    .getByRole("button", { name: "Save project", exact: true })
    .click();
  await admin.waitForURL("**/owner/projects");
  await customer.goto(url + "/projects");
  await expect(
    customer.getByRole("heading", { name: "Test Skyline" }),
  ).toBeVisible();
  await expect(
    customer
      .getByRole("combobox", { name: "City", exact: true })
      .locator('option[value="Jaipur"]'),
  ).toHaveCount(1);
  await customer.goto(url + "/projects?city=Gurugram");
  await expect(
    customer.getByRole("heading", { name: "Test Skyline" }),
  ).toHaveCount(0);
  await customer.goto(url + "/projects?city=Jaipur&bhk=2&max=8000000");
  await expect(
    customer.getByRole("heading", { name: "Test Skyline" }),
  ).toBeVisible();
  await customer.goto(url + "/projects?max=7000000");
  await expect(
    customer.getByRole("heading", { name: "Test Skyline" }),
  ).toHaveCount(0);
  await customer.goto(url + "/projects?view=map&city=Jaipur");
  await expect(customer.locator(".leaflet-marker-icon")).toHaveCount(1);
  console.log("PASS any-city publication, map pin and city/BHK/budget filters");
  await customer.goto(
    url + `/projects/${project.slug}?utm_source=instagram&utm_campaign=pilot`,
  );
  await customer.getByLabel("Your name").fill("Test Customer");
  await customer.getByLabel("Mobile number").fill("9811122233");
  await customer.getByLabel("I agree to be contacted").check();
  await customer.getByRole("button", { name: "Send request" }).click();
  await expect(
    customer.getByRole("heading", { name: "Request received" }),
  ).toBeVisible();
  const lead = await db.projectLead.findFirstOrThrow();
  assert.equal(lead.source, "instagram");
  assert.equal(lead.stage, "NEW");
  assert.ok(lead.consentAt);
  await admin.goto(url + `/owner/leads/${lead.id}`);
  await expect(
    admin.getByRole("heading", { name: "Test Customer", exact: true }),
  ).toBeVisible();
  await admin.getByLabel("Pipeline stage").selectOption("CONTACTED");
  await admin
    .getByLabel("Add a note")
    .fill("Requested floor plan and pricing.");
  await admin.getByLabel("Next follow-up").fill("2030-01-10T10:30");
  await admin.getByRole("button", { name: "Update lead" }).click();
  await expect(admin.getByRole("status")).toHaveText("Lead updated.");
  const updated = await db.projectLead.findUnique({
    where: { id: lead.id },
    include: { notes: true },
  });
  assert.equal(updated.stage, "CONTACTED");
  assert.equal(updated.notes.length, 1);
  assert.equal(updated.followUpAt.toISOString(), "2030-01-10T05:00:00.000Z");
  console.log(
    "PASS guest enquiry -> CRM, campaign, consent, notes and timezone-correct follow-up",
  );
  await customer.goto(url + `/projects/${project.slug}`);
  await customer.locator("h1").waitFor();
  if (
    await customer.getByRole("button", { name: "Send another request" }).count()
  )
    await customer
      .getByRole("button", { name: "Send another request" })
      .click();
  await customer.getByLabel("Request", { exact: true }).selectOption("VISIT");
  await customer.getByLabel("Your name").fill("Visit Customer");
  await customer.getByLabel("Mobile number").fill("9811122244");
  await customer.getByLabel("Preferred date and time").fill("2030-01-11T12:00");
  await customer.getByLabel("Pickup address").fill("Test pickup");
  await customer.getByLabel("I agree to be contacted").check();
  await customer.getByRole("button", { name: "Send request" }).click();
  await expect(
    customer.getByRole("heading", { name: "Request received" }),
  ).toBeVisible();
  const visit = await db.projectLead.findFirstOrThrow({
    where: { kind: "VISIT" },
  });
  assert.equal(visit.stage, "NEW");
  assert.equal(visit.visitAt.toISOString(), "2030-01-11T06:30:00.000Z");
  console.log("PASS visit request keeps pending state and pickup details");
  const buyer = await db.user.create({
    data: { email: "buyer@example.test", emailVerified: true, role: "BUYER" },
  });
  await cookie(customerContext, buyer.id, "BUYER");
  await customer.goto(url + `/projects/${project.slug}`);
  await customer
    .getByRole("button", { name: "Save project", exact: true })
    .click();
  await expect(
    customer.getByRole("button", { name: "Saved project" }),
  ).toBeVisible();
  await customer.goto(url + "/saved");
  await expect(
    customer.getByRole("heading", { name: "Test Skyline" }),
  ).toBeVisible();
  const builder = await db.builder.findFirstOrThrow();
  const second = await db.project.create({
    data: {
      name: "Another Project",
      slug: "another-test",
      builderId: builder.id,
      status: "PUBLISHED",
      city: "Pune",
      locality: "Baner",
      possession: "READY",
      amenities: [],
      configurations: {
        create: { label: "3 BHK", bedrooms: 3, area: 1500, price: 9500000 },
      },
    },
  });
  await customer.goto(url + `/projects/compare?a=${project.id}&b=${second.id}`);
  await expect(customer.getByRole("table")).toBeVisible();
  await expect(
    customer.getByRole("link", { name: "Another Project", exact: true }),
  ).toBeVisible();
  console.log("PASS saved projects and project comparison");
  for (const route of [
    "/projects",
    "/projects/compare",
    "/saved",
    "/search",
    "/owner/projects",
    "/owner/leads",
  ]) {
    const p = route.startsWith("/owner") ? admin : customer;
    await p.goto(url + route);
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `${route} overflows mobile`,
    );
  }
  await customer.goto(url + "/projects");
  await customer.screenshot({
    path: path.join(artifacts, "customer.png"),
    fullPage: true,
  });
  await admin.screenshot({
    path: path.join(artifacts, "admin.png"),
    fullPage: true,
  });
  await admin.goto(url + `/owner/projects/${project.id}/edit`);
  await admin.getByLabel("Visibility").selectOption("ARCHIVED");
  await admin
    .getByRole("button", { name: "Save project", exact: true })
    .click();
  await admin.waitForURL("**/owner/projects");
  const response = await customer.goto(url + `/projects/${project.slug}`);
  assert.equal(response.status(), 404);
  assert.equal(await db.projectLead.count(), 2);
  const owner = await db.user.findFirstOrThrow({ where: { role: "OWNER" } });
  for (const purpose of ["SALE", "RENT"])
    await db.property.create({
      data: {
        ownerId: owner.id,
        title: `Legacy ${purpose} listing`,
        purpose,
        type: "APARTMENT",
        status: "ACTIVE",
        city: "Jaipur",
        locality: "Test locality",
        price: purpose === "SALE" ? 6000000 : 20000,
        amenities: [],
      },
    });
  await customer.goto(url + "/search?city=Jaipur&p=sale");
  await expect(
    customer.getByText("Legacy SALE listing", { exact: true }),
  ).toBeVisible();
  await customer.goto(url + "/search?city=Jaipur&p=rent");
  await expect(
    customer.getByText("Legacy RENT listing", { exact: true }),
  ).toBeVisible();
  console.log(
    "PASS existing Buy and Rent inventory still works alongside Projects",
  );
  const anon = await browser.newContext();
  const check = await anon.newPage();
  await check.goto(url + "/owner/projects");
  assert.ok(check.url().endsWith("/owner/login"));
  const ticket = await anon.request.post(url + "/api/owner/upload-sign");
  assert.equal(ticket.status(), 401);
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log(
    "PASS archive preserves leads, anonymous admin blocked, mobile layout and zero page errors",
  );
} catch (e) {
  console.error(e);
  await fs.writeFile(path.join(artifacts, "server.log"), log);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server) {
    server.kill();
    await new Promise((r) => server.once("exit", r));
  }
  const testFiles = [
    ...(await db.projectAsset.findMany({ select: { url: true } })).map(
      (a) => a.url,
    ),
    ...(await db.configuration.findMany({ select: { floorPlan: true } })).map(
      (c) => c.floorPlan,
    ),
  ].filter(Boolean);
  for (const file of new Set(testFiles)) {
    const match = file.match(
      /^\/api\/media\/([a-zA-Z0-9-]+\.(png|jpg|webp|pdf))$/,
    );
    if (match)
      await fs.unlink(path.resolve("uploads", match[1])).catch(() => {});
  }
  await db.$disconnect();
  if (!/^bb_e2e_\d+$/.test(schema)) throw Error("Invalid cleanup schema");
  const cleanup = new PrismaClient();
  await cleanup.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await cleanup.$disconnect();
}
