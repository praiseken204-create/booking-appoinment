import Link from "next/link";
import { Search, MapPin, SlidersHorizontal, X } from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/constants";
import { ProviderCard } from "@/components/provider-card";
import { ExploreFilters } from "@/components/explore/filters";

export const dynamic = "force-dynamic";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    location?: string;
    category?: string;
    sort?: string;
  }>;
}) {
  const { q, location, category, sort } = await searchParams;

  const where: Record<string, unknown> = {
    isActive: true,
    isSuspended: false,
  };

  if (location) {
    where.location = { contains: location } as never;
  }

  if (category) {
    const cat = CATEGORIES.find((c) => c.slug === category);
    if (cat) where.category = cat.name;
  }

  const providers = await prisma.providerProfile.findMany({
    where: where as never,
    include: {
      user: { select: { name: true, image: true } },
      services: {
        where: { isActive: true },
        orderBy: { price: "asc" },
        take: 1,
        select: { price: true, name: true, currency: true },
      },
    },
    orderBy:
      sort === "rating"
        ? [{ rating: "desc" }]
        : sort === "name"
          ? [{ businessName: "asc" }]
          : [{ isVerified: "desc" }, { rating: "desc" }],
  });

  // Additional text search for query
  const filtered = q
    ? providers.filter(
        (p) =>
          p.businessName.toLowerCase().includes(q.toLowerCase()) ||
          p.category.toLowerCase().includes(q.toLowerCase()) ||
          (p.bio || "").toLowerCase().includes(q.toLowerCase()) ||
          p.services.some((s) =>
            s.name.toLowerCase().includes(q.toLowerCase())
          )
      )
    : providers;

  return (
    <>
      <PublicHeader />
      <main className="container-app py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Explore Providers</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {filtered.length} provider{filtered.length !== 1 ? "s" : ""}{" "}
              available
            </p>
          </div>
        </div>

        <ExploreFilters />

        {filtered.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        ) : (
          <div className="card mt-6 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2">
              <Search className="h-7 w-7 text-zinc-500" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No providers found</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Try adjusting your search or filters.
            </p>
          </div>
        )}
      </main>
      <PublicFooter />
    </>
  );
}