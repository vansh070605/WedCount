import { prisma } from "@/lib/db";
import { invitedEvents } from "@/lib/rsvp";
import { inviteCard, ogSize } from "@/app/ui/invite-og";

export const alt = "Wedding invitation";
export const size = ogSize;
export const contentType = "image/png";

// The guest's own functions only, so a Sangeet-only guest's preview doesn't list the Haldi.
export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const g = await prisma.guest.findUnique({
    where: { token },
    select: {
      invitations: { select: { eventId: true } },
      wedding: { include: { events: { orderBy: { startsAt: "asc" }, select: { id: true, name: true, startsAt: true } } } },
    },
  });
  if (!g) return inviteCard({ name: "A wedding", city: null, theme: "royal", brideName: null, groomName: null }, []);
  return inviteCard(g.wedding, invitedEvents(g, g.wedding.events));
}
