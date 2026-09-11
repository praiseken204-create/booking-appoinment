import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/admin";
import {
  Calendar,
  Users,
  Shield,
  BarChart3,
  Settings,
  ArrowRight,
  Clock,
  CheckCircle,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const current = await getCurrentAdmin();
  if (!current) return null;

  const { profile } = current;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [
    totalProviders,
    totalCustomers,
    totalAppointments,
    completedThisMonth,
    monthlyRevenue,
    pendingAppointments,
    upcomingAppointments,
    revenueByService,
  ] = await Promise.all([
    prisma.providerProfile.count({ where: { isActive: true } }),
    prisma.$executeRaw`SELECT COUNT(*) FROM users WHERE role = 'CUSTOMER'`,
    prisma.appointment.count(),
    prisma.appointment.count({
      where: {
        status: "COMPLETED",
        startTime: { gte: startOfMonth },
      },
    }),
    prisma.payment.aggregate({
      where: {
        status: "PAID",
        paidAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.appointment.count({
      where: {
        status: { in: ["PENDING", "PAYMENT_PENDING", "CONFIRMED", "CHECKED_IN"] },
      },
    }),
    prisma.appointment.count({
      where: {
        startTime: { gte: now },
        status: { in: ["PENDING", "PAYMENT_PENDING", "CONFIRMED", "CHECKED_IN"] },
      },
    }),
    prisma.payment.groupBy({
      by: ["paymentType"],
      _sum: { amount: true },
      where: {
        providerId: profile?.id,
        status: "PAID",
        paidAt: { gte: startOfMonth },
      },
    }),
  ]);

  const totalMonthly = monthlyRevenue._sum.amount || 0;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-y border-border/60 bg-background/80">
        <div className="container-app h-64">
          <div className="flex items-center justify-between py-8">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-xl font-bold tracking-tight">
                B<span className="text-primary">Appoint</span>
              </Link>
              <span className="text-zinc-400 text-sm">Admin</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 text-xs">Welcome, {profile?.email?.split("@")[0] || "Admin"}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="container-app flex-1 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 mb-8 md:grid-cols-3">
            <div className="card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">{totalProviders}</p>
                <p className="text-zinc-500 text-sm">Total Providers</p>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-soft text-success">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">--</p>
                <p className="text-zinc-500 text-sm">Total Customers</p>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info-soft text-info">
                <Shield className="h-5 w-5" />
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">--</p>
                <p className="text-zinc-500 text-sm">Total Appointments</p>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-soft text-warning">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">${totalMonthly}</p>
                <p className="text-zinc-500 text-sm">Monthly Revenue</p>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{pendingAppointments}</p>
                <p className="text-zinc-500 text-sm">Pending</p>
              </div>
            </div>
            <div className="card">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-soft text-success">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{completedThisMonth}</p>
                <p className="text-zinc-500 text-sm">Completed This Month</p>
              </div>
            </div>
            <div className="card">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info-soft text-info">
                <ArrowRight className="h-5 w-5" />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{upcomingAppointments}</p>
                <p className="text-zinc-500 text-sm">Upcoming</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}