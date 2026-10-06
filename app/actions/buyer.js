"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getBuyer } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { normalizePhone } from "@/lib/otp";
import { mirrorInquiry } from "@/lib/crm";

export async function setPurpose(purpose) {
  (await cookies()).set("purpose", purpose === "rent" ? "rent" : "sale", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function setCity(city) {
  (await cookies()).set("city", String(city).slice(0, 40), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function toggleSave(propertyId) {
  const user = await getBuyer();
  if (!user) return { login: true };
  const key = { userId_propertyId: { userId: user.id, propertyId } };
  const had = await prisma.saved.findUnique({ where: key });
  if (had) await prisma.saved.delete({ where: key });
  else await prisma.saved.create({ data: { userId: user.id, propertyId } });
  revalidatePath("/saved");
  return { saved: !had };
}

export async function updateProfile(_prev, formData) {
  const user = await getBuyer();
  if (!user) return { error: "Please log in." };
  const name = String(formData.get("name") ?? "")
    .trim()
    .slice(0, 60);
  if (!name) return { error: "Name cannot be empty." };
  const rawPhone = String(formData.get("phone") ?? "").trim();
  const phone = rawPhone ? normalizePhone(rawPhone) : null;
  if (rawPhone && !phone)
    return { error: "Enter a valid 10-digit mobile number." };
  try {
    await prisma.user.update({ where: { id: user.id }, data: { name, phone } });
  } catch {
    return { error: "That mobile number is already used by another account." };
  }
  revalidatePath("/profile");
  return { ok: true };
}

const KINDS = ["VISIT", "CALLBACK", "MESSAGE"];

export async function createInquiry(_prev, formData) {
  const user = await getBuyer();
  if (!user) return { error: "Please log in first.", login: true };
  const propertyId = Number(formData.get("propertyId"));
  const kind = String(formData.get("kind"));
  const note = String(formData.get("note") ?? "")
    .trim()
    .slice(0, 500);
  const phone = normalizePhone(formData.get("phone"));
  if (!KINDS.includes(kind)) return { error: "Invalid request." };
  if (!user.emailVerified)
    return {
      error: "Please verify your email first. We sent you a link.",
      unverified: true,
    };
  if (!phone)
    return {
      error: "Enter a valid 10-digit mobile number so the owner can reach you.",
    };

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });
  if (!property || property.status !== "ACTIVE")
    return { error: "This listing is no longer available." };

  let visitAt = null;
  if (kind === "VISIT") {
    visitAt = new Date(String(formData.get("visitAt")));
    if (isNaN(visitAt) || visitAt < new Date())
      return { error: "Pick a future day and time slot." };
  }
  if (kind === "MESSAGE" && !note)
    return { error: "Write a message for the owner." };

  const inquiry = await prisma.$transaction(async (tx) => {
    const created = await tx.inquiry.create({
      data: {
        propertyId,
        userId: user.id,
        kind,
        phone,
        note: note || null,
        visitAt,
        messages: note
          ? { create: { sender: "BUYER", body: note } }
          : undefined,
      },
    });
    await mirrorInquiry(tx, created, user, property);
    return created;
  });
  if (!user.phone)
    await prisma.user
      .update({ where: { id: user.id }, data: { phone } })
      .catch(() => {});
  const who = user.name || user.email;
  const what = {
    VISIT: "requested a visit",
    CALLBACK: "requested a callback",
    MESSAGE: "sent a message",
  }[kind];
  await notify(
    property.ownerId,
    `${who} ${what}`,
    property.title,
    `/owner/inquiries/${inquiry.id}`,
  );
  revalidatePath("/owner/dashboard");
  revalidatePath("/owner/inquiries");
  revalidatePath("/owner/crm");
  return { ok: true, id: inquiry.id, kind };
}

export async function sendBuyerMessage(inquiryId, body) {
  const user = await getBuyer();
  const text = String(body ?? "")
    .trim()
    .slice(0, 1000);
  if (!user || !text) return { error: "Cannot send." };
  const inq = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    include: { property: true },
  });
  if (!inq || inq.userId !== user.id) return { error: "Not found." };
  await prisma.message.create({
    data: { inquiryId, sender: "BUYER", body: text },
  });
  if (inq.kind !== "VISIT")
    await prisma.inquiry.update({
      where: { id: inquiryId },
      data: { handled: false },
    });
  else
    await prisma.inquiry.update({
      where: { id: inquiryId },
      data: { updatedAt: new Date() },
    });
  await notify(
    inq.property.ownerId,
    `${user.name || user.email} sent a message`,
    text.slice(0, 80),
    `/owner/inquiries/${inquiryId}`,
  );
  revalidatePath(`/inquiries/${inquiryId}`);
  return { ok: true };
}

export async function markNotificationsRead() {
  const user = await getBuyer();
  if (!user) return;
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
}
