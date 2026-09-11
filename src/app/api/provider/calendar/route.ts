import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const profile = await prisma.providerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const start = from ? new Date(from) : new Date();
  start.setHours(0, 0, 0, 0);
  const end = to ? new Date(to) : new Date(start.getTime() + 7 * 86400000);
  end.setHours(23, 59, 59, 999);

  const appointments = await prisma.appointment.findMany({
    where: {
      providerId: profile.id,
      startTime: { gte: start, lt: end },
    },
    orderBy: { startTime: "asc" },
    include: {
      customer: { select: { name: true, image: true } },
      service: { select: { name: true } },
    },
  });

  return NextResponse.json({
    appointments: appointments.map((a) => ({
      id: a.id,
      startTime: a.startTime,
      endTime: a.endTime,
      status: a.status,
      customerName: a.customer.name || "Customer",
      serviceName: a.service.name,
      customerImage: a.customer.image,
    })),
  });
}