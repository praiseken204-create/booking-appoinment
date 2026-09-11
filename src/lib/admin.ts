import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (session.user.role !== "ADMIN") return null;

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  return { session, profile: admin };
}