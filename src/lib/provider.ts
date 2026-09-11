import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function getCurrentProvider() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const profile = await prisma.providerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) return null;
  return { session, profile };
}
