"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  List,
  Loader2,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

type Appointment = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  customerName: string;
  serviceName: string;
  customerImage: string | null;
};

type WorkingHour = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type ViewMode = "day" | "week" | "month";

export function ProviderCalendar({
  initialHours,
}: {
  initialHours: WorkingHour[];
}) {
  const [view, setView] = React.useState<ViewMode>("week");
  const [anchor, setAnchor] = React.useState(new Date());
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadAppointments();
  }, [anchor, view]);

  async function loadAppointments() {
    setLoading(true);
    let from: Date, to: Date;
    if (view === "day") {
      from = new Date(anchor);
      to = new Date(anchor);
    } else if (view === "week") {
      const day = anchor.getDay();
      from = new Date(anchor);
      from.setDate(anchor.getDate() - day);
      to = new Date(from);
      to.setDate(from.getDate() + 6);
    } else {
      from = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      to = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    }
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    try {
      const res = await fetch(
        `/api/provider/calendar?from=${from.toISOString()}&to=${to.toISOString()}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (res.ok) setAppointments(data.appointments || []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  function shift(dir: 1 | -1) {
    setAnchor((prev) => {
      const d = new Date(prev);
      if (view === "day") d.setDate(d.getDate() + dir);
      else if (view === "week") d.setDate(d.getDate() + 7 * dir);
      else d.setMonth(d.getMonth() + dir);
      return d;
    });
  }

  function today() {
    setAnchor(new Date());
  }

  // BUILD VIEWS
  const weekStart = new Date(anchor);
  weekStart.setDate(anchor.getDate() - anchor.getDay());
  const days: Date[] = [];
  if (view === "day") {
    days.push(new Date(anchor));
  } else if (view === "week") {
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      days.push(d);
    }
  }

  const hoursRange = 8; // 8am - 7pm default, will use provider hours for coloring

  function apptsFor(date: Date) {
    const key = date.toDateString();
    return appointments
      .filter((a) => new Date(a.startTime).toDateString() === key)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} className="btn btn-secondary h-9 w-9 p-0">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={today} className="btn btn-secondary h-9 px-3 text-sm">
            Today
          </button>
          <button onClick={() => shift(1)} className="btn btn-secondary h-9 w-9 p-0">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <h2 className="font-semibold">
          {view === "day"
            ? anchor.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
            : view === "week"
              ? `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(weekStart.getTime() + 6 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
              : anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h2>
        <div className="flex gap-1 rounded-lg border border-border bg-surface-2 p-1">
          {(["day", "week", "month"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${
                view === v ? "bg-card text-white shadow-sm" : "text-zinc-400 hover:text-white"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card grid grid-cols-7 gap-2 p-4">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-lg" />
          ))}
        </div>
      ) : view === "month" ? (
        <MonthView anchor={anchor} appointments={appointments} onDayClick={(d) => { setAnchor(d); setView("day"); }} />
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: view === "week" ? "0.7fr repeat(7, 1fr)" : "0.7fr 1fr" }}>
          <div className="flex flex-col gap-2 pt-2">
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className="h-16 text-xs text-zinc-500">
                {i + 8}:00
              </div>
            ))}
          </div>
          {days.map((date) => {
            const appts = apptsFor(date);
            return (
              <div key={date.toDateString()} className="flex flex-col gap-2">
                <div className="rounded-lg bg-surface-2 px-2 py-1.5 text-center text-xs font-semibold">
                  {date.toLocaleDateString("en-US", { weekday: "short" })}{" "}
                  {date.getDate()}
                  {date.toDateString() === new Date().toDateString() && (
                    <span className="ml-1 text-primary">•</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {appts.length > 0 ? (
                    appts.map((a) => {
                      const top = hourOffset(a.startTime);
                      const h = hourSpan(a.startTime, a.endTime);
                      return (
                        <div
                          key={a.id}
                          className="rounded-lg border border-border bg-surface-2 p-2"
                          style={{ minHeight: Math.max(h, 40) }}
                        >
                          <p className="text-xs font-semibold truncate">
                            {formatHM(a.startTime)}
                          </p>
                          <p className="text-xs text-zinc-300 truncate">{a.customerName}</p>
                          <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                            {a.serviceName}
                          </p>
                          <div className="mt-1.5">
                            <StatusBadge status={a.status} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex h-10 items-center justify-center rounded-lg bg-surface-2/50 text-xs text-zinc-600">
                      —
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function hourOffset(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 40 + d.getMinutes();
}

function hourSpan(startIso: string, endIso: string): number {
  const s = new Date(startIso);
  const e = new Date(endIso);
  return ((e.getTime() - s.getTime()) / 3600000) * 40;
}

function formatHM(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function MonthView({
  anchor,
  appointments,
  onDayClick,
}: {
  anchor: Date;
  appointments: Appointment[];
  onDayClick: (d: Date) => void;
}) {
  const firstDay = new Date(anchor.getFullYear(), anchor.getMonth(), 1).getDay();
  const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();

  const cells = Array.from({ length: 42 }).map((_, i) => {
    const dayNum = i - firstDay + 1;
    if (dayNum < 1 || dayNum > daysInMonth) return null;
    const date = new Date(anchor.getFullYear(), anchor.getMonth(), dayNum);
    return { date };
  });

  return (
    <div className="card p-3">
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-zinc-500">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} className="h-20 rounded-lg" />;
          const appts = appointments.filter(
            (a) => new Date(a.startTime).toDateString() === cell.date.toDateString()
          );
          const isToday = cell.date.toDateString() === new Date().toDateString();
          return (
            <button
              key={i}
              onClick={() => onDayClick(cell.date)}
              className={`flex h-20 flex-col gap-1 rounded-lg p-1.5 text-left transition-colors hover:bg-surface-2 ${
                isToday ? "bg-primary-soft" : "bg-surface-2/40"
              }`}
            >
              <span className={`text-xs font-semibold ${isToday ? "text-white" : "text-zinc-400"}`}>
                {cell.date.getDate()}
              </span>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {appts.slice(0, 3).map((a) => (
                  <div key={a.id} className="text-[9px] leading-tight">
                    <span className="text-zinc-500">{formatHM(a.startTime)}</span>{" "}
                    <span className="text-zinc-300 truncate block">{a.customerName}</span>
                  </div>
                ))}
                {appts.length > 3 && (
                  <span className="text-[9px] text-zinc-500">+{appts.length - 3} more</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
