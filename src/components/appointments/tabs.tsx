"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function AppointmentTabs({
  counts,
  active,
}: {
  counts: { upcoming: number; past: number; cancelled: number };
  active: "upcoming" | "past" | "cancelled";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabs = [
    { key: "upcoming", label: "Upcoming", count: counts.upcoming },
    { key: "past", label: "Past", count: counts.past },
    { key: "cancelled", label: "Cancelled", count: counts.cancelled },
  ] as const;

  return (
    <div className="mt-6 flex gap-1 rounded-xl border border-border bg-surface-2 p-1 w-fit">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("tab", tab.key);
              router.push(`/appointments?${params.toString()}`);
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isActive ? "bg-card text-white shadow-sm" : "text-zinc-400 hover:text-white"
            }`}
          >
            {tab.label}
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-zinc-500">
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}