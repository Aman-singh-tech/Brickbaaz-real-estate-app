"use server";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { postingLink } from "@/lib/posting-links";
import { persistProperty } from "@/lib/property-save";

export async function createPostingLink(form) {
  const owner = await requireOwner();
  const label = String(form.get("label") || "Property posting link")
    .trim()
    .slice(0, 100);
  await prisma.postingLink.create({
    data: { ownerId: owner.id, label, token: randomBytes(32).toString("hex") },
  });
  revalidatePath("/owner/posting-links");
}
export async function disablePostingLink(form) {
  const owner = await requireOwner();
  await prisma.postingLink.updateMany({
    where: { id: Number(form.get("id")), ownerId: owner.id },
    data: { active: false },
  });
  revalidatePath("/owner/posting-links");
}
export async function submitInvitedProperty(token, data, contact) {
  const link = await postingLink(token);
  if (!link)
    return {
      error: "This posting link is unavailable. Please contact Brickbaaz.",
    };
  const name = String(contact?.name || "")
    .trim()
    .slice(0, 100);
  const phone = String(contact?.phone || "").replace(/\D/g, "");
  const email = String(contact?.email || "")
    .trim()
    .slice(0, 254);
  if (
    !name ||
    !/^\d{10,15}$/.test(phone) ||
    (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  )
    return {
      error: "Enter your name, valid phone number and email (if provided).",
      step: 1,
    };
  try {
    return await persistProperty({ id: link.ownerId }, null, data, true, {
      linkId: link.id,
      name,
      phone,
      email: email || null,
    });
  } catch {
    return {
      error:
        "Unable to submit. Check that your link is still active and try again.",
    };
  }
}
