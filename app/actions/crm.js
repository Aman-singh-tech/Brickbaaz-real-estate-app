"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOwner } from "@/lib/auth";
import { normalizePhone } from "@/lib/otp";
import { tooMany } from "@/lib/ratelimit";
import { CRM_STAGES, LEAD_TYPES, LOANS } from "@/lib/crm-options";
import { parseCsv } from "@/lib/csv-leads";
import { ownerLeadNotification } from "@/lib/crm";

const clean = (v, max = 200) =>
  String(v ?? "")
    .trim()
    .slice(0, max);
const validEmail = (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
function refresh() {
  revalidatePath("/owner/crm");
  revalidatePath("/owner/dashboard");
}

export async function submitInterest(_prev, fd) {
  const name = clean(fd.get("name"), 80),
    phone = normalizePhone(fd.get("phone")),
    email = clean(fd.get("email"));
  if (fd.get("website")) return { error: "Unable to submit." };
  if (!name || !phone || !validEmail(email) || fd.get("consent") !== "on")
    return {
      error: "Enter your name, valid mobile/email and contact consent.",
    };
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (
    tooMany(`interest-ip:${ip}`, 15, 3600000) ||
    tooMany(`interest-phone:${phone}`, 6, 3600000)
  )
    return { error: "Too many requests. Please try later." };
  const type = String(fd.get("type"));
  let interest,
    propertyId = null,
    projectId = null,
    amount = null;
  if (type === "PROPERTY") {
    const p = await prisma.property.findUnique({
      where: { id: Number(fd.get("referenceId")) || -1 },
    });
    if (!p || p.status !== "ACTIVE")
      return { error: "Property is no longer available." };
    interest = p.title;
    propertyId = p.id;
  } else if (type === "PROJECT") {
    const p = await prisma.project.findUnique({
      where: { id: Number(fd.get("referenceId")) || -1 },
    });
    if (!p || p.status !== "PUBLISHED")
      return { error: "Project is unavailable." };
    interest = p.name;
    projectId = p.id;
  } else if (type === "LOAN") {
    interest = clean(fd.get("loan"));
    if (!LOANS.includes(interest)) return { error: "Choose a loan service." };
    amount = Number(fd.get("amount"));
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1e12)
      return { error: "Enter a valid requested amount." };
  } else if (type === "OTHER") {
    interest = "Property assistance";
  } else return { error: "Invalid enquiry type." };
  const existing = await prisma.crmLead.findFirst({
    where: {
      phone,
      type,
      interest,
      createdAt: { gte: new Date(Date.now() - 60000) },
    },
  });
  if (existing) return { ok: true };
  const lead = await prisma.crmLead.create({
    data: {
      name,
      phone,
      email: email || null,
      type,
      interest,
      amount,
      propertyId,
      projectId,
      message: clean(fd.get("message"), 3000) || null,
      source: clean(fd.get("source"), 80) || "website",
      campaign: clean(fd.get("campaign"), 100) || null,
      consentAt: new Date(),
      activities: {
        create: { body: "Customer submitted an interest enquiry." },
      },
    },
  });
  await ownerLeadNotification(lead);
  refresh();
  return { ok: true };
}

export async function updateCrmLead(_prev, fd) {
  if (!(await getOwner())) return { error: "Please sign in." };
  const id = Number(fd.get("id")),
    stage = String(fd.get("stage"));
  if (!CRM_STAGES[stage]) return { error: "Invalid stage." };
  const dates = {};
  for (const key of ["followUpAt", "visitAt"]) {
    dates[key] = fd.get(key) ? new Date(String(fd.get(key))) : null;
    if (dates[key] && isNaN(dates[key])) return { error: "Invalid date." };
  }
  if (stage === "VISIT_SCHEDULED" && !dates.visitAt)
    return { error: "Set a visit date." };
  if (stage === "FOLLOW_UP" && !dates.followUpAt)
    return { error: "Set a follow-up date." };
  const lead = await prisma.crmLead.findUnique({ where: { id } });
  if (!lead) return { error: "Lead not found." };
  const note = clean(fd.get("note"), 3000);
  await prisma.$transaction(async (tx) => {
    await tx.crmLead.update({
      where: { id },
      data: {
        stage,
        ...dates,
        activities: {
          create: [
            {
              body: `Stage: ${CRM_STAGES[stage]}. Follow-up: ${dates.followUpAt?.toISOString() || "none"}. Visit: ${dates.visitAt?.toISOString() || "none"}.`,
            },
            ...(note ? [{ body: note }] : []),
          ],
        },
      },
    });
    if (lead.projectLeadId) {
      const legacy =
        stage === "CONVERTED"
          ? "BOOKED"
          : stage === "FOLLOW_UP"
            ? "CONTACTED"
            : stage;
      await tx.projectLead.updateMany({
        where: { id: lead.projectLeadId },
        data: { stage: legacy, ...dates },
      });
    }
    if (lead.inquiryId)
      await tx.inquiry.updateMany({
        where: { id: lead.inquiryId },
        data: { handled: stage !== "NEW", visitAt: dates.visitAt },
      });
  });
  refresh();
  revalidatePath(`/owner/crm/${id}`);
  revalidatePath("/owner/leads");
  revalidatePath("/owner/inquiries");
  return { ok: true };
}

function importRows(text, mapping, source) {
  const parsed = parseCsv(text);
  for (const key of [
    "name",
    "phone",
    "email",
    "interest",
    "message",
    "source",
  ]) {
    if (
      mapping[key] !== "" &&
      mapping[key] != null &&
      (!Number.isInteger(Number(mapping[key])) ||
        Number(mapping[key]) < 0 ||
        Number(mapping[key]) >= parsed.headers.length)
    )
      throw Error("Invalid column mapping.");
  }
  for (const field of ["name", "phone"])
    if (
      !Number.isInteger(Number(mapping[field])) ||
      mapping[field] === "" ||
      Number(mapping[field]) < 0 ||
      Number(mapping[field]) >= parsed.headers.length
    )
      throw Error("Map name and phone columns.");
  const value = (row, key) =>
    mapping[key] !== "" && mapping[key] != null
      ? row[Number(mapping[key])]
      : "";
  const seen = new Set();
  return parsed.rows.map((row, i) => {
    const name = clean(value(row, "name"), 80),
      phone = normalizePhone(value(row, "phone")),
      email = clean(value(row, "email"));
    let error =
      !name || !phone || !validEmail(email)
        ? "Invalid name, phone or email"
        : null;
    if (!error && seen.has(phone)) error = "Duplicate phone within CSV";
    if (!error) seen.add(phone);
    return {
      row: i + 2,
      error,
      data: {
        name,
        phone,
        email: email || null,
        type: "OTHER",
        interest: clean(value(row, "interest")) || "Imported enquiry",
        message: clean(value(row, "message"), 3000) || null,
        source:
          clean(value(row, "source"), 80) || clean(source, 80) || "Meta CSV",
      },
    };
  });
}
export async function previewLeadImport(text, mapping, source) {
  if (!(await getOwner())) return { error: "Please sign in." };
  try {
    const rows = importRows(text, mapping, source);
    const phones = rows.filter((r) => !r.error).map((r) => r.data.phone);
    const known = await prisma.crmLead.findMany({
      where: { phone: { in: phones } },
      select: { phone: true },
    });
    const existing = new Set(known.map((l) => l.phone));
    return {
      rows: rows.map((r) => ({
        ...r,
        error:
          r.error ||
          (existing.has(r.data.phone) ? "Phone already exists in CRM" : null),
      })),
    };
  } catch (e) {
    return { error: e.message };
  }
}
export async function importLeads(text, mapping, source, authorized) {
  const owner = await getOwner();
  if (!owner) return { error: "Please sign in." };
  if (authorized !== true)
    return { error: "Confirm you have permission to use these contacts." };
  try {
    const rows = importRows(text, mapping, source);
    let added = 0,
      skipped = 0;
    await prisma.$transaction(
      async (tx) => {
        for (const row of rows) {
          if (
            row.error ||
            (await tx.crmLead.findFirst({ where: { phone: row.data.phone } }))
          ) {
            skipped++;
            continue;
          }
          await tx.crmLead.create({
            data: {
              ...row.data,
              importedBy: owner.id,
              activities: {
                create: {
                  body: `CSV imported by owner. Contact consent is not recorded by this import.`,
                },
              },
            },
          });
          added++;
        }
      },
      { isolationLevel: "Serializable", timeout: 30000 },
    );
    refresh();
    return { ok: true, added, skipped };
  } catch (e) {
    return {
      error:
        e.code === "P2034"
          ? "Another import changed the CRM. Preview and try again."
          : e.message?.startsWith("CSV")
            ? e.message
            : "Import failed. No rows were committed; check the file and try again.",
    };
  }
}
export async function addManualLead(_prev, fd) {
  const owner = await getOwner();
  if (!owner) return { error: "Please sign in." };
  const name = clean(fd.get("name"), 80),
    phone = normalizePhone(fd.get("phone")),
    email = clean(fd.get("email")),
    type = String(fd.get("type"));
  if (!name || !phone || !validEmail(email) || !LEAD_TYPES[type])
    return { error: "Enter valid contact details." };
  const lead = await prisma.crmLead.create({
    data: {
      name,
      phone,
      email: email || null,
      type,
      interest: clean(fd.get("interest")) || "Manual enquiry",
      source: clean(fd.get("source"), 80) || "manual",
      message: clean(fd.get("message"), 3000) || null,
      importedBy: owner.id,
      activities: { create: { body: "Lead added manually by owner." } },
    },
  });
  refresh();
  return { ok: true, id: lead.id };
}
