"use client";

import { APPOINTMENT_STATUS_LABELS } from "@/lib/constants";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  PAYMENT_PENDING: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  CONFIRMED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  CHECKED_IN: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  IN_PROGRESS: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  COMPLETED: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  CANCELLED: "bg-red-500/15 text-red-400 border-red-500/20",
  RESCHEDULED: "bg-teal-500/15 text-teal-400 border-teal-500/20",
  NO_SHOW: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  EXPIRED: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  PROCESSING: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  PAID: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  FAILED: "bg-red-500/15 text-red-400 border-red-500/20",
  REFUNDED: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  PARTIALLY_REFUNDED: "bg-orange-500/15 text-orange-400 border-orange-500/20",
};

export function StatusBadge({
  status,
  labels,
}: {
  status: string;
  labels?: Record<string, string>;
}) {
  const labelMap = labels || APPOINTMENT_STATUS_LABELS;
  const style = STATUS_STYLES[status] || "bg-zinc-500/15 text-zinc-400 border-zinc-500/20";
  return (
    <span className={`badge border ${style}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labelMap[status] || status}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const style = PAYMENT_STATUS_STYLES[status] || "bg-zinc-500/15 text-zinc-400 border-zinc-500/20";
  const labelMap: Record<string, string> = {
    PENDING: "Pending",
    PROCESSING: "Processing",
    PAID: "Paid",
    FAILED: "Failed",
    REFUNDED: "Refunded",
    PARTIALLY_REFUNDED: "Partially Refunded",
  };
  return (
    <span className={`badge border ${style}`}>{labelMap[status] || status}</span>
  );
}
