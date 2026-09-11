"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCheck, X, UserX, ChevronDown, CalendarDays } from "lucide-react";
import { StatusBadge, PaymentStatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { formatDateShort, formatTime } from "@/lib/format";

type Appt = {
  id: string;
  status: string;
  startTime: string;
  endTime: string;
  customerName: string;
  serviceName: string;
  paymentStatus: string;
  paymentAmount: number;
};

export function ProviderAppointments({
  initial,
  services,
  activeFilter,
  activeStatus,
}: {
  initial: Appt[];
  services: { id: string; name: string }[];
  activeFilter: string;
  activeStatus: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [appointments, setAppointments] = React.useState<Appt[]>(initial);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const filters = [
    { key: "all", label: "All" },
    { key: "today", label: "Today" },
    { key: "tomorrow", label: "Tomorrow" },
    { key: "week", label: "This week" },
  ];

  async function runAction(id: string, action: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/provider/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast("error", "Action failed", data.error);
        setBusyId(null);
        return;
      }
      toast("success", "Appointment updated");
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: data.appointment.status } : a
        )
      );
    } catch {
      toast("error", "Something went wrong", "Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  function applyFilter(key: string) {
    const params = new URLSearchParams();
    if (key !== "all") params.set("filter", key);
    router.push(`/dashboard/appointments?${params.toString()}`);
  }

  function applyStatus(key: string) {
    const params = new URLSearchParams();
    params.set("status", key);
    router.push(`/dashboard/appointments?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-2 p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => applyFilter(f.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                activeFilter === f.key
                  ? "bg-card text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <select
            value={activeStatus}
            onChange={(e) => applyStatus(e.target.value)}
            className="input appearance-none w-44"
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PAYMENT_PENDING">Payment pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CHECKED_IN">Checked in</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">No show</option>
          </select>
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="card py-16 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-zinc-600" />
          <p className="mt-3 text-sm text-zinc-400">
            No appointments match this filter.
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-border bg-surface-2/50">
              <tr>
                <th className="table-th">Customer</th>
                <th className="table-th">Service</th>
                <th className="table-th">Date</th>
                <th className="table-th">Time</th>
                <th className="table-th">Status</th>
                <th className="table-th">Payment</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {appointments.map((a) => (
                <tr key={a.id} className="hover:bg-surface-2/40">
                  <td className="table-td font-medium">{a.customerName}</td>
                  <td className="table-td text-zinc-400">{a.serviceName}</td>
                  <td className="table-td text-zinc-400">{formatDateShort(a.startTime)}</td>
                  <td className="table-td text-zinc-400">{formatTime(a.startTime)}</td>
                  <td className="table-td"><StatusBadge status={a.status} /></td>
                  <td className="table-td"><PaymentStatusBadge status={a.paymentStatus} /></td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      {(a.status === "PENDING" || a.status === "PAYMENT_PENDING") && (
                        <ActionBtn
                          title="Confirm"
                          onClick={() => runAction(a.id, "CONFIRM")}
                          disabled={busyId === a.id}
                        >
                          <Check className="h-4 w-4 text-emerald-400" />
                        </ActionBtn>
                      )}
                      {(a.status === "CONFIRMED" || a.status === "CHECKED_IN") && (
                        <ActionBtn
                          title="Complete"
                          onClick={() => runAction(a.id, "COMPLETE")}
                          disabled={busyId === a.id}
                        >
                          <CheckCheck className="h-4 w-4 text-sky-400" />
                        </ActionBtn>
                      )}
                      {(a.status === "CONFIRMED" || a.status === "CHECKED_IN") && (
                        <ActionBtn
                          title="No show"
                          onClick={() => runAction(a.id, "NO_SHOW")}
                          disabled={busyId === a.id}
                        >
                          <UserX className="h-4 w-4 text-zinc-400" />
                        </ActionBtn>
                      )}
                      {!["COMPLETED", "CANCELLED", "NO_SHOW"].includes(a.status) && (
                        <ActionBtn
                          title="Cancel"
                          onClick={() => runAction(a.id, "CANCEL")}
                          disabled={busyId === a.id}
                        >
                          <X className="h-4 w-4 text-red-400" />
                        </ActionBtn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  children,
  title,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-2 hover:bg-surface transition-colors disabled:opacity-50"
    >
      {children}
    </button>
  );
}