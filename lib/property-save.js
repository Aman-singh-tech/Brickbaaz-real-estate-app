import "server-only";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { stateOf } from "@/lib/format";
import { isMediaUrl } from "@/lib/media";
const TYPES = [
  "APARTMENT",
  "VILLA",
  "BUILDER_FLOOR",
  "PLOT",
  "COMMERCIAL",
  "FARM_HOUSE",
];
const int = (v, max = 2_000_000_000) => {
  if (v === "" || v == null) return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
};
const str = (v, n = 200) =>
  v == null || v === "" ? null : String(v).trim().slice(0, n) || null;

function refresh(id) {
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/sitemap.xml");
  revalidatePath("/owner/posting-links");
  revalidatePath("/owner/notifications");
  revalidatePath("/owner/dashboard");
  revalidatePath("/owner/listings");
  if (id) revalidatePath(`/property/${id}`);
}

// data: plain object from the post wizard. publish=false saves as draft.
export async function persistProperty(
  owner,
  id,
  data,
  publish,
  submission = null,
) {
  const purpose = data.purpose === "RENT" ? "RENT" : "SALE";
  const type = TYPES.includes(data.type) ? data.type : null;
  const price = int(data.price);
  const city = str(data.city, 60);
  const title = str(data.title, 120);
  const locality = str(data.locality, 120);
  const media = (Array.isArray(data.media) ? data.media : [])
    .filter(
      (m) => m && ["IMAGE", "VIDEO"].includes(m.kind) && isMediaUrl(m.url),
    )
    .slice(0, 21);
  const images = media.filter((m) => m.kind === "IMAGE");

  if (publish) {
    if (!type) return { error: "Choose a property type.", step: 1 };
    if (!title) return { error: "Add a property title.", step: 1 };
    if (!city || !locality)
      return { error: "City and locality are required.", step: 1 };
    if (!price) return { error: "Enter the price.", step: 3 };
    if (images.length < 2) return { error: "Add at least 2 photos.", step: 3 };
    if (!data.confirmed)
      return { error: "Please confirm the details are correct.", step: 3 };
  } else if (!title) {
    return { error: "Add a title before saving a draft.", step: 1 };
  }

  const fields = {
    purpose,
    type: type ?? "APARTMENT",
    title,
    city: city ?? "",
    state: str(data.state, 60) || stateOf(city) || null,
    locality: locality ?? "",
    society: str(data.society),
    lat:
      Number.isFinite(Number(data.lat)) && data.lat !== "" && data.lat != null
        ? Number(data.lat)
        : null,
    lng:
      Number.isFinite(Number(data.lng)) && data.lng !== "" && data.lng != null
        ? Number(data.lng)
        : null,
    bedrooms: int(data.bedrooms, 50),
    bathrooms: int(data.bathrooms, 50),
    balconies: int(data.balconies, 50),
    carpetArea: int(data.carpetArea, 1e7),
    superArea: int(data.superArea, 1e7),
    floor: int(data.floor, 200),
    totalFloors: int(data.totalFloors, 200),
    furnishing: str(data.furnishing, 30),
    facing: str(data.facing, 30),
    possession: str(data.possession, 30),
    possessionBy: str(data.possessionBy, 30),
    amenities: (data.amenities ?? [])
      .map((a) => String(a).slice(0, 60))
      .slice(0, 30),
    nearby: (data.nearby ?? [])
      .filter((n) => n.label && n.distance)
      .slice(0, 3)
      .map((n) => ({
        label: String(n.label).slice(0, 40),
        distance: String(n.distance).slice(0, 20),
      })),
    description: str(data.description, 3000),
    reraId: str(data.reraId, 40),
    price: price ?? 0,
    negotiable: !!data.negotiable,
    deposit: purpose === "RENT" ? int(data.deposit) : null,
  };

  let existing = null;
  if (id) {
    existing = await prisma.property.findUnique({ where: { id } });
    if (!existing || existing.ownerId !== owner.id)
      return { error: "Listing not found." };
  }

  const status = publish
    ? submission || existing?.status === "PENDING"
      ? "PENDING"
      : existing && ["PAUSED", "RENTED", "SOLD"].includes(existing.status)
        ? existing.status
        : "ACTIVE"
    : (existing?.status ?? "DRAFT");
  const publishedAt =
    status === "ACTIVE" && !existing?.publishedAt
      ? new Date()
      : (existing?.publishedAt ?? null);

  const saved = await prisma.$transaction(async (tx) => {
    if (submission) {
      // Claim inside the same transaction: concurrent submissions cannot both win.
      // Any later validation/database failure rolls the claim back with the listing.
      const claim = await tx.postingLink.updateMany({
        where: {
          id: submission.linkId,
          ownerId: owner.id,
          active: true,
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });
      if (claim.count !== 1)
        throw new Error("Posting link has already been used or disabled.");
    }
    const p = existing
      ? await tx.property.update({
          where: { id },
          data: { ...fields, status, publishedAt },
        })
      : await tx.property.create({
          data: { ...fields, ownerId: owner.id, status, publishedAt },
        });
    if (submission) {
      await tx.propertySubmission.create({
        data: { ...submission, propertyId: p.id },
      });
      await tx.notification.create({
        data: {
          userId: owner.id,
          title: "Property submitted",
          body: `${submission.name} submitted ${p.title}`,
          href: "/owner/listings",
        },
      });
    }
    await tx.media.deleteMany({ where: { propertyId: p.id } });
    if (Object.hasOwn(data, "builderRemarks")) {
      const remarks = str(data.builderRemarks, 3000);
      if (remarks)
        await tx.propertyPrivateDetails.upsert({
          where: { propertyId: p.id },
          create: { propertyId: p.id, remarks },
          update: { remarks },
        });
      else
        await tx.propertyPrivateDetails.deleteMany({
          where: { propertyId: p.id },
        });
    }
    if (media.length)
      await tx.media.createMany({
        data: media.map((m, i) => ({
          propertyId: p.id,
          kind: m.kind,
          url: m.url,
          sort: i,
        })),
      });
    return p;
  });

  refresh(saved.id);
  return { ok: true, id: saved.id, status: saved.status };
}
