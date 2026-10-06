"use server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getOwner, getBuyer } from "@/lib/auth";
import { isMediaUrl } from "@/lib/media";
import { normalizePhone } from "@/lib/otp";
import { tooMany } from "@/lib/ratelimit";
import { mirrorProject } from "@/lib/crm";
import { legacyStage } from "@/lib/crm-options";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
const stages = [
  "NEW",
  "CONTACTED",
  "VISIT_SCHEDULED",
  "VISIT_COMPLETED",
  "NEGOTIATION",
  "BOOKED",
  "LOST",
];
const clean = (v, n = 200) =>
  String(v ?? "")
    .trim()
    .slice(0, n);
function refresh(slug) {
  for (const p of [
    "/",
    "/projects",
    "/saved",
    "/owner/projects",
    "/owner/leads",
  ])
    revalidatePath(p);
  if (slug) revalidatePath(`/projects/${slug}`);
}
export async function saveProject(id, d) {
  if (!(await getOwner())) return { error: "Please sign in." };
  const existing = id
    ? await prisma.project.findUnique({ where: { id: Number(id) } })
    : null;
  if (id && !existing) return { error: "Project not found." };
  const name = clean(d.name, 120),
    city = clean(d.city, 60),
    locality = clean(d.locality, 120),
    builder = clean(d.builder, 120);
  if (!name || !builder || !city || !locality)
    return { error: "Project name, builder, city and locality are required." };
  const status = ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(d.status)
    ? d.status
    : "DRAFT";
  const configurations = (d.configurations ?? []).slice(0, 30).map((c) => ({
    label: clean(c.label, 60),
    bedrooms: c.bedrooms ? Number(c.bedrooms) : null,
    area: Number(c.area),
    price: c.price === "" || c.price == null ? null : Number(c.price),
    floorPlan: c.floorPlan && isMediaUrl(c.floorPlan) ? c.floorPlan : null,
  }));
  if (
    configurations.some(
      (c) =>
        !c.label ||
        !Number.isInteger(c.area) ||
        c.area <= 0 ||
        c.area > 10000000 ||
        (c.bedrooms != null &&
          (!Number.isInteger(c.bedrooms) ||
            c.bedrooms < 0 ||
            c.bedrooms > 50)) ||
        (c.price != null &&
          (!Number.isFinite(c.price) ||
            c.price <= 0 ||
            c.price > 999999999999)),
    )
  )
    return {
      error:
        "Each configuration needs a label, positive area and a valid price (or leave price blank).",
    };
  const assets = (d.assets ?? [])
    .slice(0, 30)
    .filter(
      (a) =>
        ["IMAGE", "VIDEO", "BROCHURE"].includes(a.kind) && isMediaUrl(a.url),
    )
    .map((a, i) => ({ kind: a.kind, url: a.url, sort: i }));
  if (
    status === "PUBLISHED" &&
    (!configurations.length || !assets.some((a) => a.kind === "IMAGE"))
  )
    return {
      error: "Add at least one configuration and one photo to publish.",
    };
  const coord = (v, min, max) =>
    v === "" || v == null
      ? null
      : Number.isFinite(Number(v)) && Number(v) >= min && Number(v) <= max
        ? Number(v)
        : NaN;
  const lat = coord(d.lat, -90, 90),
    lng = coord(d.lng, -180, 180);
  if (Number.isNaN(lat) || Number.isNaN(lng) || (lat == null) !== (lng == null))
    return { error: "Set both valid latitude and longitude." };
  if (!["READY", "UNDER_CONSTRUCTION", "NEW_LAUNCH"].includes(d.possession))
    return { error: "Select possession status." };
  const slug =
    existing?.slug ??
    `${
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "project"
    }-${crypto.randomBytes(3).toString("hex")}`;
  await prisma.$transaction(async (tx) => {
    const b = await tx.builder.upsert({
      where: { name: builder },
      create: { name: builder },
      update: {},
    });
    const data = {
      name,
      slug,
      builderId: b.id,
      city,
      state: clean(d.state, 60) || null,
      locality,
      status,
      lat,
      lng,
      reraId: clean(d.reraId, 100) || null,
      possession: d.possession,
      possessionDate: clean(d.possessionDate, 60) || null,
      description: clean(d.description, 10000),
      paymentPlan: clean(d.paymentPlan, 5000),
      amenities: clean(d.amenities, 3000)
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
        .slice(0, 40),
      featured: !!d.featured,
    };
    const p = existing
      ? await tx.project.update({ where: { id: existing.id }, data })
      : await tx.project.create({ data });
    await tx.configuration.deleteMany({ where: { projectId: p.id } });
    await tx.projectAsset.deleteMany({ where: { projectId: p.id } });
    if (configurations.length)
      await tx.configuration.createMany({
        data: configurations.map((c) => ({ ...c, projectId: p.id })),
      });
    if (assets.length)
      await tx.projectAsset.createMany({
        data: assets.map((a) => ({ ...a, projectId: p.id })),
      });
  });
  refresh(slug);
  return { ok: true, slug };
}
export async function createProjectLead(_prev, fd) {
  const projectId = Number(fd.get("projectId")),
    name = clean(fd.get("name"), 80),
    phone = normalizePhone(fd.get("phone"));
  if (!name || !phone || fd.get("consent") !== "on")
    return {
      error: "Enter your name, valid mobile number and contact consent.",
    };
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (
    tooMany(`project:${ip}`, 10, 3600000) ||
    tooMany(`project-phone:${phone}`, 5, 3600000)
  )
    return { error: "Too many requests. Please try later." };
  const p = await prisma.project.findUnique({ where: { id: projectId } });
  if (!p || p.status !== "PUBLISHED")
    return { error: "Project is unavailable." };
  const kind = fd.get("kind") === "VISIT" ? "VISIT" : "ENQUIRY";
  const email = clean(fd.get("email"), 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: "Enter a valid email." };
  const visitAt = kind === "VISIT" ? new Date(String(fd.get("visitAt"))) : null;
  if (visitAt && (isNaN(visitAt) || visitAt <= new Date()))
    return { error: "Choose a future visit time." };
  const lead = await prisma.$transaction(async (tx) => {
    const created = await tx.projectLead.create({
      data: {
        projectId,
        name,
        phone,
        email: email || null,
        kind,
        visitAt,
        pickupAddress: clean(fd.get("pickupAddress"), 300) || null,
        consentAt: new Date(),
        source: clean(fd.get("source"), 100) || "website",
        campaign: clean(fd.get("campaign"), 100) || null,
      },
    });
    await mirrorProject(tx, created, p);
    return created;
  });
  const owner = await prisma.user.findFirst({ where: { role: "OWNER" } });
  if (owner)
    await prisma.notification.create({
      data: {
        userId: owner.id,
        title: `${name} requested ${kind === "VISIT" ? "a project visit" : "project details"}`,
        body: p.name,
        href: `/owner/leads/${lead.id}`,
      },
    });
  refresh(p.slug);
  revalidatePath("/owner/crm");
  return { ok: true };
}
export async function updateLead(_prev, fd) {
  if (!(await getOwner())) return { error: "Please sign in." };
  const id = Number(fd.get("id")),
    stage = String(fd.get("stage")),
    note = clean(fd.get("note"), 3000);
  if (!stages.includes(stage)) return { error: "Invalid stage." };
  const date = (k) => (fd.get(k) ? new Date(String(fd.get(k))) : null);
  const followUpAt = date("followUpAt"),
    visitAt = date("visitAt");
  if ([followUpAt, visitAt].some((d) => d && isNaN(d)))
    return { error: "Invalid date." };
  if (stage === "VISIT_SCHEDULED" && !visitAt)
    return { error: "Set the visit date and time." };
  if (!(await prisma.projectLead.findUnique({ where: { id } })))
    return { error: "Lead not found." };
  await prisma.projectLead.update({
    where: { id },
    data: {
      stage,
      followUpAt,
      visitAt,
      ...(note ? { notes: { create: { body: note } } } : {}),
    },
  });
  const crm = await prisma.crmLead.findUnique({ where: { projectLeadId: id } });
  if (crm)
    await prisma.crmLead.update({
      where: { id: crm.id },
      data: {
        stage: legacyStage(stage),
        followUpAt,
        visitAt,
        ...(note ? { activities: { create: { body: note } } } : {}),
      },
    });
  revalidatePath("/owner/crm");
  revalidatePath(`/owner/leads/${id}`);
  refresh();
  return { ok: true };
}
export async function toggleProjectSave(id) {
  const u = await getBuyer();
  if (!u) return { login: true };
  const p = await prisma.project.findUnique({ where: { id: Number(id) } });
  if (!p) return { error: "Unavailable" };
  const where = { userId_projectId: { userId: u.id, projectId: p.id } },
    old = await prisma.savedProject.findUnique({ where });
  if (old) await prisma.savedProject.delete({ where });
  else if (p.status !== "PUBLISHED") return { error: "Unavailable" };
  else
    await prisma.savedProject.create({
      data: { userId: u.id, projectId: p.id },
    });
  revalidatePath("/saved");
  return { saved: !old };
}
