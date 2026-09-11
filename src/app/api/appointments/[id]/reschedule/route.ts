import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { verifyBookingAvailability } from "@/lib/booking-engine";
import { createNotification, getProviderUserId } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  const { id } = await params;

  let body: { startTime?: string; endTime?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { provider: { include: { policies: true } } },
  });

  if (!appointment || appointment.customerId !== session.user.id) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  const activeStatuses = ["PENDING", "PAYMENT_PENDING", "CONFIRMED", "CHECKED_IN", "RESCHEDULED"];
  if (!activeStatuses.includes(appointment.status)) {
    return NextResponse.json(
      { error: "This appointment cannot be rescheduled" },
      { status: 400 }
    );
  }

  // Respect provider reschedule policy
  const policy = appointment.provider.policies;
  if (policy && !policy.rescheduleAllowed) {
    return NextResponse.json(
      { error: "This provider does not allow rescheduling" },
      { status: 403 }
    );
  }

  const { startTime, endTime } = body;
  if (!startTime || !endTime) {
    return NextResponse.json(
      { error: "startTime and endTime are required" },
      { status: 400 }
    );
  }

  const newStart = new Date(startTime);
  const newEnd = new Date(endTime);
  if (isNaN(newStart.getTime()) || newEnd <= newStart) {
    return NextResponse.json({ error: "Invalid time" }, { status: 400 });
  }

  // Prevent rescheduling to past
  if (newStart < new Date()) {
    return NextResponse.json(
      { error: "Cannot reschedule to a past date" },
      { status: 400 }
    );
  }

  try {
    // Verify the new time is available (exclude this appointment from conflicts)
    const conflicts = await verifyBookingAvailability({
      providerId: appointment.providerId,
      serviceId: appointment.serviceId,
      startTime: newStart,
      endTime: newEnd,
      customerId: session.user.id,
    });

    if (!conflicts.valid) {
      return NextResponse.json(
        { error: conflicts.errors[0] || "Selected time is no longer available" },
        { status: 409 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Record original time if not already recorded
      const originalStart = appointment.originalStartTime || appointment.startTime;
      const originalEnd = appointment.originalEndTime || appointment.endTime;

      // Re-check conflict in transaction for safety
      const conflicting = await tx.appointment.findFirst({
        where: {
          providerId: appointment.providerId,
          id: { not: appointment.id },
          status: {
            in: ["PENDING", "PAYMENT_PENDING", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS", "RESCHEDULED"],
          },
          AND: [
            { startTime: { lt: newEnd } },
            { endTime: { gt: newStart } },
          ],
        },
      });
      if (conflicting) {
        throw new Error("SLOT_UNAVAILABLE");
      }

      const prevHistory = (appointment.rescheduleHistory as unknown as unknown[]) || [];

      const updatedAppt = await tx.appointment.update({
        where: { id },
        data: {
          startTime: newStart,
          endTime: newEnd,
          originalStartTime: originalStart,
          originalEndTime: originalEnd,
          status: "CONFIRMED",
          rescheduleCount: { increment: 1 },
          rescheduleHistory: [
            ...prevHistory,
            {
              from: { start: appointment.startTime, end: appointment.endTime },
              to: { start: newStart, end: newEnd },
              at: new Date(),
            },
          ] as never,
        },
      });

      await tx.appointmentHistory.create({
        data: {
          appointmentId: id,
          previousStatus: appointment.status,
          newStatus: "CONFIRMED",
          changedBy: "CUSTOMER",
          changedByName: session.user.name,
          action: "BOOKING_RESCHEDULED",
          metadata: { from: appointment.startTime, to: newStart },
        },
      });

      return updatedAppt;
    });

    // Notifications
    await createNotification({
      userId: session.user.id,
      type: "APPOINTMENT_RESCHEDULED",
      title: "Appointment rescheduled",
      message: `Your appointment is now scheduled for ${newStart.toLocaleString()}.`,
      relatedAppointmentId: id,
    });
    const providerUserId = await getProviderUserId(appointment.providerId);
    if (providerUserId) {
      await createNotification({
        userId: providerUserId,
        type: "APPOINTMENT_RESCHEDULED",
        title: "Appointment rescheduled",
        message: `${session.user.name} rescheduled ${appointment.bookingReference} to ${newStart.toLocaleString()}.`,
        relatedAppointmentId: id,
      });
    }

    return NextResponse.json({ appointment: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "SLOT_UNAVAILABLE") {
      return NextResponse.json(
        { error: "That time was just booked. Please select another." },
        { status: 409 }
      );
    }
    console.error("Reschedule error:", error);
    return NextResponse.json(
      { error: "Failed to reschedule. Please try again." },
      { status: 500 }
    );
  }
}