import { prisma } from "@/lib/prisma";
import { getCurrentProvider } from "@/lib/provider";
import { cn } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProviderAvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const current = await getCurrentProvider();
  if (!current) return null;
  const { tab } = await searchParams;

  const weeklyHours = await prisma.availability.findMany({
    where: { providerId: current.profile.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  const blockedTimes = await prisma.blockedTime.findMany({
    where: { providerId: current.profile.id },
    orderBy: [{ startDateTime: "asc" }, { endDateTime: "asc" }],
  });

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Availability Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Configure your working hours and blocked times.
        </p>
      </div>

      {/* Weekly Hours */}
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Weekly Hours</h2>
          <button className="btn btn-secondary text-sm">Add Hours</button>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-2">
          {days.map((day) => {
            const existing = weeklyHours.find(
              (h) => h.dayOfWeek === days.indexOf(day)
            );
            return (
              <div
                key={day}
                className="rounded-lg border border-border bg-surface-2 p-2 min-h-[80px]"
              >
                <p className="text-xs text-zinc-500 text-center">{day
                  .substring(0, 3)}</p>
                {existing
                  ? (
                    <div className="flex flex-col gap-1 pt-1">
                      <span className="text-[9px] text-zinc-400">
                        {existing.startTime} - {existing.endTime}
                      </span>
                      <span className="text-[8px] text-emerald-400">
                        {existing.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  ) : (
                    <div
                      className="flex h-8 items-center justify-center rounded-lg bg-surface-2/30 text-xs text-zinc-500"
                    >
                      —
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Blocked Times */}
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Blocked Times</h2>
          <button className="btn btn-secondary text-sm">Add Block</button>
        </div>
        <div className="mt-4">
          {blockedTimes.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No blocked times. Appointments can be booked any time.
            </p>
          ) : (
            <div className="grid gap-2">
              {blockedTimes.map((bt) => {
                const date = new Date(bt.startDateTime);
                return (
                  <div
                    key={bt.id}
                    className="rounded-lg border border-border bg-surface-2 p-2 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">
                        {date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <span className="text-[8px] text-zinc-400">
                        {bt.startDateTime.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })} - {bt.endDateTime.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-[8px] text-zinc-500">{bt.reason || ""}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}