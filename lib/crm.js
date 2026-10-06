import "server-only";
import { prisma } from "@/lib/prisma";
import { legacyStage } from "@/lib/crm-options";

export async function mirrorInquiry(tx, i, user, property) {
  return tx.crmLead.upsert({
    where: { inquiryId: i.id },
    update: {},
    create: {
      inquiryId: i.id,
      propertyId: i.propertyId,
      name: user.name || user.email || "Customer",
      phone: i.phone,
      email: user.email,
      type: "PROPERTY",
      interest: property.title,
      message: i.note,
      visitAt: i.visitAt,
      stage: i.handled ? "CONTACTED" : "NEW",
      source: "website",
      createdAt: i.createdAt,
    },
  });
}
export async function mirrorProject(tx, lead, project) {
  return tx.crmLead.upsert({
    where: { projectLeadId: lead.id },
    update: {},
    create: {
      projectLeadId: lead.id,
      projectId: lead.projectId,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      type: "PROJECT",
      interest: project.name,
      message: lead.pickupAddress ? `Pickup: ${lead.pickupAddress}` : null,
      visitAt: lead.visitAt,
      followUpAt: lead.followUpAt,
      stage: legacyStage(lead.stage),
      source: lead.source || "website",
      campaign: lead.campaign,
      consentAt: lead.consentAt,
      createdAt: lead.createdAt,
    },
  });
}
export async function ownerLeadNotification(lead) {
  const owner = await prisma.user.findFirst({ where: { role: "OWNER" } });
  if (owner)
    await prisma.notification.create({
      data: {
        userId: owner.id,
        title: `New ${lead.type.toLowerCase()} enquiry from ${lead.name}`,
        body: lead.interest,
        href: `/owner/crm/${lead.id}`,
      },
    });
}
