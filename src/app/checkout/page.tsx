import { notFound, redirect } from "next/navigation";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string; verify?: string }>;
}) {
  const { booking, verify } = await searchParams;
  const session = await auth();

  const appointment = await prisma.appointment.findUnique({
    where: { id: booking || "" },
    include: {
      service: true,
      provider: {
        include: {
          user: true,
        },
      },
      payments: true,
    },
  });

  if (!appointment || appointment.customerId !== session?.user?.id) {
    notFound();
  }

  if (
    appointment.status === "CONFIRMED" ||
    appointment.status === "COMPLETED" ||
    appointment.status === "CANCELLED"
  ) {
    redirect("/appointments");
  }

  return (
    <>
      <PublicHeader />
      <main className="flex flex-1 items-start justify-center py-8 lg:py-12">
        <div className="w-full max-w-6xl px-4 sm:px-6">
          <CheckoutFlow appointment={appointment} initialVerify={verify} />
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
