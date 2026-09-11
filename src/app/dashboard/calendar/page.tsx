import { prisma } from "@/lib/prisma";
import { getCurrentProvider } from "@/lib/provider";
import { ProviderCalendar } from "@/components/dashboard/provider-calendar";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const current = await getCurrentProvider();
  if (!current) return null;

  const workingHours = await prisma.availability.findMany({
    where: { providerId: current.profile.id, isActive: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your schedule and appointments
          </p>
        </div>
      </div>
      <div className="mt-6">
        <ProviderCalendar initialHours={workingHours} />
      </div>
    </div>
  );
}