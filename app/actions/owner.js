"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOwner } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { persistProperty } from "@/lib/property-save";
function refresh(id) {
  revalidatePath("/", "layout");
  if (id) revalidatePath(`/property/${id}`);
}

export async function saveProperty(id, data, publish) {
  const owner = await getOwner();
  if (!owner) return { error: "Session expired. Please sign in again." };
  return persistProperty(owner, id, data, publish);
}

async function own(id) {
  const owner = await getOwner();
  if (!owner) return null;
  const p = await prisma.property.findUnique({ where: { id } });
  return p && p.ownerId === owner.id ? p : null;
}

export async function setStatus(id, status) {
  if (!["ACTIVE", "PAUSED", "RENTED", "SOLD"].includes(status))
    return { error: "Invalid status" };
  const p = await own(id);
  if (!p) return { error: "Not found" };
  await prisma.property.update({
    where: { id },
    data: {
      status,
      publishedAt:
        status === "ACTIVE" && !p.publishedAt ? new Date() : p.publishedAt,
    },
  });
  refresh(id);
  return { ok: true };
}

export async function setFeatured(id, featured) {
  if (!(await own(id))) return { error: "Not found" };
  await prisma.property.update({
    where: { id },
    data: { featured: !!featured },
  });
  refresh(id);
  return { ok: true };
}

export async function deleteProperty(id) {
  if (!(await own(id))) return { error: "Not found" };
  await prisma.property.delete({ where: { id } });
  refresh();
  return { ok: true };
}

export async function sendOwnerMessage(inquiryId, body) {
  const owner = await getOwner();
  const text = String(body ?? "")
    .trim()
    .slice(0, 1000);
  if (!owner || !text) return { error: "Cannot send." };
  const inq = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    include: { property: true },
  });
  if (!inq || inq.property.ownerId !== owner.id) return { error: "Not found." };
  await prisma.message.create({
    data: { inquiryId, sender: "OWNER", body: text },
  });
  const crm = await prisma.crmLead.findUnique({ where: { inquiryId } });
  if (crm)
    await prisma.crmLead.update({
      where: { id: crm.id },
      data: {
        ...(crm.stage === "NEW" ? { stage: "CONTACTED" } : {}),
        activities: { create: { body: `Owner replied: ${text}` } },
      },
    });
  revalidatePath("/owner/crm");
  // replying does not confirm a visit; that needs the explicit "Confirm visit" action
  if (inq.kind !== "VISIT")
    await prisma.inquiry.update({
      where: { id: inquiryId },
      data: { handled: true },
    });
  await notify(
    inq.userId,
    "Owner replied to your message",
    `${inq.property.title}: ${text.slice(0, 80)}`,
    `/inquiries/${inquiryId}`,
  );
  revalidatePath(`/owner/inquiries/${inquiryId}`);
  return { ok: true };
}

export async function setInquiryHandled(id, handled) {
  const owner = await getOwner();
  if (!owner) return;
  const inq = await prisma.inquiry.findUnique({
    where: { id },
    include: { property: true },
  });
  if (!inq || inq.property.ownerId !== owner.id) return;
  await prisma.inquiry.update({ where: { id }, data: { handled } });
  await prisma.crmLead.updateMany({
    where: { inquiryId: id, stage: { in: ["NEW", "CONTACTED"] } },
    data: { stage: handled ? "CONTACTED" : "NEW" },
  });
  revalidatePath("/owner/crm");
  if (handled && inq.kind === "VISIT")
    await notify(
      inq.userId,
      "Visit confirmed",
      `${inq.property.title}`,
      `/inquiries/${id}`,
    );
  revalidatePath("/owner/inquiries");
  revalidatePath("/owner/dashboard");
}

export async function markOwnerNotificationsRead() {
  const owner = await getOwner();
  if (!owner) return;
  await prisma.notification.updateMany({
    where: { userId: owner.id, read: false },
    data: { read: true },
  });
  revalidatePath("/owner/notifications");
}
