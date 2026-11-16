-- AlterTable
ALTER TABLE "Wedding" ADD COLUMN     "blessing" TEXT,
ADD COLUMN     "brideName" TEXT,
ADD COLUMN     "brideParents" TEXT,
ADD COLUMN     "groomName" TEXT,
ADD COLUMN     "groomParents" TEXT,
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'royal';

