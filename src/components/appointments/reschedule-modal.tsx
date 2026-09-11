"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarX,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface Slot {
  start: string;
  end: string;
  available: boolean;
}

export function RescheduleModal({
  open,
  onClose,
  appointmentId,
  providerId,
  serviceId,
  duration,
}: {
  open: boolean;
  onClose: () => void;
  appointmentId: string;
  providerId: string;
  serviceId: string;
  duration: number;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [viewMonth, setViewMonth] = React.useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [slots, setSlots] = React.useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = React.useState(false);
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Reset when modal closes
  React.useEffect(() => {
    if (!open) {
      setSelectedDate(null);
      setSelectedSlot(null);
      setSlots([]);
    }
  }, [open]);

  if (!open) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysInMonth = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth() + 1,
    0
  ).getDate();
  const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();

  async function loadSlots(date: Date) {
    setLoadingSlots(true);
    setSelectedSlot(null);
    const dateStr = date.toISOString().split("T")[0];
    try {
      const res = await fetch(
        `/api/slots?providerId=${providerId}&serviceId=${serviceId}&date=${dateStr}`,
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
      toast("error", "Something went wrong", "Please try again.");
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleReschedule() {
    if (!selectedDate || !selectedSlot) return;
    const slot = slots.find((s) => s.start === selectedSlot);
    if (!slot) return;

    setSubmitting(true);
    const start = combineDate(selectedDate, slot.start);
    const end = combineDate(selectedDate, slot.end);

    try {
      const res = await fetch(`/api/appointments/${appointmentId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast("error", "Couldn't reschedule", data.error);
        setSubmitting(false);
        return;
      }
      toast("success", "Appointment rescheduled", "Your new time is confirmed.");
      onClose();
      router.refresh();
    } catch {
      toast("error", "Something went wrong", "Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Reschedule appointment</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-6 md:grid-cols-2">
          {/* Calendar */}
          <div>
            <div className="flex items-center justify-between">
              <button
                onClick={() =>
                  setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
                }
                className="btn btn-secondary h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-semibold">
                {viewMonth.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <button
                onClick={() =>
                  setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
                }
                className="btn btn-secondary h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-zinc-500">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i + 1);
                const disabled = date < today;
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                return (
                  <button
                    key={i}
                    disabled={disabled}
                    onClick={() => loadSlots(date)}
                    className={`flex h-9 items-center justify-center rounded-lg text-sm transition-colors ${
                      disabled
                        ? "text-zinc-800 cursor-not-allowed"
                        : isSelected
                          ? "bg-primary text-white font-semibold"
                          : "text-zinc-300 hover:bg-surface-2"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slots */}
          <div>
            <p className="text-sm font-semibold text-zinc-300">
              {selectedDate
                ? selectedDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                : "Select a date"}
            </p>
            {loadingSlots ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton h-11 rounded-lg" />
                ))}
              </div>
            ) : slots.length > 0 ? (
              <div className="mt-3 max-h-64 overflow-y-auto grid grid-cols-2 gap-2">
                {slots.map((slot) => {
                  const sel = selectedSlot === slot.start;
                  return (
                    <button
                      key={slot.start}
                      onClick={() => setSelectedSlot(slot.start)}
                      disabled={!slot.available}
                      className={`rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition-colors ${
                        sel
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
            ) : selectedDate ? (
              <div className="py-10 text-center">
                <CalendarX className="mx-auto h-8 w-8 text-zinc-600" />
                <p className="mt-2 text-sm text-zinc-500">No available slots.</p>
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-zinc-500">
                <CalendarDays className="mx-auto h-8 w-8 text-zinc-600" />
                <p className="mt-2">Pick a date to see available times.</p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleReschedule}
          disabled={submitting || !selectedSlot}
          className="btn btn-primary mt-6 w-full py-3"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Confirm new time"
          )}
        </button>
      </div>
    </div>
  );
}

function combineDate(date: Date, timeStr: string): Date {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  let hours: number, minutes: number;
  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
    const mer = match[3].toUpperCase();
    if (mer === "PM" && hours !== 12) hours += 12;
    if (mer === "AM" && hours === 12) hours = 0;
  } else {
    const [h, m] = timeStr.split(":").map(Number);
    hours = h;
    minutes = m;
  }
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}