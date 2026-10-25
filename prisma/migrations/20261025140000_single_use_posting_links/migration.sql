ALTER TABLE "PostingLink" ADD COLUMN "usedAt" TIMESTAMP(3);

-- Existing links which already received a property are also considered used.
UPDATE "PostingLink" AS link
SET "usedAt" = submitted."firstSubmission"
FROM (
  SELECT "linkId", MIN("createdAt") AS "firstSubmission"
  FROM "PropertySubmission"
  GROUP BY "linkId"
) AS submitted
WHERE link."id" = submitted."linkId";
