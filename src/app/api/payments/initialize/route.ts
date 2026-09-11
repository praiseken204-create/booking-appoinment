import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getPaymentProvider } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: { bookingId?: string; paymentType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { bookingId, paymentType } = body;
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      provider: { include: { user: true } },
      payments: true,
    },
  });

  if (!appointment || appointment.customerId !== session.user.id) {
    return NextResponse.json(
      { error: "Booking not found" },
      { status: 404 }
    );
  }

  // Determine amount to pay
  const service = appointment.service;
  const validType = ["FULL_PAYMENT", "DEPOSIT"] as const;
  const type = validType.includes(paymentType as never)
    ? (paymentType as "FULL_PAYMENT" | "DEPOSIT")
    : service.paymentRequirement === "FULL_PAYMENT"
      ? "FULL_PAYMENT"
      : service.paymentRequirement === "DEPOSIT"
        ? "DEPOSIT"
        : "FULL_PAYMENT";

  let amount: number;
  if (type === "DEPOSIT") {
    amount = service.depositAmount > 0 ? service.depositAmount : service.price;
  } else {
    amount = service.price;
  }

  // Prevent duplicate payments for same appointment+type+already paid
  const alreadyPaid = appointment.payments.some(
    (p) => p.paymentType === type && p.status === "PAID"
  );
  if (alreadyPaid) {
    return NextResponse.json(
      { error: "This payment has already been completed." },
      { status: 409 }
    );
  }

  // Best effort price check to prevent tampering
  if (type === "DEPOSIT" && amount !== service.depositAmount) {
    amount = service.depositAmount;
  }
  if (type === "FULL_PAYMENT" && amount !== service.price) {
    amount = service.price;
  }

  const reference = `PAY-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`.toUpperCase();

  const payment = await prisma.payment.create({
    data: {
      appointmentId: appointment.id,
      customerId: session.user.id,
      providerId: appointment.providerId,
      amount,
      currency: service.currency,
      paymentProvider: process.env.PAYMENT_PROVIDER || "mock",
      transactionReference: reference,
      paymentType: type,
      status: "PENDING",
    },
  });

  const provider = getPaymentProvider();

  try {
    const init = await provider.initialize({
      amount,
      currency: service.currency,
      email: session.user.email || "",
      reference,
      metadata: {
        bookingId: appointment.bookingReference,
        description: `${service.name} - ${appointment.bookingReference}`,
        redirect_url: request.headers.get("origin")
          ? `${request.headers.get("origin")}/checkout?booking=${appointment.id}&verify=${reference}`
          : undefined,
      },
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "PROCESSING", providerReference: init.reference },
    });

    return NextResponse.json({
      payment: {
        id: payment.id,
        reference: init.reference,
        amount,
        paymentType: type,
        paymentUrl: init.paymentUrl,
      },
    });
  } catch (error) {
    console.error("Payment init error:", error);
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json(
      { error: "Payment could not be initialized. Please try again." },
      { status: 502 }
    );
  }
}