"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Bell } from "lucide-react";

export function DashboardTopBar({
  businessName,
  userId,
}: {
  businessName: string;
  userId: string;
}) {
  const router = useRouter();

  async function logout() {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    if (res.ok) {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:px-8">
      <div className="flex items-center gap-3 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white text-base font-bold">
            B
          </span>
        </Link>
      </div>
      <div className="hidden lg:block">
        <p className="text-sm font-semibold">{businessName}</p>
        <p className="text-xs text-zinc-500">Provider Dashboard</p>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/notifications"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 hover:bg-surface-2 hover:text-white"
        >
          <Bell className="h-5 w-5" />
        </Link>
        <button
          onClick={logout}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 hover:bg-surface-2 hover:text-red-400"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}