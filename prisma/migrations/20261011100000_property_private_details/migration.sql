CREATE TABLE "PropertyPrivateDetails" (
  "propertyId" INTEGER NOT NULL,
  "remarks" TEXT NOT NULL,
  CONSTRAINT "PropertyPrivateDetails_pkey" PRIMARY KEY ("propertyId"),
  CONSTRAINT "PropertyPrivateDetails_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
