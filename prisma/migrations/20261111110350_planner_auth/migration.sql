/*
  Warnings:

  - Added the required column `plannerId` to the `Wedding` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Planner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plannerId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "Session_plannerId_fkey" FOREIGN KEY ("plannerId") REFERENCES "Planner" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Wedding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plannerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "rsvpDeadline" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Wedding_plannerId_fkey" FOREIGN KEY ("plannerId") REFERENCES "Planner" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Wedding" ("city", "createdAt", "id", "name", "rsvpDeadline") SELECT "city", "createdAt", "id", "name", "rsvpDeadline" FROM "Wedding";
DROP TABLE "Wedding";
ALTER TABLE "new_Wedding" RENAME TO "Wedding";
CREATE INDEX "Wedding_plannerId_idx" ON "Wedding"("plannerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Planner_email_key" ON "Planner"("email");

-- CreateIndex
CREATE INDEX "Session_plannerId_idx" ON "Session"("plannerId");
