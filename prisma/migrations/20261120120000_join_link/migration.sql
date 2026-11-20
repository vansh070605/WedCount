-- AlterTable
ALTER TABLE "Wedding" ADD COLUMN     "joinCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Wedding_joinCode_key" ON "Wedding"("joinCode");

