"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  CheckCircle2,
  CalendarX,
} from "lucide-react";
import { formatCurrency, minutesToTime } from "@/lib/format";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/ui/avatar";

type ProviderData = {
  id: string;
  businessName: string;
  profileImage: string | null;
  user: { name: string | null; image: string | null };
  services: ServiceData[];
  policies: { rescheduleAllowed: boolean } | null;
};

type ServiceData = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  depositAmount: number;
  paymentRequirement: string;
  currency: string;
};

interface Slot {
  start: string;
  end: string;
  available: boolean;
}

export function BookingWizard({
  provider,
  initialServiceId,
}: {
  provider: ProviderData;
  initialServiceId?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = React.useState(1);
  const [service, setService] = React.useState<ServiceData | undefined>(
    provider.services.find((s) => s.id === initialServiceId) ||
      provider.services[0]
  );
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [slots, setSlots] = React.useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = React.useState(false);
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calendar state
  const [viewMonth, setViewMonth] = React.useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const daysInMonth = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth() + 1,
    0
  ).getDate();
  const firstDay = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth(),
    1
  ).getDay();

  const isDateDisabled = (date: Date) => {
    return date < today;
  };

  function selectService(s: ServiceData) {
    setService(s);
    setSelectedDate(null);
    setSelectedSlot(null);
    setStep(2);
  }

  async function loadSlots(date: Date) {
    if (!service) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    const dateStr = date.toISOString().split("T")[0];
    try {
      const res = await fetch(
        `/api/slots?providerId=${provider.id}&serviceId=${service.id}&date=${dateStr}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (res.ok) {
        setSlots(data.slots || []);
        setSelectedDate(date);
      } else {
        toast("error", "Couldn't load availability", data.error);
        setSlots([]);
      }
    } catch {
      toast(
        "error",
        "Something went wrong",
        "Please check your internet connection and try again."
      );
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  function formatMin(min: number) {
    return minutesToTime(min);
  }

  async function submitBooking() {
    if (!service || !selectedDate || !selectedSlot) return;
    const slot = slots.find((s) => s.start === selectedSlot);
    if (!slot) return;

    setSubmitting(true);
    const startTime = combineDate(selectedDate, slot.start);
    const endTime = combineDate(selectedDate, slot.end);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: provider.id,
          serviceId: service.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          customerName,
          customerPhone,
          customerNotes: notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast("error", "Couldn't book", data.error);
        setSubmitting(false);
        return;
      }

      toast("success", "Appointment created", data.booking.bookingReference);
      router.push(`/checkout?booking=${data.booking.id}`);
    } catch {
      toast(
        "error",
        "Something went wrong",
        "Please check your internet connection and try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {["Service", "Date", "Time", "Details"].map((label, i) => {
          const n = i + 1;
          const active = step === n;
          const done = step > n;
          return (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  done
                    ? "bg-emerald-500/20 text-emerald-400"
                    : active
                      ? "bg-primary text-white"
                      : "bg-surface-2 text-zinc-500"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : n}
              </div>
              <span
                className={`hidden text-xs font-medium sm:block ${
                  active ? "text-zinc-200" : "text-zinc-500"
                }`}
              >
                {label}
              </span>
              {n < 4 && <div className="h-px flex-1 bg-border" />}
            </div>
          );
        })}
      </div>

      {/* ============ STEP 1: SERVICE ============ */}
      {step === 1 && (
        <>
          <div className="flex items-center gap-3">
            <Avatar
              src={provider.profileImage || provider.user.image}
              name={provider.businessName}
              size={44}
            />
            <div>
              <h1 className="text-xl font-bold">{provider.businessName}</h1>
              <p className="text-sm text-zinc-500">Select a service to continue</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {provider.services.map((s) => (
              <button
                key={s.id}
                onClick={() => selectService(s)}
                className={`card text-left transition-all hover:border-primary/50 ${
                  service?.id === s.id ? "border-primary/60 ring-1 ring-primary/30" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold">{s.name}</h3>
                    <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {s.durationMinutes} min
                      </span>
                      {s.depositAmount > 0 && (
                        <span>Deposit: {formatCurrency(s.depositAmount)}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(s.price)}</p>
                    <span className="btn btn-primary mt-1 px-4 py-1.5 text-xs">
                      Select
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ============ STEP 2: DATE ============ */}
      {step === 2 && (
        <>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" /> {service?.name}
            </button>
            <h2 className="text-lg font-bold">Select a date</h2>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <button
                onClick={() =>
                  setViewMonth(
                    new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1)
                  )
                }
                className="btn btn-secondary h-9 w-9 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h3 className="font-semibold">
                {viewMonth.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <button
                onClick={() =>
                  setViewMonth(
                    new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)
                  )
                }
                className="btn btn-secondary h-9 w-9 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-500">
              {weekdays.map((d) => (
                <div key={d} className="py-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const date = new Date(
                  viewMonth.getFullYear(),
                  viewMonth.getMonth(),
                  i + 1
                );
                const disabled = isDateDisabled(date);
                const isSelected =
                  selectedDate?.toDateString() === date.toDateString();
                const isToday =
                  date.toDateString() === today.toDateString();
                return (
                  <button
                    key={i}
                    disabled={disabled}
                    onClick={() => loadSlots(date)}
                    className={`flex h-10 flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                      disabled
                        ? "text-zinc-800 cursor-not-allowed"
                        : isSelected
                          ? "bg-primary text-white font-semibold"
                          : isToday
                            ? "text-primary font-semibold hover:bg-surface-2"
                            : "text-zinc-300 hover:bg-surface-2"
                    }`}
                  >
                    {i + 1}
                    {isToday && !disabled && (
                      <span className="text-[9px]">TODAY</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDate && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2 p-4">
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <button
                onClick={() => setStep(3)}
                className="btn btn-primary"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* ============ STEP 3: TIME ============ */}
      {step === 3 && (
        <>
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setStep(2);
              }}
              className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" /> Change date
            </button>
            <h2 className="text-lg font-bold">Select a time</h2>
          </div>

          <div className="card">
            <div className="mb-4 flex items-center gap-2 text-sm text-zinc-400">
              <CalendarDays className="h-4 w-4 text-primary" />
              {selectedDate?.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">{service?.durationMinutes} min</span>
            </div>

            {loadingSlots ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton h-12 rounded-lg" />
                ))}
              </div>
            ) : slots.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {slots.map((slot) => {
                  const selected = selectedSlot === slot.start;
                  return (
                    <button
                      key={slot.start}
                      onClick={() => setSelectedSlot(slot.start)}
                      disabled={!slot.available}
                      className={`rounded-lg border px-4 py-3 text-center text-sm font-medium transition-colors ${
                        selected
                          ? "border-primary bg-primary text-white"
                          : slot.available
                            ? "border-border bg-surface-2 text-zinc-200 hover:border-primary/50"
                            : "border-border bg-surface-2 text-zinc-700 line-through cursor-not-allowed"
                      }`}
                    >
                      {slot.start}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center">
                <CalendarX className="mx-auto h-10 w-10 text-zinc-600" />
                <p className="mt-3 text-sm text-zinc-400">
                  No available slots on this date.
                </p>
                <button
                  onClick={() => setStep(2)}
                  className="btn btn-secondary mt-4"
                >
                  Pick another date
                </button>
              </div>
            )}
          </div>

          {selectedSlot && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2 p-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {selectedSlot}
                </span>
              </div>
              <button
                onClick={() => setStep(4)}
                className="btn btn-primary"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* ============ STEP 4: DETAILS + CONFIRM ============ */}
      {step === 4 && service && selectedDate && selectedSlot && (
        <>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <h2 className="text-lg font-bold">Review & confirm</h2>
          </div>

          {/* Summary */}
          <div className="card space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Avatar
                src={provider.profileImage || provider.user.image}
                name={provider.businessName}
                size={40}
              />
              <div>
                <p className="font-semibold">{provider.businessName}</p>
                <p className="text-xs text-zinc-500">{service.name}</p>
              </div>
            </div>
            <div className="h-px bg-border" />
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Date</span>
                <span className="font-medium">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Time</span>
                <span className="font-medium">{selectedSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Duration</span>
                <span className="font-medium">{service.durationMinutes} min</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between">
                <span className="text-zinc-500">Price</span>
                <span>{formatCurrency(service.price)}</span>
              </div>
              {service.depositAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Deposit</span>
                  <span>{formatCurrency(service.depositAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-500">Balance due</span>
                <span className="font-semibold">
                  {formatCurrency(
                    service.price - (service.depositAmount > 0 ? service.depositAmount : 0)
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Details form */}
          <div className="card space-y-4">
            <h3 className="font-semibold">Your details</h3>
            <div>
              <label className="label">Name</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your full name"
                className="input"
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                className="input"
              />
            </div>
            <div>
              <label className="label">Notes / special requests (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Anything the provider should know"
                className="input resize-none"
              />
            </div>
          </div>

          <button
            onClick={submitBooking}
            disabled={submitting || !customerName}
            className="btn btn-primary w-full py-3 text-base"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Confirming...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" /> Confirm Booking
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}

function combineDate(date: Date, timeStr: string): Date {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  let hours: number;
  let minutes: number;
  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
    const meridian = match[3].toUpperCase();
    if (meridian === "PM" && hours !== 12) hours += 12;
    if (meridian === "AM" && hours === 12) hours = 0;
  } else {
    const [h, m] = timeStr.split(":").map(Number);
    hours = h;
    minutes = m;
  }
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}
