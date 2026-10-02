-- CreateEnum
CREATE TYPE "TokenKind" AS ENUM ('VERIFY', 'RESET');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email" TEXT,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "passwordHash" TEXT,
ALTER COLUMN "phone" DROP NOT NULL;

-- CreateTable
CREATE TABLE "EmailToken" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "kind" "TokenKind" NOT NULL,
    "hash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailToken_hash_key" ON "EmailToken"("hash");

-- CreateIndex
CREATE INDEX "EmailToken_userId_kind_idx" ON "EmailToken"("userId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- AddForeignKey
ALTER TABLE "EmailToken" ADD CONSTRAINT "EmailToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

