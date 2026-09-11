import { prisma } from "@/lib/prisma";
import { getCurrentProvider } from "@/lib/provider";
import { ProviderAppointments } from "@/components/dashboard/provider-appointments";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; status?: string }>;
}) {
  const current = await getCurrentProvider();
  if (!current) return null;
  const { filter, status } = await searchParams;

  const services = await prisma.service.findMany({
    where: { providerId: current.profile.id, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(startOfDay.getTime() + 86400000);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const endOfWeek = new Date(startOfWeek.getTime() + 7 * 86400000);

  const where: Record<string, unknown> = { providerId: current.profile.id };

  if (filter === "today") {
    where.startTime = { gte: startOfDay, lt: tomorrow };
  } else if (filter === "tomorrow") {
    const dayAfter = new Date(tomorrow.getTime() + 86400000);
    where.startTime = { gte: tomorrow, lt: dayAfter };
  } else if (filter === "week") {
    where.startTime = { gte: startOfWeek, lt: endOfWeek };
  }

  if (status && status !== "ALL") {
    where.status = status;
  }

  const appointments = await prisma.appointment.findMany({
    where: where as never,
    orderBy: { startTime: "asc" },
    include: {
      customer: { select: { name: true, image: true, phone: true } },
      service: { select: { name: true } },
      payments: { select: { status: true, amount: true, paymentType: true } },
    },
  });

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage and update your bookings
        </p>
      </div>
      <div className="mt-6">
        <ProviderAppointments
          initial={appointments.map((a) => ({
            id: a.id,
            status: a.status,
            startTime: a.startTime.toISOString(),
            endTime: a.endTime.toISOString(),
            customerName: a.customer.name || "Customer",
            serviceName: a.service.name,
            paymentStatus: a.payments[0]?.status || "NONE",
            paymentAmount: a.payments[0]?.amount || 0,
          }))}
          services={services}
          activeFilter={filter || "all"}
          activeStatus={status || "ALL"}
        />
      </div>
    </div>
  );
}