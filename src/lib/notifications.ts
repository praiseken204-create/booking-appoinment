import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/generated/prisma/client";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedAppointmentId?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  const preferences = await prisma.notificationPreference.findUnique({
    where: { userId: input.userId },
  });

  if (preferences && !preferences.inApp) return null;

  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      relatedAppointmentId: input.relatedAppointmentId,
    },
  });
}

/**
 * Get a provider's user id from a provider profile id.
 */
export async function getProviderUserId(providerId: string): Promise<string | null> {
  const profile = await prisma.providerProfile.findUnique({
    where: { id: providerId },
    select: { userId: true },
  });
  return profile?.userId ?? null;
}
