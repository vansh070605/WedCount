import { prisma } from "@/lib/db";
import { inviteCard, ogSize } from "@/app/ui/invite-og";

export const alt = "Wedding invitation";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const w = await prisma.wedding.findUnique({
    where: { joinCode: code },
    include: { events: { orderBy: { startsAt: "asc" }, select: { name: true, startsAt: true } } },
  });
  return inviteCard(w ?? { name: "A wedding", city: null, theme: "royal", brideName: null, groomName: null }, w?.events ?? []);
}
