"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function AppointmentActions({
  appointmentId,
  status,
  onReschedule,
}: {
  appointmentId: string;
  status: string;
  onReschedule: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [showCancel, setShowCancel] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");

  async function handleCancel() {
    setCancelling(true);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast("error", "Couldn't cancel", data.error);
        setCancelling(false);
        return;
      }
      toast(
        "success",
        "Appointment cancelled",
        data.refund?.amount > 0 ? `Refund of ${data.refund.amount} will be issued.` : data.refund?.message
      );
      setShowCancel(false);
      router.refresh();
    } catch {
      toast("error", "Something went wrong", "Please try again.");
      setCancelling(false);
    }
  }

  return (
    <>
      <div className="card">
        <h3 className="font-semibold mb-4">Manage booking</h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button onClick={onReschedule} className="btn btn-secondary flex-1">
            <CalendarClock className="h-4 w-4" /> Reschedule
          </button>
          <button
            onClick={() => setShowCancel(true)}
            className="btn flex-1 border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
          >
            <XCircle className="h-4 w-4" /> Cancel booking
          </button>
        </div>
      </div>

      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold">Cancel appointment?</h3>
            <p className="mt-2 text-sm text-zinc-400">
              This will cancel your appointment. Refunds are subject to the
              provider&apos;s cancellation policy.
            </p>
            <div className="mt-4">
              <label className="label">Reason (optional)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="input resize-none"
                placeholder="Why are you cancelling?"
              />
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowCancel(false)}
                className="btn btn-secondary flex-1"
              >
                Keep booking
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="btn btn-danger flex-1"
              >
                {cancelling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Cancel booking"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}