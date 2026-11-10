import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const names = [
  "Sharma Uncle", "Priya Mehta", "Rohit Verma", "Anjali Gupta", "Vikram Singh",
  "Neha Kapoor", "Arjun Nair", "Kavya Iyer", "Rahul Jain", "Sneha Reddy",
  "Amit Patel", "Pooja Malhotra", "Karan Bansal", "Divya Agarwal", "Sanjay Rao",
  "Meera Joshi", "Aditya Kulkarni", "Ritu Saxena", "Manish Chawla", "Tanvi Desai",
];
const relations = ["family", "friend", "colleague", "other"];
const statuses = ["attending", "declined", "maybe"];

async function main() {
  // Re-runnable: wipe demo data first. Cascades remove events, guests, RSVPs.
  await prisma.wedding.deleteMany({ where: { name: "Demo: Priya & Rohit" } });

  const wedding = await prisma.wedding.create({
    data: {
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
