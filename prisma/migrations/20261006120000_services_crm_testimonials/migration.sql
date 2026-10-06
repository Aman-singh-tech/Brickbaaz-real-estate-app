-- CreateTable
CREATE TABLE "CrmLead" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "type" TEXT NOT NULL,
    "interest" TEXT NOT NULL,
    "message" TEXT,
    "source" TEXT NOT NULL DEFAULT 'website',
    "campaign" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'NEW',
    "amount" DECIMAL(14,2),
    "propertyId" INTEGER,
    "projectId" INTEGER,
    "inquiryId" INTEGER,
    "projectLeadId" INTEGER,
    "followUpAt" TIMESTAMP(3),
    "visitAt" TIMESTAMP(3),
    "consentAt" TIMESTAMP(3),
    "importedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmActivity" (
    "id" SERIAL NOT NULL,
    "leadId" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "reference" TEXT,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CrmLead_inquiryId_key" ON "CrmLead"("inquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "CrmLead_projectLeadId_key" ON "CrmLead"("projectLeadId");

-- CreateIndex
CREATE INDEX "CrmLead_stage_followUpAt_idx" ON "CrmLead"("stage", "followUpAt");

-- CreateIndex
CREATE INDEX "CrmLead_phone_idx" ON "CrmLead"("phone");

-- CreateIndex
CREATE INDEX "CrmLead_type_source_idx" ON "CrmLead"("type", "source");

-- AddForeignKey
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "CrmLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve legacy enquiries and project leads in the unified CRM.
INSERT INTO "CrmLead" ("name","phone","email","type","interest","message","source","stage","propertyId","inquiryId","visitAt","createdAt","updatedAt")
SELECT COALESCE(u."name",u."email",'Customer'),i."phone",u."email",'PROPERTY',p."title",i."note",'website',CASE WHEN i."handled" THEN 'CONTACTED' ELSE 'NEW' END,p."id",i."id",i."visitAt",i."createdAt",i."updatedAt"
FROM "Inquiry" i JOIN "User" u ON u."id"=i."userId" JOIN "Property" p ON p."id"=i."propertyId";
INSERT INTO "CrmLead" ("name","phone","email","type","interest","message","source","campaign","stage","projectId","projectLeadId","visitAt","followUpAt","consentAt","createdAt","updatedAt")
SELECT l."name",l."phone",l."email",'PROJECT',p."name",l."pickupAddress",COALESCE(l."source",'website'),l."campaign",CASE WHEN l."stage"::text='BOOKED' THEN 'CONVERTED' WHEN l."stage"::text='VISIT_COMPLETED' THEN 'FOLLOW_UP' ELSE l."stage"::text END,p."id",l."id",l."visitAt",l."followUpAt",l."consentAt",l."createdAt",l."updatedAt"
FROM "ProjectLead" l JOIN "Project" p ON p."id"=l."projectId";
INSERT INTO "CrmActivity" ("leadId","body","createdAt") SELECT c."id",n."body",n."createdAt" FROM "LeadNote" n JOIN "CrmLead" c ON c."projectLeadId"=n."leadId";
