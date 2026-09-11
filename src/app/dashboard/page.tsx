import Link from "next/link";
import {
  CalendarClock,
  Clock,
  CheckCircle2,
  Wallet,
  TrendingUp,
  Users,
  ChevronRight,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentProvider } from "@/lib/provider";
import { formatCurrency } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

export default async function ProviderOverviewPage() {
  const current = await getCurrentProvider();
  if (!current) return null;
  const { profile } = current;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const [
    todaysCount,
    todayAppointments,
    upcomingCount,
    completedThisMonth,
    monthlyRevenueAgg,
    upcoming,
  ] = await Promise.all([
    prisma.appointment.count({
      where: {
        providerId: profile.id,
        startTime: { gte: startOfDay, lt: new Date(startOfDay.getTime() + 86400000) },
        status: { not: "CANCELLED" },
      },
    }),
    prisma.appointment.findMany({
      where: {
        providerId: profile.id,
        startTime: { gte: startOfDay, lt: new Date(startOfDay.getTime() + 86400000) },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      orderBy: { startTime: "asc" },
      include: {
        customer: { select: { name: true, image: true } },
        service: { select: { name: true } },
      },
    }),
    prisma.appointment.count({
      where: {
        providerId: profile.id,
        status: { in: ["PENDING", "PAYMENT_PENDING", "CONFIRMED", "CHECKED_IN", "RESCHEDULED"] },
      },
    }),
    prisma.appointment.count({
      where: {
        providerId: profile.id,
        status: "COMPLETED",
        startTime: { gte: startOfMonth },
      },
    }),
    prisma.payment.aggregate({
      where: {
        providerId: profile.id,
        status: "PAID",
        paidAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.appointment.findMany({
      where: {
        providerId: profile.id,
        startTime: { gte: now },
        status: { in: ["PENDING", "PAYMENT_PENDING", "CONFIRMED", "CHECKED_IN", "RESCHEDULED"] },
      },
      orderBy: { startTime: "asc" },
      take: 5,
      include: {
        customer: { select: { name: true, image: true } },
        service: { select: { name: true } },
      },
    }),
  ]);

  const monthlyRevenue = monthlyRevenueAgg._sum.amount || 0;

  const metrics = [
    {
      label: "Today's Appointments",
      value: String(todaysCount),
      icon: CalendarClock,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
    },
    {
      label: "Upcoming Appointments",
      value: String(upcomingCount),
      icon: Clock,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Completed This Month",
      value: String(completedThisMonth),
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Monthly Revenue",
      value: formatCurrency(monthlyRevenue),
      icon: Wallet,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {profile.businessName}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>
        <Link
          href={profile.isActive ? `/providers/${profile.id}` : "#"}
          className="hidden sm:inline-flex btn btn-secondary"
        >
          View public profile
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="card">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${m.bg} ${m.color}`}>
              <m.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-2xl font-bold">{m.value}</p>
            <p className="mt-1 text-sm text-zinc-500">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Today's schedule */}
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Today&apos;s Schedule</h2>
            <Link
              href="/dashboard/calendar"
              className="inline-flex items-center text-sm text-primary hover:underline"
            >
              View calendar <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {todayAppointments.length > 0 ? (
            <div className="mt-4 flex flex-col gap-3">
              {todayAppointments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-3"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-soft text-sm font-semibold text-primary">
                    {a.startTime.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {a.customer.name || "Customer"}
                    </p>
                    <p className="text-xs text-zinc-500">{a.service.name}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">
              No appointments scheduled for today.
            </p>
          )}
        </div>

        {/* Upcoming */}
        <div className="card">
          <h2 className="font-semibold">Upcoming Appointments</h2>
          {upcoming.length > 0 ? (
            <div className="mt-4 flex flex-col gap-3">
              {upcoming.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-3"
                >
                  <Avatar
                    src={a.customer.image}
                    name={a.customer.name}
                    size={40}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {a.customer.name || "Customer"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {a.service.name} •{" "}
                      {a.startTime.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      {a.startTime.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">No upcoming appointments.</p>
          )}
        </div>
      </div>
    </div>
  );
}