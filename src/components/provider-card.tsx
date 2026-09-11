import Link from "next/link";
import { Star, BadgeCheck, MapPin } from "lucide-react";
import { Avatar } from "./ui/avatar";
import { formatCurrency } from "@/lib/format";
import type { Prisma } from "@/generated/prisma/client";

type ProviderWithService = Prisma.ProviderProfileGetPayload<{
  include: {
    user: { select: { name: true; image: true } };
    services: {
      where: { isActive: true };
      orderBy: { price: "asc" };
      take: 1;
      select: { price: true; name: true; currency: true };
    };
  };
}>;

export function ProviderCard({
  provider,
}: {
  provider: ProviderWithService;
}) {
  const startingPrice = provider.services[0]?.price;
  const nextAppointment = null; // would come from availability in production

  return (
    <Link
      href={`/providers/${provider.id}`}
      className="card group transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
    >
      <div className="flex items-start gap-4">
        <Avatar
          src={provider.profileImage || provider.user.image}
          name={provider.businessName}
          size={56}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-zinc-100 truncate group-hover:text-white">
              {provider.businessName}
            </h3>
            {provider.isVerified && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-sky-400" />
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">{provider.category}</p>
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold">
              {provider.rating ? provider.rating.toFixed(1) : "New"}
            </span>
            <span className="text-xs text-zinc-600">
              ({provider.reviewCount} reviews)
            </span>
          </div>
        </div>
      </div>

      {provider.location && (
        <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500">
          <MapPin className="h-3.5 w-3.5" />
          {provider.location}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
        {startingPrice !== undefined && (
          <div>
            <p className="text-[11px] uppercase tracking-wide text-zinc-600">
              Starting at
            </p>
            <p className="text-sm font-bold text-white">
              {formatCurrency(startingPrice)}
            </p>
          </div>
        )}
        <span className="btn btn-secondary text-xs px-3 py-1.5">
          View Profile
        </span>
      </div>
    </Link>
  );
}