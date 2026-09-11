import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { prisma } from "@/lib/prisma";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { Clock, Shield } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string; service?: string }>;
}) {
  const { provider, service } = await searchParams;

  if (!provider) {
    return (
      <>
        <PublicHeader />
        <main className="container-app flex flex-1 items-center justify-center py-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold">No provider selected</h1>
            <p className="mt-2 text-sm text-zinc-500">
              Choose a provider to start booking.
            </p>
            <Link href="/explore" className="btn btn-primary mt-6">
              Explore Providers
            </Link>
          </div>
        </main>
      </>
    );
  }

  const providerData = await prisma.providerProfile.findUnique({
    where: { id: provider },
    include: {
      user: { select: { name: true, image: true } },
      services: { where: { isActive: true }, orderBy: { price: "asc" } },
      policies: true,
    },
  });

  if (!providerData || !providerData.isActive || providerData.isSuspended) {
    notFound();
  }

  const selectedService = service
    ? providerData.services.find((s) => s.id === service)
    : providerData.services[0];

  return (
    <>
      <PublicHeader />
      <main className="container-app py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <BookingWizard
              provider={providerData}
              initialServiceId={selectedService?.id}
            />
          </div>

          <aside className="space-y-6">
            <div className="card">
              <h3 className="font-semibold">Need help?</h3>
              <p className="mt-2 text-sm text-zinc-400">
                If you need assistance with your booking, contact the provider
                directly or check the cancellation policy before confirming.
              </p>
            </div>
            <div className="card">
              <h3 className="font-semibold">Good to know</h3>
              <ul className="mt-3 space-y-3 text-sm text-zinc-400">
                <li className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Slots update in real time to prevent double bookings.
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  Your payment is secure. Refunds follow the provider&apos;s
                  cancellation policy.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}