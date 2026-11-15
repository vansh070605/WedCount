import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";
import { newGuestToken } from "../lib/guests";
import { predictEvent } from "../lib/predict";

const prisma = new PrismaClient();

// Local demo login only. Never use these values outside a dev database.
export const DEMO_EMAIL = "demo@wedcount.test";
export const DEMO_PASSWORD = "demo-planner-123";

const names = [
  "Sharma Uncle", "Priya Mehta", "Rohit Verma", "Anjali Gupta", "Vikram Singh",
  "Neha Kapoor", "Arjun Nair", "Kavya Iyer", "Rahul Jain", "Sneha Reddy",
  "Amit Patel", "Pooja Malhotra", "Karan Bansal", "Divya Agarwal", "Sanjay Rao",
  "Meera Joshi", "Aditya Kulkarni", "Ritu Saxena", "Manish Chawla", "Tanvi Desai",
];
const relations = ["family", "friend", "colleague", "other"];
const statuses = ["attending", "declined", "maybe"];

async function main() {
  // Re-runnable: wipe the demo planner first. Cascades remove weddings, events, guests, RSVPs.
  await prisma.planner.deleteMany({ where: { email: DEMO_EMAIL } });
  const planner = await prisma.planner.create({
    data: { email: DEMO_EMAIL, name: "Demo Planner", passwordHash: await hashPassword(DEMO_PASSWORD) },
  });

  const wedding = await prisma.wedding.create({
    data: {
      plannerId: planner.id,
      name: "Demo: Priya & Rohit",
      city: "Jaipur",
      rsvpDeadline: new Date("2026-12-01T00:00:00+05:30"),
      events: {
        create: [
          { name: "Haldi", startsAt: new Date("2026-12-10T10:00:00+05:30"), venue: "Family home" },
          { name: "Sangeet", startsAt: new Date("2026-12-10T19:00:00+05:30"), venue: "Rambagh Lawns" },
          { name: "Wedding", startsAt: new Date("2026-12-11T20:00:00+05:30"), venue: "Rambagh Lawns" },
        ],
      },
    },
    include: { events: true },
  });

  for (const [i, name] of names.entries()) {
    const guest = await prisma.guest.create({
      data: {
        weddingId: wedding.id,
        name,
        phone: `+9198${String(10000000 + i).padStart(8, "0")}`,
        side: i % 2 === 0 ? "bride" : "groom",
        relation: relations[i % relations.length],
        token: newGuestToken(),
        // Mix for the Reminders demo: invited 0-3 days ago, every 5th guest not invited yet.
        invitedAt: i % 5 === 4 ? null : new Date(Date.now() - (i % 4) * 24 * 60 * 60 * 1000),
      },
    });

    // Every 4th guest has not replied yet: no RSVP rows.
    if (i % 4 === 3) continue;

    for (const event of wedding.events) {
      const status = statuses[(i + event.name.length) % statuses.length];
      const people = status === "declined" ? 0 : 1 + (i % 4);
      const veg = Math.ceil(people / 2);
      await prisma.rsvp.create({
        data: {
          guestId: guest.id,
          eventId: event.id,
          status,
          vegCount: veg,
          nonVegCount: people - veg,
          arrivalTime: status === "declined" ? null : event.startsAt,
        },
      });
    }
  }

  const counts = {
    events: await prisma.event.count({ where: { weddingId: wedding.id } }),
    guests: await prisma.guest.count({ where: { weddingId: wedding.id } }),
    rsvps: await prisma.rsvp.count({ where: { guest: { weddingId: wedding.id } } }),
  };
  console.log("Seeded", counts);

  await seedPastWedding(planner.id);
}

// A finished wedding with recorded turnout, so the demo planner's predictions have history to calibrate on.
// Its guests came at about 80% of what the starting assumptions predict.
async function seedPastWedding(plannerId: string) {
  const past = await prisma.wedding.create({
    data: {
      plannerId,
      name: "Demo (past): Ananya & Kabir",
      city: "Udaipur",
      rsvpDeadline: new Date("2025-02-01T23:59:59+05:30"),
      events: {
        create: [
          { name: "Sangeet", startsAt: new Date("2025-02-14T19:00:00+05:30"), venue: "Lake Pichola Lawns" },
          { name: "Wedding", startsAt: new Date("2025-02-15T20:00:00+05:30"), venue: "Lake Pichola Lawns" },
        ],
      },
    },
    include: { events: true },
  });

  for (let i = 0; i < 60; i++) {
    const guest = await prisma.guest.create({
      data: {
        weddingId: past.id,
        name: `Past Guest ${i + 1}`,
        phone: `+9197${String(10000000 + i).padStart(8, "0")}`,
        side: i % 2 ? "groom" : "bride",
        relation: relations[i % relations.length],
        token: newGuestToken(),
        invitedAt: new Date("2025-01-10T10:00:00+05:30"),
      },
    });
    if (i % 6 === 5) continue; // never replied
    for (const event of past.events) {
      const status = i % 7 === 0 ? "declined" : i % 5 === 0 ? "maybe" : "attending";
      const people = status === "declined" ? 0 : 1 + (i % 3);
      await prisma.rsvp.create({
        data: { guestId: guest.id, eventId: event.id, status, vegCount: people, nonVegCount: 0 },
      });
    }
  }

  const guests = await prisma.guest.findMany({ where: { weddingId: past.id }, select: { relation: true, rsvps: true } });
  for (const event of past.events) {
    const actualCount = Math.round(predictEvent(event.id, guests).expected * 0.8);
    await prisma.event.update({ where: { id: event.id }, data: { actualCount } });
  }
  console.log("Seeded past wedding with turnout for calibration");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
