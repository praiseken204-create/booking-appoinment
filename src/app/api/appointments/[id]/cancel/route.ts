import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
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

  let body: { reason?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      service: true,
      provider: { include: { policies: true } },
      payments: true,
    },
  });

  if (!appointment || appointment.customerId !== session.user.id) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  const activeStatuses = ["PENDING", "PAYMENT_PENDING", "CONFIRMED", "CHECKED_IN", "RESCHEDULED"];
  if (!activeStatuses.includes(appointment.status)) {
    return NextResponse.json(
      { error: "This appointment can no longer be cancelled" },
      { status: 400 }
    );
  }

  const policy = appointment.provider.policies;
  const hoursUntil = (appointment.startTime.getTime() - Date.now()) / 3600000;

  // Determine refund status
  let refundStatus = "NON_REFUNDABLE";
  let refundAmount = 0;
  let message = "This booking is non-refundable.";

  const hoursToConfirm = policy?.freeCancelHours ?? 24;
  const nonRefundableHours = policy?.nonRefundableHours ?? 2;

  if (hoursUntil >= hoursToConfirm) {
    refundStatus = "FREE_CANCELLATION";
    refundAmount = appointment.payments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + p.amount, 0);
    message = "Full refund will be issued.";
  } else if (hoursUntil >= nonRefundableHours) {
    refundStatus = "LATE_CANCELLATION";
    const paid = appointment.payments.filter((p) => p.status === "PAID");
    refundAmount = paid
      .map((p) => p.amount - (policy?.lateCancelFee ?? 0))
      .filter((a) => a > 0)
      .reduce((a, b) => a + b, 0);
    message = `A cancellation fee of ${policy?.lateCancelFee ?? 0} applies.`;
  }

  try {
    const cancelled = await prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: body.reason || null,
        },
      });

      await tx.appointmentHistory.create({
        data: {
          appointmentId: id,
          previousStatus: appointment.status,
          newStatus: "CANCELLED",
          changedBy: "CUSTOMER",
          changedByName: session.user.name,
          action: "BOOKING_CANCELLED",
          metadata: { reason: body.reason || null, refundStatus },
        },
      });

      // If refund applies, mark paid payments as refunded
      if (refundAmount > 0) {
        const paidPayments = await tx.payment.findMany({
          where: { appointmentId: id, status: "PAID" },
        });
        for (const p of paidPayments) {
          await tx.payment.update({
            where: { id: p.id },
            data: { status: "REFUNDED", refundAmount: p.amount },
          });
        }
      }

      return updated;
    });

    await createNotification({
      userId: session.user.id,
      type: "APPOINTMENT_CANCELLED",
      title: "Appointment cancelled",
      message: `${appointment.bookingReference} has been cancelled. ${message}`,
      relatedAppointmentId: id,
    });
    const providerUserId = await getProviderUserId(appointment.providerId);
    if (providerUserId) {
      await createNotification({
        userId: providerUserId,
        type: "APPOINTMENT_CANCELLED",
        title: "Appointment cancelled",
        message: `${session.user.name} cancelled ${appointment.bookingReference}.`,
        relatedAppointmentId: id,
      });
    }

    return NextResponse.json({
      appointment: cancelled,
      refund: { status: refundStatus, amount: refundAmount, message },
    });
  } catch (error) {
    console.error("Cancellation error:", error);
    return NextResponse.json(
      { error: "Failed to cancel appointment. Please try again." },
      { status: 500 }
    );
  }
}