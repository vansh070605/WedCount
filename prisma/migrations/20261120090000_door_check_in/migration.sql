-- CreateTable
CREATE TABLE "Arrival" (
    "guestId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "people" INTEGER NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Arrival_pkey" PRIMARY KEY ("guestId","eventId"),
    CONSTRAINT "Arrival_people_check" CHECK ("people" >= 0)
);

-- CreateIndex
CREATE INDEX "Arrival_eventId_idx" ON "Arrival"("eventId");

-- AddForeignKey
ALTER TABLE "Arrival" ADD CONSTRAINT "Arrival_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arrival" ADD CONSTRAINT "Arrival_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

