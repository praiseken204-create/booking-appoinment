import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { verifyBookingAvailability, rangesOverlap } from "@/lib/booking-engine";
import { generateBookingReference } from "@/lib/format";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: {
    providerId?: string;
    serviceId?: string;
    startTime?: string;
    endTime?: string;
    customerName?: string;
    customerPhone?: string;
    customerNotes?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { providerId, serviceId, startTime, endTime, customerName, customerPhone, customerNotes } =
    body;

  if (!providerId || !serviceId || !startTime || !endTime) {
    return NextResponse.json(
      { error: "Missing required booking fields" },
      { status: 400 }
    );
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return NextResponse.json({ error: "Invalid appointment time" }, { status: 400 });
  }

  try {
    // Authoritative availability check (with double-booking prevention)
    const check = await verifyBookingAvailability({
      providerId,
      serviceId,
      startTime: start,
      endTime: end,
      customerId: session.user.id,
    });

    if (!check.valid) {
      return NextResponse.json(
        { error: check.errors[0] || "This slot is no longer available" },
        { status: 409 }
      );
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const reference = generateBookingReference();

    // Use a transaction to atomically insert the appointment and re-check conflicts.
    // SQLite serializes writes, and we rely on the DB-level check within the tx.
    const booking = await prisma.$transaction(async (tx) => {
      // Re-check for overlapping appointments inside the transaction
      const conflicting = await tx.appointment.findFirst({
        where: {
          providerId,
          status: {
            in: ["PENDING", "PAYMENT_PENDING", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS", "RESCHEDULED"],
          },
          AND: [
            { startTime: { lt: end } },
            { endTime: { gt: start } },
          ],
        },
      });

      if (conflicting) {
        throw new Error("SLOT_UNAVAILABLE");
      }

      const created = await tx.appointment.create({
        data: {
          bookingReference: reference,
          customerId: session.user.id,
          providerId,
          serviceId,
          startTime: start,
          endTime: end,
          customerName: customerName || session.user.name,
          customerPhone: customerPhone || null,
          customerNotes: customerNotes || null,
          status: "PAYMENT_PENDING",
          history: {
            create: {
              action: "BOOKING_CREATED",
              newStatus: "PAYMENT_PENDING",
              changedBy: "CUSTOMER",
              changedByName: session.user.name,
              metadata: { bookingReference: reference },
            },
          },
        },
      });

      return created;
    });

    // Notify provider
    const providerProfile = await prisma.providerProfile.findUnique({
      where: { id: providerId },
    });
    if (providerProfile) {
      await createNotification({
        userId: providerProfile.userId,
        type: "BOOKING_CONFIRMATION",
        title: "New booking request",
        message: `${session.user.name} requested ${service.name} on ${start.toDateString()} at ${start.toLocaleTimeString()}.`,
        relatedAppointmentId: booking.id,
      });
    }

    return NextResponse.json(
      {
        booking: {
          id: booking.id,
          bookingReference: booking.bookingReference,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create appointment";
    if (message === "SLOT_UNAVAILABLE") {
      return NextResponse.json(
        { error: "This time slot was just booked. Please select another available time." },
        { status: 409 }
      );
    }
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}