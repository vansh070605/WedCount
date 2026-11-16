-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Planner" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "failedLogins" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Planner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "plannerId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wedding" (
    "id" TEXT NOT NULL,
    "plannerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "rsvpDeadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "actualCount" INTEGER,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitedAt" TIMESTAMP(3),
    "remindedAt" TIMESTAMP(3),
    "reminderCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rsvp" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "vegCount" INTEGER NOT NULL DEFAULT 0,
    "nonVegCount" INTEGER NOT NULL DEFAULT 0,
    "arrivalTime" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rsvp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Planner_email_key" ON "Planner"("email");

-- CreateIndex
CREATE INDEX "Session_plannerId_idx" ON "Session"("plannerId");

-- CreateIndex
CREATE INDEX "Wedding_plannerId_idx" ON "Wedding"("plannerId");

-- CreateIndex
CREATE INDEX "Event_weddingId_idx" ON "Event"("weddingId");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_token_key" ON "Guest"("token");

-- CreateIndex
CREATE INDEX "Guest_weddingId_idx" ON "Guest"("weddingId");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_weddingId_phone_key" ON "Guest"("weddingId", "phone");

-- CreateIndex
CREATE INDEX "Rsvp_eventId_idx" ON "Rsvp"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Rsvp_guestId_eventId_key" ON "Rsvp"("guestId", "eventId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_plannerId_fkey" FOREIGN KEY ("plannerId") REFERENCES "Planner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wedding" ADD CONSTRAINT "Wedding_plannerId_fkey" FOREIGN KEY ("plannerId") REFERENCES "Planner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rsvp" ADD CONSTRAINT "Rsvp_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rsvp" ADD CONSTRAINT "Rsvp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

