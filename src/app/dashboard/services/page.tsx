import { prisma } from "@/lib/prisma";
import { getCurrentProvider } from "@/lib/provider";
import { formatCurrency } from "@/lib/format";
import { useToast } from "@/components/ui/toast";
import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";

export default function ProviderServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { toast } = useToast();
  const [current, setCurrent] = useState<{ id: string; profile: { id: string } } | null>(null);
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    ;(async () => {
      const profile = await getCurrentProvider();
      if (!profile) return;
      setCurrent(profile);
      const { search } = await searchParams;
      const data = await prisma.service.findMany({
        where: {
          providerId: profile.profile.id,
          ...(search && {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
            ],
          }),
        },
        orderBy: { name: "asc" },
      });
      setServices(data);
    })();
  }, [searchParams]);

  if (!current) return null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Manage Services
        </h1>
        <button className="btn btn-primary">
          Add Service
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-border bg-surface-2">
              <th className="table-th text-left">Service</th>
              <th className="table-th text-left">Duration</th>
              <th className="table-th text-left">Price</th>
              <th className="table-th text-left">Deposit</th>
              <th className="table-th text-left">Buffer</th>
              <th className="table-th text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-zinc-500">
                  No services found.
                </td>
              </tr>
            ) : (
              services.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="table-td font-medium">{s.name}</td>
                  <td className="table-td text-zinc-400">{s.durationMinutes} min</td>
                  <td className="table-td text-primary">{formatCurrency(s.price)}</td>
                  <td className="table-td text-zinc-400">{formatCurrency(s.depositAmount)}</td>
                  <td className="table-td text-zinc-400">{s.bufferBefore} / {s.bufferAfter}</td>
                  <td className="table-td">
                    <button className="text-sm text-primary hover:underline">Edit</button>
                    <button
                      className="text-sm text-red-400 hover:underline"
                      onClick={() => {
                        if (
                          confirm(
                            `Remove "${s.name}"? This will also remove associated availability slots.`
                          )
                        ) {
                          prisma.service
                            .delete({ where: { id: s.id } })
                            .then(() => {
                              toast("success", `Service removed: "${s.name}"`);
                              // reload not possible in SSR; use next navigation if client
                            });
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}