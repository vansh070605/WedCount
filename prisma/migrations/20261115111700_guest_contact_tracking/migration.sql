-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Guest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weddingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedAt" DATETIME,
    "remindedAt" DATETIME,
    "reminderCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Guest_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Guest" ("createdAt", "id", "name", "phone", "relation", "side", "token", "weddingId") SELECT "createdAt", "id", "name", "phone", "relation", "side", "token", "weddingId" FROM "Guest";
DROP TABLE "Guest";
ALTER TABLE "new_Guest" RENAME TO "Guest";
CREATE UNIQUE INDEX "Guest_token_key" ON "Guest"("token");
CREATE INDEX "Guest_weddingId_idx" ON "Guest"("weddingId");
CREATE UNIQUE INDEX "Guest_weddingId_phone_key" ON "Guest"("weddingId", "phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
