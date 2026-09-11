import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

function isProviderAction(action: string) {
  return ["CONFIRM", "COMPLETE", "NO_SHOW", "CANCEL"].includes(action);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  const { id } = await params;

  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { action } = body;
  if (!action || !isProviderAction(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Verify provider owns this appointment
  const profile = await prisma.providerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { customer: { select: { id: true, name: true } } },
  });

  if (!appointment || appointment.providerId !== profile.id) {
    return NextResponse.json(
      { error: "Appointment not found" },
      { status: 404 }
    );
  }

  let newStatus: string | null = null;

  switch (action) {
    case "CONFIRM":
      if (appointment.status !== "PENDING" && appointment.status !== "PAYMENT_PENDING") {
        return NextResponse.json(
          { error: "Only pending appointments can be confirmed" },
          { status: 400 }
        );
      }
      newStatus = "CONFIRMED";
      break;
    case "COMPLETE":
      if (appointment.status !== "CONFIRMED" && appointment.status !== "CHECKED_IN" && appointment.status !== "IN_PROGRESS") {
        return NextResponse.json(
          { error: "Appointment must be in progress to complete" },
          { status: 400 }
        );
      }
      newStatus = "COMPLETED";
      break;
    case "NO_SHOW":
      if (!["CONFIRMED", "CHECKED_IN", "IN_PROGRESS"].includes(appointment.status)) {
        return NextResponse.json(
          { error: "Cannot mark as no-show from this status" },
          { status: 400 }
        );
      }
      newStatus = "NO_SHOW";
      break;
    case "CANCEL":
      if (["COMPLETED", "CANCELLED", "NO_SHOW"].includes(appointment.status)) {
        return NextResponse.json(
          { error: "Appointment already finalized" },
          { status: 400 }
        );
      }
      newStatus = "CANCELLED";
      break;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const appt = await tx.appointment.update({
      where: { id },
      data: {
        status: newStatus as never,
        ...(newStatus === "CANCELLED" ? { cancelledAt: new Date() } : {}),
      },
    });
    await tx.appointmentHistory.create({
      data: {
        appointmentId: id,
        previousStatus: appointment.status,
        newStatus: newStatus as never,
        changedBy: "PROVIDER",
        changedByName: profile.businessName,
        action: `PROVIDER_${action}`,
      },
    });
    return appt;
  });

  // Notify customer
  await createNotification({
    userId: appointment.customerId,
    type: "BOOKING_UPDATED",
    title: "Booking updated",
    message: `Your appointment ${appointment.bookingReference} was ${newStatus?.toLowerCase().replace("_", " ")} by the provider.`,
    relatedAppointmentId: id,
  });

  return NextResponse.json({ appointment: updated });
}