"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarClock,
  Scissors,
  Clock,
  Wallet,
  Settings,
  Bell,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/appointments", label: "Appointments", icon: CalendarClock },
  { href: "/dashboard/services", label: "Services", icon: Scissors },
  { href: "/dashboard/availability", label: "Availability", icon: Clock },
  { href: "/dashboard/earnings", label: "Earnings", icon: Wallet },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardNav({ unread, providerId }: { unread: number; providerId?: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-surface lg:block">
      <div className="sticky top-0 flex h-screen flex-col p-4">
        <Link href="/" className="flex items-center gap-2 px-2 py-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white text-base font-bold">
            B
          </span>
          <span className="font-bold">
            Book<span className="text-primary">Appoint</span>
          </span>
        </Link>

        <div className="mt-6 flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary-soft text-white"
                    : "text-zinc-400 hover:bg-surface-2 hover:text-white"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="pt-4">
          <Link
            href="/dashboard/notifications"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-surface-2 hover:text-white"
          >
            <Bell className="h-4 w-4" />
            Notifications
            {unread > 0 && (
              <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-white">
                {unread}
              </span>
            )}
          </Link>
          <Link
            href={providerId ? `/providers/${providerId}` : "/"}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-surface-2 hover:text-white"
          >
            View my profile
          </Link>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav({ unread }: { unread: number }) {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-around border-t border-border bg-surface lg:hidden overflow-x-auto pb-[env(safe-area-inset-bottom)]">
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-w-[60px] flex-col items-center gap-1 px-2 py-2 text-[10px] ${
              active ? "text-primary" : "text-zinc-500"
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}