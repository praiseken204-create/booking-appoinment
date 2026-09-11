import { prisma } from "@/lib/prisma";
import { getCurrentProvider } from "@/lib/provider";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProviderSettingsPage() {
  const current = await getCurrentProvider();
  if (!current) return null;
  const { profile } = current;

  const notificationPrefs = await prisma.notificationPreference.findFirst({
    where: { userId: profile.userId },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Update your business preferences and notification settings.
        </p>
      </div>

      {/* Basic Info */}
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Business Information</h2>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-zinc-500">Business Name</p>
            <p className="mt-1 font-medium">{profile.businessName}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Email</p>
            <p className="mt-1 font-medium">{profile.contactEmail}</p>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Notification Preferences</h2>
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-sm text-zinc-500">New Booking Alert</p>
            <p className="mt-1">
              <span className="text-zinc-500">Email: </span>
              <span className={`font-medium ${notificationPrefs?.email ? "text-emerald-400" : "text-zinc-500"}`}>
                {notificationPrefs?.email ? "Enabled" : "Disabled"}
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Appointment Reminder</p>
            <p className="mt-1">
              <span className="text-zinc-500">SMS: </span>
              <span className={`font-medium ${notificationPrefs?.sms ? "text-emerald-400" : "text-zinc-500"}`}>
                {notificationPrefs?.sms ? "Enabled" : "Disabled"}
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Payment Received</p>
            <p className="mt-1">
              <span className="text-zinc-500">Push: </span>
              <span className={`font-medium ${notificationPrefs?.push ? "text-emerald-400" : "text-zinc-500"}`}>
                {notificationPrefs?.push ? "Enabled" : "Disabled"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Account Security */}
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Account Security</h2>
        </div>
        <div className="mt-4">
          <p className="text-sm text-zinc-500">
            Change your password or manage connected accounts.
          </p>
          <div className="mt-3 grid gap-2">
            <button className="btn btn-secondary text-sm w-full">
              Change Password
            </button>
            <button className="btn btn-outline text-sm w-full">
              Manage API Keys
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}