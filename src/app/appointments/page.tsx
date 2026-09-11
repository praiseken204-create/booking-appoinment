import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { AppointmentTabs } from "@/components/appointments/tabs";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { tab } = await searchParams;

  const now = new Date();
  const appointments = await prisma.appointment.findMany({
    where: { customerId: session.user.id },
    include: {
      service: { select: { name: true, durationMinutes: true } },
      provider: { select: { id: true, businessName: true, profileImage: true } },
    },
    orderBy: { startTime: "desc" },
  });

  const upcoming = appointments
    .filter((a) => ["PENDING", "PAYMENT_PENDING", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS", "RESCHEDULED"].includes(a.status))
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  const past = appointments
    .filter((a) => ["COMPLETED", "NO_SHOW", "EXPIRED"].includes(a.status))
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  const cancelled = appointments.filter((a) => a.status === "CANCELLED");

  const activeTab = tab === "past" ? "past" : tab === "cancelled" ? "cancelled" : "upcoming";

  return (
    <>
      <PublicHeader />
      <main className="container-app py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Appointments</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Manage your bookings and schedule
            </p>
          </div>
          <Link href="/explore" className="btn btn-primary">
            <CalendarPlus className="h-4 w-4" /> Book an appointment
          </Link>
        </div>

        <AppointmentTabs
          counts={{ upcoming: upcoming.length, past: past.length, cancelled: cancelled.length }}
          active={activeTab}
        />

        <div className="mt-6">
          {(activeTab === "upcoming" ? upcoming : activeTab === "past" ? past : cancelled).length ===
          0 ? (
            <div className="card">
              <EmptyState
                icon={CalendarPlus}
                title={
                  activeTab === "upcoming"
                    ? "No appointments yet"
                    : activeTab === "past"
                      ? "No past appointments"
                      : "No cancelled appointments"
                }
                description={
                  activeTab === "upcoming"
                    ? "Find a service and book your first appointment."
                    : undefined
                }
                actionLabel={activeTab === "upcoming" ? "Explore services" : undefined}
                actionHref={activeTab === "upcoming" ? "/explore" : undefined}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {(activeTab === "upcoming"
                ? upcoming
                : activeTab === "past"
                  ? past
                  : cancelled
              ).map((appt) => (
                <Link
                  key={appt.id}
                  href={`/appointments/${appt.id}`}
                  className="card flex flex-col gap-4 transition-all hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={appt.provider.profileImage}
                      name={appt.provider.businessName}
                      size={52}
                    />
                    <div>
                      <p className="font-semibold">{appt.provider.businessName}</p>
                      <p className="text-sm text-zinc-500">{appt.service.name}</p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {appt.startTime.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        •{" "}
                        {appt.startTime.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <StatusBadge status={appt.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}