import "dotenv/config";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { chromium, expect } from "@playwright/test";
import { parseCsv } from "../lib/csv-leads.js";

assert.deepEqual(
  parseCsv('name,phone,message\n"A, B",9876543210,"line 1\nline ""2"""')
    .rows[0],
  ["A, B", "9876543210", 'line 1\nline "2"'],
);
assert.throws(() => parseCsv('name,phone\n"bad,123'), /unclosed/);
const schema = `bb_crm_test_${Date.now()}`;
const database = new URL(process.env.DATABASE_URL);
if (!["localhost", "127.0.0.1", "::1"].includes(database.hostname))
  throw Error("Use a local test database only.");
database.searchParams.set("schema", schema);
const db = new PrismaClient({
  datasources: { db: { url: database.toString() } },
});
const secret = crypto.randomBytes(32).toString("hex"),
  url = "http://127.0.0.1:3422";
const env = {
  ...process.env,
  DATABASE_URL: database.toString(),
  SESSION_SECRET: secret,
  OWNER_HOST: "",
  APP_URL: url,
  CLOUDINARY_CLOUD_NAME: "",
  CLOUDINARY_API_KEY: "",
  CLOUDINARY_API_SECRET: "",
  RESEND_API_KEY: "",
  GOOGLE_CLIENT_ID: "",
  GOOGLE_CLIENT_SECRET: "",
};
let server, browser;
const uploads = [];
const errors = [];
async function session(ctx, user, kind) {
  const b = Buffer.from(
    JSON.stringify({ uid: user.id, kind, exp: Date.now() + 3600000 }),
  ).toString("base64url");
  await ctx.addCookies([
    {
      name: kind === "OWNER" ? "bb_owner" : "bb_session",
      value:
        b +
        "." +
        crypto.createHmac("sha256", secret).update(b).digest("base64url"),
      url,
    },
    { name: "city", value: "Gurugram", url },
  ]);
}
async function contact(form, name, phone) {
  await form.locator("[name=name]").fill(name);
  await form.locator("[name=phone]").fill(phone);
  await form.locator("[name=consent]").check();
  await form.getByRole("button", { name: "Send enquiry", exact: true }).click();
}
try {
  const m = spawnSync(
    process.execPath,
    ["node_modules/prisma/build/index.js", "migrate", "deploy"],
    { env, encoding: "utf8" },
  );
  assert.equal(m.status, 0, "Migration failed");
  const owner = await db.user.create({
    data: {
      name: "CRM Test Owner",
      email: "owner@example.test",
      role: "OWNER",
    },
  });
  const buyer = await db.user.create({
    data: {
      name: "Legacy buyer",
      email: "buyer@example.test",
      emailVerified: true,
      role: "BUYER",
      phone: "9876543201",
    },
  });
  const property = await db.property.create({
    data: {
      ownerId: owner.id,
      title: "Builder Floor",
      purpose: "SALE",
      type: "BUILDER_FLOOR",
      city: "Gurgaon",
      locality: "Sector 67A",
      price: 30000000,
      status: "ACTIVE",
      media: { create: { kind: "IMAGE", url: "/hero.jpg" } },
    },
  });
  const project = await db.project.create({
    data: {
      slug: "crm-test-project",
      name: "Test builder project",
      city: "Gurugram",
      locality: "Sector 59",
      possession: "NEW_LAUNCH",
      status: "PUBLISHED",
      builder: { create: { name: "Test Builder" } },
      assets: { create: { kind: "IMAGE", url: "/hero.jpg" } },
      configurations: {
        create: { label: "3 BHK", bedrooms: 3, area: 1800, price: 20000000 },
      },
    },
  });
  const oldInquiry = await db.inquiry.create({
    data: {
      propertyId: property.id,
      userId: buyer.id,
      phone: "9876543201",
      kind: "CALLBACK",
      note: "Original message",
    },
  });
  const oldProject = await db.projectLead.create({
    data: {
      projectId: project.id,
      name: "Legacy project lead",
      phone: "9876543202",
      kind: "ENQUIRY",
      stage: "BOOKED",
      consentAt: new Date(),
      notes: { create: { body: "Original project note" } },
    },
  });
  const sql = await fs.readFile(
    "prisma/migrations/20261006120000_services_crm_testimonials/migration.sql",
    "utf8",
  );
  for (const statement of sql
    .split(
      "-- Preserve legacy enquiries and project leads in the unified CRM.",
    )[1]
    .split(";")
    .filter((x) => x.trim()))
    await db.$executeRawUnsafe(statement);
  assert.equal(await db.inquiry.count(), 1);
  assert.equal(await db.projectLead.count(), 1);
  assert.equal(await db.crmLead.count(), 2);
  assert.equal(
    (await db.crmLead.findUnique({ where: { projectLeadId: oldProject.id } }))
      .stage,
    "CONVERTED",
  );
  assert.equal(await db.crmActivity.count(), 1);
  server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "-p", "3422"],
    { env, stdio: "pipe" },
  );
  for (let i = 0; i < 60; i++) {
    try {
      await fetch(url + "/services");
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  browser = await chromium.launch();
  const guest = await browser.newContext({
      viewport: { width: 390, height: 844 },
      timezoneId: "Asia/Kolkata",
    }),
    admin = await browser.newContext({
      viewport: { width: 1440, height: 950 },
      timezoneId: "Asia/Kolkata",
    });
  await session(admin, owner, "OWNER");
  const p = await guest.newPage(),
    a = await admin.newPage();
  for (const page of [p, a])
    page.on("pageerror", (e) => errors.push(e.message));
  await p.goto(
    url + `/property/${property.id}?utm_source=facebook&utm_campaign=launch`,
    { waitUntil: "networkidle" },
  );
  const interest = p
    .locator("form")
    .filter({
      has: p.getByRole("button", { name: "Send enquiry", exact: true }),
    });
  await expect(interest.locator("[name=message]")).toHaveValue(
    'Hi, I\'m interested in "Builder Floor" on Brickbaaz.',
  );
  await contact(interest, "Guest buyer", "9876543210");
  await expect(p.getByRole("status")).toContainText(
    "enquiry has been received",
  );
  const lead = await db.crmLead.findFirst({ where: { phone: "9876543210" } });
  assert.equal(lead.type, "PROPERTY");
  assert.equal(lead.source, "facebook");
  assert.equal(lead.campaign, "launch");
  assert.ok(lead.consentAt);
  await p.goto(url + "/services?loan=Business%20Loan");
  const loans = p.locator("form");
  await expect(loans.locator("[name=loan]")).toHaveValue("Business Loan");
  await loans.locator("[name=amount]").fill("500000");
  await contact(loans, "Loan applicant", "9876543211");
  await expect(p.getByRole("status")).toBeVisible();
  assert.equal(
    Number(
      (await db.crmLead.findFirst({ where: { phone: "9876543211" } })).amount,
    ),
    500000,
  );
  await p.goto(url + "/projects/crm-test-project");
  const projectForm = p
    .locator("form")
    .filter({
      has: p.getByRole("button", { name: "Send enquiry", exact: true }),
    });
  await contact(projectForm, "Project buyer", "9876543212");
  await expect(p.getByRole("status")).toBeVisible();
  assert.equal(
    (await db.crmLead.findFirst({ where: { phone: "9876543212" } })).projectId,
    project.id,
  );
  await p.reload();
  const visit = p
    .locator("form")
    .filter({
      has: p.getByRole("button", { name: "Send request", exact: true }),
    });
  await visit.locator("[name=name]").fill("Visit buyer");
  await visit.locator("[name=phone]").fill("9876543213");
  await visit.locator("[name=kind]").selectOption("VISIT");
  await visit.locator("[name=visitAt]").fill("2027-01-10T11:00");
  await visit.locator("[name=consent]").check();
  await visit.getByRole("button", { name: "Send request" }).click();
  await expect(p.getByText("Request received", { exact: true })).toBeVisible();
  assert.ok(
    (await db.crmLead.findFirst({ where: { phone: "9876543213" } }))
      .projectLeadId,
  );
  await a.goto(url + `/owner/crm/${lead.id}`);
  await a.locator("[name=stage]").selectOption("FOLLOW_UP");
  await a.locator("[name=followUpAt]").fill("2027-01-10T10:30");
  await a.locator("[name=note]").fill("Customer wants a Sunday visit.");
  await a.getByRole("button", { name: "Save follow-up" }).click();
  await expect(a.getByRole("status")).toContainText("updated");
  await expect
    .poll(
      async () =>
        (await db.crmLead.findUnique({ where: { id: lead.id } })).stage,
    )
    .toBe("FOLLOW_UP");
  assert.equal(
    (
      await db.crmLead.findUnique({ where: { id: lead.id } })
    ).followUpAt.toISOString(),
    "2027-01-10T05:00:00.000Z",
  );
  await a.reload();
  await expect(a.locator("[name=followUpAt]")).toHaveValue("2027-01-10T10:30");
  await expect(
    a.getByText("Customer wants a Sunday visit.", { exact: true }),
  ).toBeVisible();
  assert.match(
    await a
      .getByRole("link", { name: "WhatsApp", exact: true })
      .getAttribute("href"),
    /wa.me\/919876543210/,
  );
  await db.crmLead.update({
    where: { id: lead.id },
    data: { followUpAt: new Date(Date.now() - 3600000) },
  });
  await a.goto(url + "/owner/crm?due=overdue");
  await expect(a.getByText("Guest buyer", { exact: true })).toBeVisible();
  await a.goto(url + "/owner/crm?view=board");
  await expect(
    a.getByText("Board shows this page", { exact: false }),
  ).toBeVisible();
  await a.goto(url + "/owner/crm/import");
  const csv =
    'full_name,phone_number,email,ad_name,message\n"CSV, Customer",+919876543214,csv@example.test,Builder Floor,"First line\nSecond line"\nDuplicate,9876543210,,Builder Floor,Already exists\nInvalid,123,,Loan,Invalid phone\nRepeated,9876543214,,Loan,Within file\n';
  await a
    .locator("input[type=file]")
    .setInputFiles({
      name: "meta.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv),
    });
  await a.getByRole("button", { name: "Preview import" }).click();
  await expect(a.getByText("1 ready · 3 skipped · 4 total rows")).toBeVisible();
  await a.getByRole("checkbox").check();
  await a.getByRole("button", { name: "Confirm import" }).click();
  await expect(a.getByRole("status")).toContainText(
    "Imported 1 leads. Skipped 3",
  );
  const imported = await db.crmLead.findFirst({
    where: { phone: "9876543214" },
  });
  assert.equal(imported.name, "CSV, Customer");
  assert.equal(imported.message, "First line\nSecond line");
  assert.equal(imported.consentAt, null);
  await a.getByRole("button", { name: "Preview import" }).click();
  await expect(a.getByText("0 ready · 4 skipped · 4 total rows")).toBeVisible();
  await a.goto(url + "/owner/testimonials/new");
  await a.getByLabel("Customer name", { exact: true }).fill("Happy customer");
  await a
    .getByLabel("Feedback", { exact: true })
    .fill("A smooth property experience.");
  const imageResponse = a.waitForResponse(
    (r) =>
      r.url().endsWith("/api/owner/upload") && r.request().method() === "POST",
  );
  await a
    .locator("input[type=file]")
    .nth(0)
    .setInputFiles({
      name: "feedback.jpg",
      mimeType: "image/jpeg",
      buffer: await fs.readFile("public/hero.jpg"),
    });
  const imageJson = await (await imageResponse).json();
  uploads.push(imageJson.url.split("/").at(-1));
  await expect(a.getByAltText("Feedback preview")).toBeVisible();
  const videoBytes = await a.evaluate(async () => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 64;
    const stream = c.captureStream(10),
      recorder = new MediaRecorder(stream, { mimeType: "video/webm" }),
      chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    const done = new Promise((resolve) => (recorder.onstop = resolve));
    recorder.start();
    c.getContext("2d").fillRect(0, 0, 64, 64);
    await new Promise((r) => setTimeout(r, 400));
    recorder.stop();
    await done;
    stream.getTracks().forEach((t) => t.stop());
    return Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer()));
  });
  const videoResponse = a.waitForResponse(
    (r) =>
      r.url().endsWith("/api/owner/upload") && r.request().method() === "POST",
  );
  await a
    .locator("input[type=file]")
    .nth(1)
    .setInputFiles({
      name: "testimonial.webm",
      mimeType: "video/webm",
      buffer: Buffer.from(videoBytes),
    });
  const videoJson = await (await videoResponse).json();
  uploads.push(videoJson.url.split("/").at(-1));
  await expect(
    a.getByRole("button", { name: "Save testimonial" }),
  ).toBeEnabled();
  await a.getByRole("button", { name: "Save testimonial" }).click();
  await expect(a).toHaveURL(url + "/owner/testimonials");
  const story = await db.testimonial.findFirst();
  assert.equal(story.published, false);
  await p.goto(url + "/testimonials");
  await expect(p.getByText("Happy customer", { exact: true })).toHaveCount(0);
  await a.goto(url + `/owner/testimonials/${story.id}`);
  await a.getByRole("checkbox").check();
  await a.getByRole("button", { name: "Save testimonial" }).click();
  await expect(a).toHaveURL(url + "/owner/testimonials");
  await p.reload();
  await expect(p.getByText("Happy customer", { exact: true })).toBeVisible();
  await expect(p.locator("video")).toHaveAttribute("src", videoJson.url);
  await p.context().addCookies([{ name: "city", value: "Gurugram", url }]);
  await p.goto(url + "/");
  await expect(p.getByText("Happy customer", { exact: true })).toBeVisible();
  await a.goto(url + `/owner/testimonials/${story.id}`);
  await a.getByRole("checkbox").uncheck();
  await a.getByRole("button", { name: "Save testimonial" }).click();
  await expect(a).toHaveURL(url + "/owner/testimonials");
  await p.goto(url + "/testimonials");
  await expect(p.getByText("Happy customer", { exact: true })).toHaveCount(0);
  // Authenticated legacy property enquiry also reaches unified CRM.
  await session(guest, buyer, "BUYER");
  await p.goto(url + `/property/${property.id}`);
  await p.getByRole("button", { name: "Request Visit" }).click();
  await p.getByRole("tab", { name: "Callback", exact: true }).click();
  await p
    .getByRole("button", { name: "Request callback", exact: true })
    .click();
  await expect(
    p.getByRole("link", { name: "Open conversation" }),
  ).toBeVisible();
  assert.equal(
    await db.crmLead.count({ where: { inquiryId: { not: null } } }),
    2,
  );
  assert.ok(await db.inquiry.findUnique({ where: { id: oldInquiry.id } }));
  const anon = await browser.newContext();
  const anonPage = await anon.newPage();
  await anonPage.goto(url + "/owner/crm");
  assert.ok(anonPage.url().endsWith("/owner/login"));
  assert.equal(
    (await anon.request.post(url + "/api/owner/upload-sign")).status(),
    401,
  );
  await fs.mkdir(".tmp-projects", { recursive: true });
  for (const width of [375, 1440]) {
    await a.setViewportSize({ width, height: 900 });
    for (const path of [
      "/owner/crm",
      "/owner/crm?view=board",
      "/owner/crm/import",
      "/owner/testimonials",
      "/services",
    ]) {
      await a.goto(url + path, { waitUntil: "domcontentloaded" });
      await expect(a.locator('h1').first()).toBeVisible();
      assert.equal(
        await a.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        `Overflow ${path} ${width}`,
      );
    }
    await a.goto(url + "/owner/crm?view=board");
    await a.screenshot({ path: `.tmp-projects/crm-board-${width}.png` });
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS: backfill preservation, guest property/project/loan enquiries, legacy mirrors, IST follow-up, due board, CSV mapping/duplicates, image/video upload, publish/unpublish, auth, responsive views.",
  );
} finally {
  await browser?.close();
  server?.kill();
  for (const name of uploads)
    if (/^[\w-]+\.\w+$/.test(name))
      await fs.unlink("uploads/" + name).catch(() => {});
  if (/^bb_crm_test_\d+$/.test(schema))
    await db.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
  await db.$disconnect();
}
