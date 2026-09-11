import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getPaymentProvider } from "@/lib/payments";
import {
  createNotification,
  getProviderUserId,
} from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: { reference?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { reference } = body;
  if (!reference) {
    return NextResponse.json({ error: "reference is required" }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({
    where: { transactionReference: reference },
    include: {
      appointment: { include: { service: true, provider: true } },
    },
  });

  if (!payment || payment.customerId !== session.user.id) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (payment.status === "PAID") {
    return NextResponse.json({
      payment: { status: "PAID", reference: payment.transactionReference },
      appointment: { id: payment.appointmentId, status: "CONFIRMED" },
    });
  }

  // Verify server-side with the payment provider
  const provider = getPaymentProvider();
  try {
    const result = await provider.verify(reference);

    if (result.paid) {
      const updated = await prisma.$transaction(async (tx) => {
        const p = await tx.payment.update({
          where: { id: payment.id },
          data: { status: "PAID", paidAt: new Date() },
        });

        // Determine if the appointment can be fully confirmed.
        // If the service requires full payment and it's now paid, confirm.
        // If deposit paid, confirm (deposit secures the slot).
        const appointment = await tx.appointment.update({
          where: { id: payment.appointmentId },
          data: { status: "CONFIRMED" },
        });

        // Record history
        await tx.appointmentHistory.create({
          data: {
            appointmentId: appointment.id,
            previousStatus: "PAYMENT_PENDING",
            newStatus: "CONFIRMED",
            changedBy: "SYSTEM",
            changedByName: "Payment verified",
            action: "PAYMENT_RECEIVED",
            metadata: {
              paymentId: p.id,
              transactionReference: p.transactionReference,
              amount: p.amount,
            },
          },
        });

        return { appointment, payment: p };
      });

      // Notifications
      await createNotification({
        userId: session.user.id,
        type: "PAYMENT_SUCCESSFUL",
        title: "Payment successful",
        message: `Your payment of ${payment.amount} was successful. Your appointment is confirmed (${updated.appointment.bookingReference}).`,
        relatedAppointmentId: updated.appointment.id,
      });

      const providerUserId = await getProviderUserId(payment.providerId);
      if (providerUserId) {
        await createNotification({
          userId: providerUserId,
          type: "BOOKING_CONFIRMATION",
          title: "Booking confirmed",
          message: `${session.user.name}'s payment is confirmed for ${updated.appointment.bookingReference}.`,
          relatedAppointmentId: updated.appointment.id,
        });
      }

      return NextResponse.json({
        payment: {
          status: "PAID",
          reference: payment.transactionReference,
          amount: payment.amount,
        },
        appointment: {
          id: updated.appointment.id,
          bookingReference: updated.appointment.bookingReference,
          status: updated.appointment.status,
        },
      });
    }

    // Not paid
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
    await createNotification({
      userId: session.user.id,
      type: "PAYMENT_FAILED",
      title: "Payment failed",
      message: "Your payment could not be completed. Please try again.",
      relatedAppointmentId: payment.appointmentId,
    });
    return NextResponse.json(
      { error: "Your payment could not be completed. Please try again." },
      { status: 402 }
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Payment verification failed. Please try again." },
      { status: 502 }
    );
  }
}