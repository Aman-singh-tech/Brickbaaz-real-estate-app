import "dotenv/config";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { chromium, expect } from "@playwright/test";

const schema = `bb_home_test_${Date.now()}`;
const database = new URL(process.env.DATABASE_URL);
if (!["localhost", "127.0.0.1", "::1"].includes(database.hostname))
  throw Error("Use a local test database only.");
database.searchParams.set("schema", schema);
const db = new PrismaClient({
  datasources: { db: { url: database.toString() } },
});
const url = "http://127.0.0.1:3424";
const env = {
  ...process.env,
  DATABASE_URL: database.toString(),
  APP_URL: url,
  OWNER_HOST: "",
  SUPPORT_PHONE: "+91 9876543200",
  SUPPORT_WHATSAPP: "919876543200",
  SUPPORT_EMAIL: "support@example.test",
  BRICKBAAZ_OFFICE_ADDRESS: "Test office, Gurugram",
  BRICKBAAZ_WORKING_HOURS: "Mon–Sat, 10am–6pm",
  BRICKBAAZ_ABOUT: "A local test introduction for Brickbaaz.",
  RESEND_API_KEY: "",
  GOOGLE_CLIENT_ID: "",
  GOOGLE_CLIENT_SECRET: "",
};
let server, browser;
const errors = [];
try {
  const m = spawnSync(
    process.execPath,
    ["node_modules/prisma/build/index.js", "migrate", "deploy"],
    { env, encoding: "utf8" },
  );
  assert.equal(m.status, 0, "Migration failed");
  const owner = await db.user.create({
    data: { name: "Test desk", role: "OWNER", email: "desk@example.test" },
  });
  const base = {
    ownerId: owner.id,
    purpose: "SALE",
    type: "BUILDER_FLOOR",
    city: "Gurgaon",
    locality: "Sector 67",
    price: 15000000,
    bedrooms: 3,
    superArea: 1500,
    amenities: [],
    status: "ACTIVE",
  };
  await db.property.create({
    data: {
      ...base,
      title: "Homepage featured home",
      featured: true,
      media: { create: { kind: "IMAGE", url: "/hero.jpg?listing=1" } },
    },
  });
  await db.property.create({
    data: { ...base, title: "Private draft", status: "DRAFT" },
  });
  await db.property.create({
    data: { ...base, title: "Other city home", city: "Delhi" },
  });
  await db.project.create({
    data: {
      name: "Homepage builder project",
      slug: "homepage-project",
      status: "PUBLISHED",
      city: "Gurugram",
      locality: "Sector 59",
      possession: "NEW_LAUNCH",
      amenities: [],
      builder: { create: { name: "Test builder" } },
      configurations: {
        create: { label: "3 BHK", bedrooms: 3, area: 1800, price: 20000000 },
      },
      assets: { create: { kind: "IMAGE", url: "/hero.jpg" } },
    },
  });
  const story = await db.testimonial.create({
    data: {
      name: "Published customer",
      feedback: "A helpful property conversation.",
      published: true,
      imageUrl: "/hero.jpg",
      videoUrl: "/test-story.webm",
    },
  });
  await db.testimonial.create({
    data: { name: "Unpublished customer", feedback: "Private feedback" },
  });
  server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "-p", "3424"],
    { env, stdio: "ignore" },
  );
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(url)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  assert.ok(ready, "Server did not become ready");
  browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 960 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url + "/?utm_source=homepage-test&utm_campaign=launch");
  const heroVideo = page.locator('.home-hero video');
  await expect(heroVideo).toBeVisible();
  await expect.poll(() => heroVideo.evaluate(v => v.readyState)).toBeGreaterThan(1);
  assert.equal(await heroVideo.evaluate(v => v.muted && v.loop && v.playsInline), true);
  await page.getByRole('button', { name: 'Pause promotional video' }).click();
  await expect(page.getByRole('button', { name: 'Play promotional video' })).toBeVisible();
  assert.equal(await heroVideo.evaluate(v => v.paused), true);
  await page.getByRole('button', { name: 'Play promotional video' }).click();
  await expect.poll(() => heroVideo.evaluate(v => v.paused)).toBe(false);
  console.log(await heroVideo.evaluate(v => ({ duration: v.duration, width: v.videoWidth, height: v.videoHeight })));
  for (const id of [
    "about",
    "properties",
    "projects",
    "our-services",
    "how-it-works",
    "experiences",
    "contact",
  ])
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  await expect(
    page.getByText("Homepage featured home", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Homepage builder project", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Published customer", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Private draft", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Other city home", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByText("Unpublished customer", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator("#experiences video")).toHaveAttribute(
    "preload",
    "none",
  );
  await expect(page.locator("#experiences video")).not.toHaveAttribute(
    "autoplay",
    "",
  );
  await expect(
    page.getByText(env.BRICKBAAZ_ABOUT, { exact: true }),
  ).toBeVisible();
  await expect(page.locator('#contact a[href^="tel:"]')).toHaveAttribute(
    "href",
    "tel:+919876543200",
  );
  await expect(
    page.locator('#contact a[href^="https://wa.me/"]'),
  ).toHaveAttribute("href", /wa.me\/919876543200/);
  await expect(
    page.getByText(env.BRICKBAAZ_OFFICE_ADDRESS, { exact: true }),
  ).toBeVisible();
  const form = page.locator("#contact form");
  await form.locator('[name="name"]').fill("Homepage guest");
  await form.locator('[name="phone"]').fill("9876543288");
  await form
    .locator('[name="message"]')
    .fill("Please help me find a builder floor.");
  // Browser validation blocks submission without contact consent.
  await form.getByRole("button", { name: "Send enquiry", exact: true }).click();
  assert.equal(await db.crmLead.count(), 0);
  await form.locator('[name="consent"]').check();
  await form.getByRole("button", { name: "Send enquiry", exact: true }).click();
  await expect(page.locator('#contact [role="status"]')).toBeVisible();
  const lead = await db.crmLead.findFirst();
  assert.equal(lead.type, "OTHER");
  assert.equal(lead.interest, "Property assistance");
  assert.equal(lead.source, "homepage-test");
  assert.equal(lead.campaign, "launch");
  assert.ok(lead.consentAt);
  assert.equal(lead.message, "Please help me find a builder floor.");
  assert.equal(
    await db.notification.count({
      where: { userId: owner.id, href: `/owner/crm/${lead.id}` },
    }),
    1,
  );
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await page
    .getByRole("navigation", { name: "Homepage sections" })
    .getByRole("link", { name: "Our services", exact: true })
    .click();
  await expect(page).toHaveURL(/#our-services$/);
  await expect
    .poll(() =>
      page
        .locator("#our-services")
        .evaluate((el) => Math.round(el.getBoundingClientRect().top)),
    )
    .toBeGreaterThan(50);
  await expect
    .poll(() =>
      page
        .locator("#our-services")
        .evaluate((el) => Math.round(el.getBoundingClientRect().top)),
    )
    .toBeLessThan(190);
  await expect(page.getByRole("button", { name: "Back to top" })).toBeVisible();
  await page.getByRole("button", { name: "Back to top" }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5);
  await fs.mkdir(".tmp-projects", { recursive: true });
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto(url);
    for (const id of [
      "about",
      "properties",
      "projects",
      "our-services",
      "how-it-works",
      "experiences",
      "contact",
    ]) {
      await page.locator("#" + id).scrollIntoViewIfNeeded();
      await expect(page.locator("#" + id)).toBeVisible();
    }
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `Page overflow at ${width}`,
    );
    await page.evaluate(async () => {
      await Promise.all(
        document.getAnimations().map((a) => a.finished.catch(() => {})),
      );
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    await page.screenshot({
      path: `.tmp-projects/homepage-${width}.png`,
      fullPage: true,
    });
  }
  const reduced = await browser.newContext({ reducedMotion: "reduce" });
  const rp = await reduced.newPage();
  await rp.goto(url);
  assert.equal(await rp.locator('.home-hero video').evaluate(v => v.paused), true);
  await rp.locator("#contact").scrollIntoViewIfNeeded();
  assert.equal(
    await rp.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
    "auto",
  );
  assert.equal(await rp.evaluate(() => document.getAnimations().length), 0);
  await db.testimonial.update({
    where: { id: story.id },
    data: { published: false },
  });
  await rp.reload();
  await expect(rp.getByText("Published customer", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    rp.getByText("Your experience matters.", { exact: true }),
  ).toBeVisible();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: homepage sections, live inventory/city/draft visibility, published stories/video, configurable contact, consent-to-CRM/notification/UTM, section anchors/back-to-top, responsive layouts and reduced motion.",
  );
} finally {
  await browser?.close();
  server?.kill();
  if (/^bb_home_test_\d+$/.test(schema))
    await db.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
  await db.$disconnect();
}
