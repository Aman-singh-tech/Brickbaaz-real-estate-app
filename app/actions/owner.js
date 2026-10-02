"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getOwner } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { stateOf } from "@/lib/format";
import { isMediaUrl } from "@/lib/media";

const TYPES = ["APARTMENT", "VILLA", "BUILDER_FLOOR", "PLOT", "COMMERCIAL"];
const int = (v, max = 2_000_000_000) => {
  if (v === "" || v == null) return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
};
const str = (v, n = 200) => (v == null || v === "" ? null : String(v).trim().slice(0, n) || null);

function refresh(id) {
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/owner/dashboard");
  revalidatePath("/owner/listings");
  if (id) revalidatePath(`/property/${id}`);
}

// data: plain object from the post wizard. publish=false saves as draft.
export async function saveProperty(id, data, publish) {
  const owner = await getOwner();
  if (!owner) return { error: "Session expired. Please sign in again." };

  const purpose = data.purpose === "RENT" ? "RENT" : "SALE";
  const type = TYPES.includes(data.type) ? data.type : null;
  const price = int(data.price);
  const city = str(data.city, 60);
  const title = str(data.title, 120);
  const locality = str(data.locality, 120);
  const media = (data.media ?? []).filter((m) => isMediaUrl(m.url));
  const images = media.filter((m) => m.kind === "IMAGE");

  if (publish) {
    if (!type) return { error: "Choose a property type.", step: 1 };
    if (!title) return { error: "Add a property title.", step: 1 };
    if (!city || !locality) return { error: "City and locality are required.", step: 1 };
    if (!price) return { error: "Enter the price.", step: 3 };
    if (images.length < 4) return { error: "Add at least 4 photos.", step: 3 };
    if (!data.confirmed) return { error: "Please confirm the details are correct.", step: 3 };
  } else if (!title) {
    return { error: "Add a title before saving a draft.", step: 1 };
  }

  const fields = {
    purpose, type: type ?? "APARTMENT", title, city: city ?? "", state: stateOf(city) || null,
    locality: locality ?? "", society: str(data.society),
    lat: Number.isFinite(Number(data.lat)) && data.lat !== "" && data.lat != null ? Number(data.lat) : null,
    lng: Number.isFinite(Number(data.lng)) && data.lng !== "" && data.lng != null ? Number(data.lng) : null,
    bedrooms: int(data.bedrooms, 50), bathrooms: int(data.bathrooms, 50), balconies: int(data.balconies, 50),
    carpetArea: int(data.carpetArea, 1e7), superArea: int(data.superArea, 1e7),
    floor: int(data.floor, 200), totalFloors: int(data.totalFloors, 200),
    furnishing: str(data.furnishing, 30), facing: str(data.facing, 30),
    possession: str(data.possession, 30), possessionBy: str(data.possessionBy, 30),
    amenities: (data.amenities ?? []).map((a) => String(a).slice(0, 60)).slice(0, 30),
    nearby: (data.nearby ?? []).filter((n) => n.label && n.distance).slice(0, 3).map((n) => ({ label: String(n.label).slice(0, 40), distance: String(n.distance).slice(0, 20) })),
    description: str(data.description, 3000), reraId: str(data.reraId, 40),
    price: price ?? 0, negotiable: !!data.negotiable, deposit: purpose === "RENT" ? int(data.deposit) : null,
  };

  let existing = null;
  if (id) {
    existing = await prisma.property.findUnique({ where: { id } });
    if (!existing || existing.ownerId !== owner.id) return { error: "Listing not found." };
  }

  const status = publish
    ? existing && ["PAUSED", "RENTED", "SOLD"].includes(existing.status) ? existing.status : "ACTIVE"
    : existing?.status ?? "DRAFT";
  const publishedAt = status === "ACTIVE" && !existing?.publishedAt ? new Date() : existing?.publishedAt ?? null;

  const saved = await prisma.$transaction(async (tx) => {
    const p = existing
      ? await tx.property.update({ where: { id }, data: { ...fields, status, publishedAt } })
      : await tx.property.create({ data: { ...fields, ownerId: owner.id, status, publishedAt } });
    await tx.media.deleteMany({ where: { propertyId: p.id } });
    if (media.length)
      await tx.media.createMany({ data: media.map((m, i) => ({ propertyId: p.id, kind: m.kind, url: m.url, sort: i })) });
    return p;
  });

  refresh(saved.id);
  return { ok: true, id: saved.id, status: saved.status };
}

async function own(id) {
  const owner = await getOwner();
  if (!owner) return null;
  const p = await prisma.property.findUnique({ where: { id } });
  return p && p.ownerId === owner.id ? p : null;
}

export async function setStatus(id, status) {
  if (!["ACTIVE", "PAUSED", "RENTED", "SOLD"].includes(status)) return { error: "Invalid status" };
  const p = await own(id);
  if (!p) return { error: "Not found" };
  await prisma.property.update({
    where: { id },
    data: { status, publishedAt: status === "ACTIVE" && !p.publishedAt ? new Date() : p.publishedAt },
  });
  refresh(id);
  return { ok: true };
}

export async function setFeatured(id, featured) {
  if (!(await own(id))) return { error: "Not found" };
  await prisma.property.update({ where: { id }, data: { featured: !!featured } });
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
  const text = String(body ?? "").trim().slice(0, 1000);
  if (!owner || !text) return { error: "Cannot send." };
  const inq = await prisma.inquiry.findUnique({ where: { id: inquiryId }, include: { property: true } });
  if (!inq || inq.property.ownerId !== owner.id) return { error: "Not found." };
  await prisma.message.create({ data: { inquiryId, sender: "OWNER", body: text } });
  // replying does not confirm a visit; that needs the explicit "Confirm visit" action
  if (inq.kind !== "VISIT") await prisma.inquiry.update({ where: { id: inquiryId }, data: { handled: true } });
  await notify(inq.userId, "Owner replied to your message", `${inq.property.title}: ${text.slice(0, 80)}`, `/inquiries/${inquiryId}`);
  revalidatePath(`/owner/inquiries/${inquiryId}`);
  return { ok: true };
}

export async function setInquiryHandled(id, handled) {
  const owner = await getOwner();
  if (!owner) return;
  const inq = await prisma.inquiry.findUnique({ where: { id }, include: { property: true } });
  if (!inq || inq.property.ownerId !== owner.id) return;
  await prisma.inquiry.update({ where: { id }, data: { handled } });
  if (handled && inq.kind === "VISIT")
    await notify(inq.userId, "Visit confirmed", `${inq.property.title}`, `/inquiries/${id}`);
  revalidatePath("/owner/inquiries");
  revalidatePath("/owner/dashboard");
}

export async function markOwnerNotificationsRead() {
  const owner = await getOwner();
  if (!owner) return;
  await prisma.notification.updateMany({ where: { userId: owner.id, read: false }, data: { read: true } });
  revalidatePath("/owner/notifications");
}
