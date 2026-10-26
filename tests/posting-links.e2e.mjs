import "dotenv/config";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { chromium, expect } from "@playwright/test";
const schema = `bb_invite_test_${Date.now()}`;
const database = new URL(process.env.DATABASE_URL);
assert.ok(
  ["localhost", "127.0.0.1", "::1"].includes(database.hostname),
  "Local test DB required",
);
database.searchParams.set("schema", schema);
const secret = crypto.randomBytes(32).toString("hex"),
  url = "http://127.0.0.1:3430";
const env = {
  ...process.env,
  DATABASE_URL: database.toString(),
  SESSION_SECRET: secret,
  OWNER_HOST: "",
  APP_URL: url,
  CLOUDINARY_CLOUD_NAME: "",
  CLOUDINARY_API_KEY: "",
  CLOUDINARY_API_SECRET: "",
};
const db = new PrismaClient({
  datasources: { db: { url: database.toString() } },
});
let server, browser;
try {
  const migration = spawnSync(
    process.execPath,
    ["node_modules/prisma/build/index.js", "migrate", "deploy"],
    { env, encoding: "utf8" },
  );
  assert.equal(migration.status, 0, migration.stderr);
  const owner = await db.user.create({
    data: { role: "OWNER", email: "invite-owner@example.test" },
  });
  server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "-p", "3430"],
    { env, stdio: "ignore" },
  );
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(url)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  browser = await chromium.launch({
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  });
  const admin = await browser.newContext();
  const body = Buffer.from(
    JSON.stringify({ uid: owner.id, kind: "OWNER", exp: Date.now() + 3600000 }),
  ).toString("base64url");
  await admin.addCookies([
    {
      name: "bb_owner",
      value: `${body}.${crypto.createHmac("sha256", secret).update(body).digest("base64url")}`,
      url,
    },
  ]);
  const page = await admin.newPage();
  await page.goto(url + "/owner/posting-links");
  await page.getByLabel("Link label").fill("Builder invite");
  await page.getByRole("button", { name: "Create posting link" }).click();
  const linkInput = page.getByLabel("Posting link");
  await expect(linkInput).toHaveCount(1);
  const inviteUrl = await linkInput.inputValue();
  const guest = await browser.newContext({ permissions: ["camera"] }),
    form = await guest.newPage(),
    customer = await guest.newPage();
  await customer.goto(url + "/search");
  await form.route("**/api/posting/*/upload-sign", (r) =>
    r.fulfill({ json: { mode: "local" } }),
  );
  let uploads = 0;
  await form.route("**/api/posting/*/upload", (r) =>
    r.fulfill({
      json: { url: `/api/media/invite-${++uploads}.png`, kind: "IMAGE" },
    }),
  );
  let submissionRequest;
  form.on("request", (request) => {
    if (request.method() === "POST" && request.headers()["next-action"])
      submissionRequest = {
        body: request.postData(),
        headers: request.headers(),
      };
  });
  await form.goto(inviteUrl);
  await expect(form.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  assert.equal(
    (
      await guest.request.post(url + "/api/posting/invalid/upload-sign")
    ).status(),
    403,
  );
  const privateName = "PrivateSubmitterXYZ",
    privatePhone = "9876501234";
  async function submit(title) {
    await form.getByLabel("Your name", { exact: true }).fill(privateName);
    await form.getByLabel("Your phone number").fill(privatePhone);
    await form.getByLabel("Property title").fill(title);
    await form.getByLabel("City", { exact: true }).fill("Gurugram");
    await form.getByLabel("Locality", { exact: true }).fill("Sector 67");
    await form.getByRole("button", { name: /Continue to details/ }).click();
    await form
      .getByLabel("Private Builder Details / Remarks")
      .fill("CONFIDENTIAL-BUILDER-DETAILS");
    await form.getByRole("button", { name: /Continue to pricing/ }).click();
    await form.getByLabel("Expected price").fill("15000000");
    await form.locator('input[type="file"][multiple]').setInputFiles([
      { name: "a.png", mimeType: "image/png", buffer: Buffer.from("photo") },
      { name: "b.png", mimeType: "image/png", buffer: Buffer.from("photo") },
    ]);
    await expect(
      form.getByRole("button", { name: /Publish listing/ }),
    ).toBeEnabled();
    await form.getByRole("button", { name: "Take photo", exact: true }).click();
    await expect(
      form.getByRole("button", { name: "Capture photo", exact: true }),
    ).toBeEnabled();
    await form
      .getByRole("button", { name: "Capture photo", exact: true })
      .click();
    await expect(
      form.getByRole("dialog", { name: "Take a property photo" }),
    ).toHaveCount(0);
    await expect(
      form.getByRole("button", { name: "Remove photo", exact: true }),
    ).toHaveCount(3);
    await form.getByLabel("I confirm these details are correct.").check();
    await form.getByRole("button", { name: /Publish listing/ }).click();
    await expect(
      form.getByRole("heading", { name: "Property submitted for approval" }),
    ).toBeVisible({ timeout: 20000 });
  }
  await submit("Invited Home One");
  const property = await db.property.findFirst({
    where: { title: "Invited Home One" },
    include: { submission: true, media: true },
  });
  assert.equal(property.status, "PENDING");
  assert.equal(property.ownerId, owner.id);
  assert.equal(property.submission.phone, privatePhone);
  assert.equal(property.media.length, 3);
  await page.goto(url + "/owner/dashboard");
  await expect(
    page.getByRole("button", { name: "Approve", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Invited Home One", exact: true })
    .click();
  await expect(page).toHaveURL(url + "/owner/post?edit=" + property.id);
  await expect(page.getByLabel("Property title")).toHaveValue(
    "Invited Home One",
  );
  await expect(
    customer.getByText("Invited Home One", { exact: true }).first(),
  ).toHaveCount(0);
  await page.goto(url + "/owner/listings");
  await expect(
    page.getByText(`Submitted by ${privateName}`, { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve" })).toBeVisible();
  for (const path of ["/", "/search", `/property/${property.id}`]) {
    const html = await (await guest.request.get(url + path)).text();
    assert.ok(
      !html.includes(privateName) &&
        !html.includes(privatePhone) &&
        !html.includes("CONFIDENTIAL-BUILDER-DETAILS"),
      "Private data leak " + path,
    );
  }
  // Owner edit uses the same camera capture and upload flow.
  await page.route("**/api/owner/upload-sign", (r) =>
    r.fulfill({ json: { mode: "local" } }),
  );
  await page.route("**/api/owner/upload", (r) =>
    r.fulfill({ json: { url: "/api/media/owner-camera.png", kind: "IMAGE" } }),
  );
  await page.goto(url + "/owner/post?edit=" + property.id);
  await page.getByRole("button", { name: /Continue to details/ }).click();
  await page.getByRole("button", { name: /Continue to pricing/ }).click();
  await page.getByRole("button", { name: "Take photo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Capture photo", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Capture photo", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Remove photo", exact: true }),
  ).toHaveCount(4);
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect
    .poll(() => db.media.count({ where: { propertyId: property.id } }))
    .toBe(4);
  assert.equal(
    (await db.property.findUnique({ where: { id: property.id } })).status,
    "PENDING",
    "Editing a submitted property must not approve it",
  );
  await page.goto(url + "/owner/listings?f=PENDING");
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Nothing here.", { exact: true })).toBeVisible();
  assert.equal(
    (await db.property.findUnique({ where: { id: property.id } })).status,
    "ACTIVE",
  );
  await customer.reload();
  await expect(
    customer.getByText("Invited Home One", { exact: true }).first(),
  ).toBeVisible({ timeout: 20000 });
  assert.equal(
    await form.getByRole("button", { name: "Post another property" }).count(),
    0,
  );
  assert.equal(await db.propertySubmission.count(), 1);
  assert.equal(
    await db.notification.count({
      where: { userId: owner.id, title: "Property submitted" },
    }),
    1,
  );
  const used = await db.postingLink.findFirst({
    where: { token: inviteUrl.split("/").pop() },
  });
  assert.ok(used.usedAt);
  assert.ok(submissionRequest, "Captured property action");
  await guest.request.post(inviteUrl, {
    headers: submissionRequest.headers,
    data: submissionRequest.body,
  });
  assert.equal(
    await db.propertySubmission.count(),
    1,
    "Replayed submission must not create another property",
  );
  assert.equal(await db.property.count(), 1);

  await page.goto(url + "/owner/posting-links");
  await expect(page.getByText(/Used · Submission complete/)).toBeVisible();
  assert.equal(await page.getByLabel("Posting link").count(), 0);
  await page.getByLabel("Link label").fill("Unused invite");
  await page.getByRole("button", { name: "Create posting link" }).click();
  await expect(page.getByLabel("Posting link")).toHaveCount(1);
  await page.getByRole("button", { name: "Disable link" }).click();
  await expect(page.getByText(/Disabled/)).toBeVisible();
  await form.goto(inviteUrl);
  await expect(
    form.getByRole("heading", { name: "Posting link unavailable" }),
  ).toBeVisible();
  const token = inviteUrl.split("/").pop();
  assert.equal(
    (
      await guest.request.post(url + `/api/posting/${token}/upload-sign`)
    ).status(),
    403,
  );
  console.log(
    "PASS: owner-created single-use link, anonymous approval-pending submission, explicit owner approval, consumed-link rejection, camera capture and media persistence, customer visibility after approval, private submitter details, notifications and revocation.",
  );
} finally {
  await browser?.close();
  server?.kill();
  await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await db.$disconnect();
}
