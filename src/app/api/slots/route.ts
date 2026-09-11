import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSlots } from "@/lib/booking-engine";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const providerId = searchParams.get("providerId");
  const serviceId = searchParams.get("serviceId");
  const date = searchParams.get("date");

  if (!providerId || !serviceId || !date) {
    return NextResponse.json(
      { error: "providerId, serviceId and date are required" },
      { status: 400 }
    );
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Invalid date format. Expected YYYY-MM-DD" },
      { status: 400 }
    );
  }

  try {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || service.providerId !== providerId) {
      return NextResponse.json(
        { error: "Service not found for this provider" },
        { status: 404 }
      );
    }

    const result = await generateSlots({ providerId, serviceId, dateISO: date });

    // Filter out slots in the past (for today)
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const isToday = new Date().toISOString().split("T")[0] === date;

    const available = result.slots.filter(
      (s) => !isToday || s.startMinutes > nowMinutes
    );

    return NextResponse.json({
      date,
      dateAvailable: result.dateAvailable,
      slots: available.map((s) => ({
        start: s.startTime,
        end: s.endTime,
        available: s.available,
      })),
      duration: service.durationMinutes,
      bufferBefore: service.bufferBefore,
      bufferAfter: service.bufferAfter,
    });
  } catch (error) {
    console.error("Slot generation error:", error);
    return NextResponse.json(
      { error: "Failed to load availability" },
      { status: 500 }
    );
  }
}