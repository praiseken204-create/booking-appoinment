import { prisma } from "@/lib/prisma";
import { getCurrentProvider } from "@/lib/provider";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProviderEarningsPage() {
  const current = await getCurrentProvider();
  if (!current) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  let prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  if (!prevMonthStart) prevMonthStart = new Date(0);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [
    monthlyRevenue,
    previousMonthRevenue,
    yearlyRevenue,
    completedAppointments,
    pendingAppointments,
    revenueByService,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        providerId: current.profile.id,
        status: "PAID",
        paidAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        providerId: current.profile.id,
        status: "PAID",
        paidAt: { gte: prevMonthStart, lt: startOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        providerId: current.profile.id,
        status: "PAID",
        paidAt: { gte: startOfYear },
      },
      _sum: { amount: true },
    }),
    prisma.appointment.count({
      where: {
        providerId: current.profile.id,
        status: "COMPLETED",
        startTime: { gte: startOfMonth },
      },
    }),
    prisma.appointment.count({
      where: {
        providerId: current.profile.id,
        status: { in: ["PENDING", "PAYMENT_PENDING", "CONFIRMED", "CHECKED_IN"] },
      },
    }),
    prisma.payment.groupBy({
      by: ["paymentType"],
      _sum: { amount: true },
      where: {
        providerId: current.profile.id,
        status: "PAID",
        paidAt: { gte: startOfMonth },
      },
    }),
  ]);

  const totalMonthly = monthlyRevenue._sum.amount || 0;
  const prevMonthly = previousMonthRevenue._sum.amount || 0;
  const growth = prevMonthly > 0 ? ((totalMonthly - prevMonthly) / prevMonthly) * 100 : 0;

  const serviceBreakdown = revenueByService.map((r) => ({
    type: r.paymentType,
    amount: r._sum.amount || 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Earnings
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Revenue overview for your business
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="card">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83a5.95 5.95 0 0 1 0 8.47L19.07 21l4.23-4.23a5.95 5.95 0 0 1-8.47 0L4.93 21l-2.83-2.83a5.95 5.95 0 0 1 0-8.47l2.83 2.83z" />
            </svg>
          </div>
          <p className="mt-2 text-2xl font-bold">${totalMonthly}</p>
          <p className="text-sm text-zinc-500">Monthly Revenue</p>
        </div>
        <div className="card">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-soft text-emerald-400">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <p className="mt-2 text-2xl font-bold">${prevMonthly}</p>
          <p className="text-sm text-zinc-500">
            Previous Monthly
          </p>
        </div>
        <div className="card">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-soft text-amber-400">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <p className="mt-2 text-2xl font-bold">${yearlyRevenue._sum.amount || 0}</p>
          <p className="text-sm text-zinc-500">Yearly Revenue</p>
        </div>
        <div className="card">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-soft text-zinc-400">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <polyline points="2 6 10 14 22 6M2 12l10 5 10-5M2 18l10 5 10-5" />
            </svg>
          </div>
          <p className="mt-2 text-xl font-bold">
            {completedAppointments}
          </p>
          <p className="text-sm text-zinc-500">Completed Appointments</p>
        </div>
      </div>

      {/* Revenue growth */}
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Revenue Growth</h2>
          <span
            className={`text-sm font-medium ${
              growth >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
          </span>
        </div>
        {growth !== 0 && (
          <p className="mt-2 text-sm text-zinc-500">
            {growth >= 0
              ? "Increased from previous month"
              : "Decreased from previous month"}
          </p>
        )}
      </div>

      {/* Revenue by service */}
      <div className="card">
        <h2 className="font-semibold">Revenue by Payment Type</h2>
        <div className="mt-4 space-y-2">
          {serviceBreakdown.map((item) => (
            <div key={item.type} className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">{item.type}</span>
              <span className="text-primary font-medium">
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}