"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  ShieldCheck,
  Lock,
  Wallet,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  FileText,
  Building2,
  Smartphone,
  Nfc,
  ChevronRight,
} from "lucide-react";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/ui/avatar";

type AppointmentData = {
  id: string;
  bookingReference: string;
  startTime: Date;
  endTime: Date;
  status: string;
  customerName: string | null;
  customerPhone: string | null;
  customerNotes: string | null;
  service: {
    name: string;
    description: string | null;
    durationMinutes: number;
    price: number;
    depositAmount: number;
    paymentRequirement: string;
    currency: string;
  };
  provider: {
    id: string;
    businessName: string;
    profileImage: string | null;
    location: string | null;
    address: string | null;
    user: { name: string | null; image: string | null };
  };
  payments: {
    id: string;
    status: string;
    paymentType: string;
    amount: number;
  }[];
};

type PaymentMethod = "card" | "bank_transfer" | "ussd" | "mobile_money" | "wallet";

type PaymentOption = {
  id: PaymentMethod;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
};

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: "card",
    icon: <CreditCard className="h-5 w-5" />,
    title: "Card",
    subtitle: "Visa • Mastercard • Verve",
  },
  {
    id: "bank_transfer",
    icon: <Building2 className="h-5 w-5" />,
    title: "Bank Transfer",
    subtitle: "Pay directly from your bank account",
  },
  {
    id: "ussd",
    icon: <Smartphone className="h-5 w-5" />,
    title: "USSD",
    subtitle: "Pay using your bank's USSD code",
  },
  {
    id: "mobile_money",
    icon: <Nfc className="h-5 w-5" />,
    title: "Mobile Money",
    subtitle: "Pay using supported mobile-money providers",
  },
  {
    id: "wallet",
    icon: <Wallet className="h-5 w-5" />,
    title: "Wallet",
    subtitle: "Use your available wallet balance",
  },
];

function SuccessScreen({
  appointment,
  payAmount,
  paymentMethod,
}: {
  appointment: AppointmentData;
  payAmount: number;
  paymentMethod: PaymentMethod;
}) {
  const router = useRouter();

  const methodLabel = PAYMENT_OPTIONS.find((m) => m.id === paymentMethod)?.title || "Card";

  return (
    <div className="animate-scale-in flex flex-col items-center py-8 text-center">
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/15 animate-success-pulse">
          <CheckCircle2 className="h-14 w-14 text-emerald-400" />
        </div>
        <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
          ✓
        </div>
      </div>

      <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
        Booking Confirmed!
      </h1>
      <p className="mt-2 max-w-sm text-sm text-zinc-400">
        Your appointment has been successfully booked and payment received.
      </p>

      <div className="mt-8 w-full max-w-md">
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Booking Reference
            </span>
            <span className="rounded-lg bg-primary-soft px-3 py-1.5 font-mono text-sm font-bold text-primary">
              {appointment.bookingReference}
            </span>
          </div>

          <div className="h-px bg-border" />

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Avatar
                src={appointment.provider.profileImage || appointment.provider.user.image}
                name={appointment.provider.businessName}
                size={40}
              />
              <div className="text-left">
                <p className="font-semibold">{appointment.provider.businessName}</p>
                <p className="text-xs text-zinc-500">{appointment.service.name}</p>
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-zinc-400">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(appointment.startTime)}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatTime(appointment.startTime)} — {formatTime(appointment.endTime)}</span>
              </div>
              {(appointment.provider.location || appointment.provider.address) && (
                <div className="flex items-center gap-2 text-zinc-400">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{appointment.provider.address || appointment.provider.location}</span>
                </div>
              )}
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Amount paid</span>
              <span className="text-lg font-bold text-emerald-400">{formatCurrency(payAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Payment method</span>
              <span className="text-zinc-400">{methodLabel}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Status</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Confirmed
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => router.push("/appointments/" + appointment.id)}
          className="btn btn-primary px-6"
        >
          View Booking <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => router.push("/appointments")}
          className="btn btn-secondary px-6"
        >
          <FileText className="h-4 w-4" /> My Bookings
        </button>
      </div>

      <p className="mt-6 text-xs text-zinc-600">
        A confirmation email has been sent to your registered email address.
      </p>
    </div>
  );
}

function CardPaymentForm({
  cardNumber,
  setCardNumber,
  cardExpiry,
  setCardExpiry,
  cardCvv,
  setCardCvv,
  cardName,
  setCardName,
  saveCard,
  setSaveCard,
}: {
  cardNumber: string;
  setCardNumber: (v: string) => void;
  cardExpiry: string;
  setCardExpiry: (v: string) => void;
  cardCvv: string;
  setCardCvv: (v: string) => void;
  cardName: string;
  setCardName: (v: string) => void;
  saveCard: boolean;
  setSaveCard: (v: boolean) => void;
}) {
  function formatCardNumber(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  }

  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 2) {
      return digits.slice(0, 2) + " / " + digits.slice(2);
    }
    return digits;
  }

  function detectCardBrand(number: string) {
    const digits = number.replace(/\s/g, "");
    if (digits.startsWith("4")) return "Visa";
    if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "Mastercard";
    if (/^50[6-9]|^6[0-5]/.test(digits)) return "Verve";
    return null;
  }

  const brand = detectCardBrand(cardNumber);

  return (
    <div className="animate-fade-in space-y-4">
      <div>
        <label className="label">Card Number</label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="1234 5678 9012 3456"
            className="input pl-11 font-mono tracking-wider"
            maxLength={19}
          />
          <CreditCard className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          {brand && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded bg-surface-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {brand}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Expiry Date</label>
          <input
            type="text"
            inputMode="numeric"
            value={cardExpiry}
            onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
            placeholder="MM / YY"
            className="input font-mono"
            maxLength={7}
          />
        </div>
        <div>
          <label className="label">CVV</label>
          <div className="relative">
            <input
              type="password"
              inputMode="numeric"
              value={cardCvv}
              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="•••"
              className="input pl-11 font-mono"
              maxLength={4}
            />
            <Lock className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          </div>
        </div>
      </div>

      <div>
        <label className="label">Cardholder Name</label>
        <input
          type="text"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          placeholder="Name as it appears on your card"
          className="input"
        />
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface-2 p-3 transition-colors hover:border-primary/30">
        <input
          type="checkbox"
          checked={saveCard}
          onChange={(e) => setSaveCard(e.target.checked)}
          className="h-4 w-4 rounded border-border bg-surface accent-primary"
        />
        <span className="text-sm text-zinc-400">Save card for future bookings</span>
      </label>
    </div>
  );
}

export function CheckoutFlow({
  appointment,
  initialVerify,
}: {
  appointment: AppointmentData;
  initialVerify?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [paymentType, setPaymentType] = React.useState<
    "DEPOSIT" | "FULL_PAYMENT"
  >(
    appointment.service.paymentRequirement === "FULL_PAYMENT"
      ? "FULL_PAYMENT"
      : "DEPOSIT"
  );
  const [selectedMethod, setSelectedMethod] = React.useState<PaymentMethod>("card");
  const [initializing, setInitializing] = React.useState(false);
  const [verifying, setVerifying] = React.useState(Boolean(initialVerify));
  const [confirmed, setConfirmed] = React.useState(false);

  const [cardNumber, setCardNumber] = React.useState("");
  const [cardExpiry, setCardExpiry] = React.useState("");
  const [cardCvv, setCardCvv] = React.useState("");
  const [cardName, setCardName] = React.useState("");
  const [saveCard, setSaveCard] = React.useState(false);

  const { service, provider } = appointment;

  const depositAmount =
    service.depositAmount > 0 ? service.depositAmount : service.price;
  const fullAmount = service.price;
  const balanceDue = Math.max(fullAmount - depositAmount, 0);
  const bookingFee = 0;
  const discount = 0;

  const payAmount =
    paymentType === "DEPOSIT" ? depositAmount : fullAmount;
  const subtotal = service.price;
  const total = subtotal + bookingFee - discount;

  React.useEffect(() => {
    if (initialVerify && !confirmed) {
      (async () => {
        try {
          const res = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference: initialVerify }),
          });
          const data = await res.json();
          if (res.ok && data.payment?.status === "PAID") {
            toast("success", "Payment verified!", "Your appointment is confirmed.");
            setConfirmed(true);
          } else {
            toast("error", "Payment verification", data.error || "Could not verify payment.");
            setVerifying(false);
          }
        } catch {
          toast("error", "Something went wrong", "Please try again.");
          setVerifying(false);
        }
      })();
    }
  }, [initialVerify, confirmed, router, toast]);

  async function handlePay() {
    setInitializing(true);
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: appointment.id,
          paymentType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast("error", "Payment failed", data.error);
        setInitializing(false);
        return;
      }

      if (data.payment?.paymentUrl) {
        window.location.href = data.payment.paymentUrl;
        return;
      }

      const verifyRes = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: data.payment.reference }),
      });
      const verifyData = await verifyRes.json();
      if (verifyRes.ok && verifyData.payment?.status === "PAID") {
        toast("success", "Payment successful!", "Your appointment is confirmed.");
        setConfirmed(true);
      } else {
        toast("error", "Payment failed", verifyData.error || "Please try again.");
      }
    } catch {
      toast(
        "error",
        "Something went wrong",
        "Please check your internet connection and try again."
      );
    } finally {
      setInitializing(false);
      setVerifying(false);
    }
  }

  if (confirmed) {
    return (
      <SuccessScreen
        appointment={appointment}
        payAmount={payAmount}
        paymentMethod={selectedMethod}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Complete Your Booking
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Review your booking details and choose how to pay
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* ==================== LEFT: BOOKING SUMMARY ==================== */}
        <div className="space-y-5 lg:col-span-2">
          <div className="sticky top-24">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Booking Summary
            </h2>

            <div className="card space-y-4">
              <div className="flex items-center gap-4">
                <Avatar
                  src={provider.profileImage || provider.user.image}
                  name={provider.businessName}
                  size={56}
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-500">Service Provider</p>
                  <p className="truncate font-bold">{provider.businessName}</p>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div>
                <p className="text-xs font-medium text-zinc-500">Service</p>
                <p className="mt-0.5 font-semibold">{service.name}</p>
                {service.description && (
                  <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{service.description}</p>
                )}
              </div>

              <div className="h-px bg-border" />

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 shrink-0 text-primary" />
                  <span>{formatDate(appointment.startTime)}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 shrink-0 text-primary" />
                  <span>{formatTime(appointment.startTime)} — {formatTime(appointment.endTime)}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <span>{service.durationMinutes} minutes</span>
                </div>
                {(provider.location || provider.address) && (
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-4 w-4 shrink-0 text-primary" />
                    <span className="text-zinc-400">{provider.address || provider.location}</span>
                  </div>
                )}
              </div>

              {appointment.customerName && (
                <>
                  <div className="h-px bg-border" />
                  <div className="space-y-2 text-sm">
                    <p className="text-xs font-medium text-zinc-500">Customer</p>
                    <div className="flex items-center gap-2.5">
                      <User className="h-4 w-4 shrink-0 text-zinc-500" />
                      <span>{appointment.customerName}</span>
                    </div>
                    {appointment.customerPhone && (
                      <div className="flex items-center gap-2.5">
                        <Phone className="h-4 w-4 shrink-0 text-zinc-500" />
                        <span className="text-zinc-400">{appointment.customerPhone}</span>
                      </div>
                    )}
                    {appointment.customerNotes && (
                      <div className="flex items-start gap-2.5">
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                        <span className="text-zinc-500">{appointment.customerNotes}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="h-px bg-border" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {bookingFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Booking / service fee</span>
                    <span>{formatCurrency(bookingFee)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="h-px bg-border" />
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {service.depositAmount > 0 && service.paymentRequirement !== "FULL_PAYMENT" && (
                <>
                  <div className="h-px bg-border" />
                  <div className="rounded-xl bg-surface-2 p-3 text-xs text-zinc-400">
                    <p>
                      A deposit of <span className="font-semibold text-zinc-200">{formatCurrency(depositAmount)}</span> secures
                      your booking. Remaining balance of{" "}
                      <span className="font-semibold text-zinc-200">{formatCurrency(balanceDue)}</span> is
                      due before the appointment.
                    </p>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-3 py-2">
                <span className="text-xs font-medium text-zinc-500">Booking ref</span>
                <span className="font-mono text-xs font-bold text-zinc-300">
                  {appointment.bookingReference}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== RIGHT: PAYMENT ==================== */}
        <div className="space-y-5 lg:col-span-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              Secure Your Booking
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Choose your preferred payment method to confirm your reservation.
            </p>
          </div>

          {/* Payment type (deposit vs full) */}
          {service.paymentRequirement !== "FULL_PAYMENT" && service.depositAmount > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-zinc-500">Payment Option</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setPaymentType("DEPOSIT")}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    paymentType === "DEPOSIT"
                      ? "border-primary bg-primary-soft"
                      : "border-border bg-surface-2 hover:border-primary/40"
                  }`}
                >
                  <Wallet className="h-5 w-5 text-primary" />
                  <p className="mt-2 text-sm font-semibold">Pay deposit</p>
                  <p className="text-sm text-zinc-400">{formatCurrency(depositAmount)} now</p>
                  <p className="text-xs text-zinc-500">{formatCurrency(balanceDue)} later</p>
                </button>
                <button
                  onClick={() => setPaymentType("FULL_PAYMENT")}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    paymentType === "FULL_PAYMENT"
                      ? "border-primary bg-primary-soft"
                      : "border-border bg-surface-2 hover:border-primary/40"
                  }`}
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <p className="mt-2 text-sm font-semibold">Pay in full</p>
                  <p className="text-sm text-zinc-400">{formatCurrency(fullAmount)} now</p>
                  <p className="text-xs text-zinc-500">Nothing more to pay</p>
                </button>
              </div>
            </div>
          )}

          {/* Payment method selection */}
          <div className="card">
            <h3 className="text-sm font-semibold text-zinc-500">Payment Method</h3>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {PAYMENT_OPTIONS.map((option) => {
                const isSelected = selectedMethod === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setSelectedMethod(option.id)}
                    className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? "payment-card-active"
                        : "border-border bg-surface-2 hover:border-primary/30 hover:bg-surface"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        isSelected
                          ? "bg-primary/20 text-primary"
                          : "bg-surface text-zinc-500"
                      }`}
                    >
                      {option.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{option.title}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{option.subtitle}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="ml-auto mt-1 h-4 w-4 shrink-0 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card payment form */}
          {selectedMethod === "card" && (
            <div className="card">
              <h3 className="text-sm font-semibold text-zinc-500">Card Details</h3>
              <div className="mt-3">
                <CardPaymentForm
                  cardNumber={cardNumber}
                  setCardNumber={setCardNumber}
                  cardExpiry={cardExpiry}
                  setCardExpiry={setCardExpiry}
                  cardCvv={cardCvv}
                  setCardCvv={setCardCvv}
                  cardName={cardName}
                  setCardName={setCardName}
                  saveCard={saveCard}
                  setSaveCard={setSaveCard}
                />
              </div>
            </div>
          )}

          {/* Bank transfer info */}
          {selectedMethod === "bank_transfer" && (
            <div className="card animate-fade-in space-y-3">
              <h3 className="text-sm font-semibold text-zinc-500">Bank Transfer</h3>
              <div className="rounded-xl bg-surface-2 p-4 text-sm text-zinc-400">
                <p>After clicking &quot;Pay & Confirm&quot;, you will receive bank transfer details to complete your payment. Your booking will be confirmed once payment is received.</p>
              </div>
            </div>
          )}

          {/* USSD info */}
          {selectedMethod === "ussd" && (
            <div className="card animate-fade-in space-y-3">
              <h3 className="text-sm font-semibold text-zinc-500">USSD Payment</h3>
              <div className="rounded-xl bg-surface-2 p-4 text-sm text-zinc-400">
                <p>After clicking &quot;Pay & Confirm&quot;, you will receive a USSD code to dial on your phone to complete the payment.</p>
              </div>
            </div>
          )}

          {/* Mobile Money info */}
          {selectedMethod === "mobile_money" && (
            <div className="card animate-fade-in space-y-3">
              <h3 className="text-sm font-semibold text-zinc-500">Mobile Money</h3>
              <div className="rounded-xl bg-surface-2 p-4 text-sm text-zinc-400">
                <p>After clicking &quot;Pay & Confirm&quot;, you will be prompted to enter your mobile money details to complete the payment.</p>
              </div>
            </div>
          )}

          {/* Wallet info */}
          {selectedMethod === "wallet" && (
            <div className="card animate-fade-in space-y-3">
              <h3 className="text-sm font-semibold text-zinc-500">Wallet Payment</h3>
              <div className="rounded-xl bg-surface-2 p-4 text-sm text-zinc-400">
                <p>Your wallet balance will be used to pay for this booking. Ensure you have sufficient funds.</p>
              </div>
            </div>
          )}

          {/* CTA + Security */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">Amount to pay</p>
                <p className="text-2xl font-bold">{formatCurrency(payAmount)}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-zinc-500">
                <Lock className="h-3.5 w-3.5" /> Secure payment
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={initializing || verifying}
              className="btn btn-primary mt-4 w-full py-3.5 text-base"
            >
              {verifying || initializing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  Pay {formatCurrency(payAmount)} & Confirm Booking
                </>
              )}
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-zinc-500">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              Secure checkout. Your payment is processed by our trusted payment provider.
            </div>

            <div className="mt-3 flex items-center justify-center gap-4">
              <div className="flex items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                <CreditCard className="h-3 w-3" /> Visa
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                <CreditCard className="h-3 w-3" /> Mastercard
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                <CreditCard className="h-3 w-3" /> Verve
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
