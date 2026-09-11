import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentProvider } from "@/lib/provider";
import { DashboardNav, MobileNav } from "@/components/dashboard/nav";
import { DashboardTopBar } from "@/components/dashboard/topbar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await getCurrentProvider();
  if (!current || current.profile?.isSuspended) {
    redirect("/login");
  }

  const unread = await prisma.notification.count({
    where: { userId: current.session.user.id, isRead: false },
  });

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardNav unread={unread} providerId={current.profile.id} />
      <div className="flex flex-1 flex-col pb-16 lg:pb-0">
        <DashboardTopBar
          businessName={current.profile.businessName}
          userId={current.session.user.id}
        />
        <main className="container-app flex-1 py-6 lg:py-10">{children}</main>
      </div>
      <MobileNav unread={unread} />
    </div>
  );
}