import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock3, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { StatusBadge, PaymentStatusBadge } from "@/components/ui/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/format";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { AppointmentManage } from "@/components/appointments/manage";

export const dynamic = "force-dynamic";

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      service: true,
      provider: {
        select: {
          id: true,
          businessName: true,
          profileImage: true,
          location: true,
          user: { select: { name: true } },
        },
      },
      payments: true,
    },
  });

  if (!appointment || appointment.customerId !== session.user.id) {
    notFound();
  }

  return (
    <>
      <PublicHeader />
      <main className="container-app py-10">
        <Link
          href="/appointments"
          className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> My appointments
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar
                    src={appointment.provider.profileImage}
                    name={appointment.provider.businessName}
                    size={56}
                  />
                  <div>
                    <p className="font-bold">{appointment.provider.businessName}</p>
                    <p className="text-sm text-zinc-500">{appointment.service.name}</p>
                  </div>
                </div>
                <StatusBadge status={appointment.status} />
              </div>
              <div className="mt-5 h-px bg-border" />
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-zinc-500">Date</p>
                    <p className="text-sm font-medium">
                      {appointment.startTime.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-zinc-500">Time</p>
                    <p className="text-sm font-medium">
                      {appointment.startTime.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {appointment.endTime.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:col-span-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-zinc-500">Location</p>
                    <p className="text-sm font-medium">
                      {appointment.provider.location || "Provider location"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-surface-2 px-4 py-2 text-xs text-zinc-500">
                Booking reference:{" "}
                <span className="font-mono text-zinc-300">
                  {appointment.bookingReference}
                </span>
              </div>
              {appointment.customerNotes && (
                <div className="mt-4 rounded-lg border border-border p-4 text-sm text-zinc-400">
                  <span className="text-xs uppercase tracking-wide text-zinc-600">
                    Your notes
                  </span>
                  <p className="mt-1">{appointment.customerNotes}</p>
                </div>
              )}
            </div>

            {/* Payment info */}
            <div className="card">
              <h3 className="font-semibold">Payment</h3>
              <div className="mt-4 space-y-3">
                {appointment.payments.length > 0 ? (
                  appointment.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-surface-2 p-3"
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          {formatCurrency(p.amount)}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {p.paymentType === "DEPOSIT" ? "Deposit" : "Full payment"}{" "}
                          via {p.paymentProvider}
                        </p>
                      </div>
                      <PaymentStatusBadge status={p.status} />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No payment required</p>
                )}
                <div className="flex justify-between border-t border-border pt-3 text-sm">
                  <span className="text-zinc-500">Service price</span>
                  <span className="font-semibold">
                    {formatCurrency(appointment.service.price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <AppointmentManage
              appointmentId={appointment.id}
              providerId={appointment.providerId}
              serviceId={appointment.serviceId}
              duration={appointment.service.durationMinutes}
              status={appointment.status}
            />
          </div>

          <aside className="space-y-4">
            <div className="card">
              <h3 className="font-semibold">About this booking</h3>
              <ul className="mt-3 space-y-2 text-sm text-zinc-400">
                <li>Duration: {appointment.service.durationMinutes} min</li>
                <li>Provider: {appointment.provider.businessName}</li>
                <li>Service: {appointment.service.name}</li>
              </ul>
            </div>
            <div className="card">
              <Link
                href={`/providers/${appointment.providerId}`}
                className="btn btn-secondary w-full"
              >
                View provider profile
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}