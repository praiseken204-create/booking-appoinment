import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Star,
  BadgeCheck,
  MapPin,
  Clock,
  CalendarDays,
  MessageCircle,
  Shield,
} from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";
import { DAYS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const provider = await prisma.providerProfile.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, image: true } },
      services: {
        where: { isActive: true },
        orderBy: { price: "asc" },
      },
      availability: { where: { isActive: true } },
      policies: true,
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { customer: { select: { name: true, image: true } } },
      },
    },
  });

  if (!provider || !provider.isActive || provider.isSuspended) {
    notFound();
  }

  const workingDays = DAYS.filter((_, i) =>
    provider.availability.some((a) => a.dayOfWeek === i)
  );

  return (
    <>
      <PublicHeader />
      <main className="container-app py-10">
        {/* Header card */}
        <div className="card overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary-soft via-surface-2 to-card" />
          <div className="px-6 pb-6">
            <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <Avatar
                  src={provider.profileImage || provider.user.image}
                  name={provider.businessName}
                  size={96}
                  className="border-4 border-card"
                />
                <div className="pb-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">
                      {provider.businessName}
                    </h1>
                    {provider.isVerified && (
                      <BadgeCheck className="h-5 w-5 text-sky-400" />
                    )}
                  </div>
                  <p className="text-sm text-zinc-500">{provider.category}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-semibold">
                      {provider.rating ? provider.rating.toFixed(1) : "New"}
                    </span>
                    <span className="text-xs text-zinc-600">
                      ({provider.reviewCount} reviews)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 text-sm text-zinc-400 md:grid-cols-3">
              {provider.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {provider.location}
                </div>
              )}
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Open: {workingDays.length > 0 ? workingDays.join(", ") : "By appointment"}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                {provider.availability[0]
                  ? `${provider.availability[0].startTime} - ${provider.availability[0].endTime}`
                  : "Flexible"}
              </div>
            </div>

            {provider.bio && (
              <p className="mt-5 max-w-3xl text-sm leading-relaxed text-zinc-400">
                {provider.bio}
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Services */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold tracking-tight">Services</h2>
            <div className="mt-4 flex flex-col gap-4">
              {provider.services.map((service) => (
                <div key={service.id} className="card transition-all hover:border-primary/40">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="font-semibold">{service.name}</h3>
                      <p className="mt-1 text-sm text-zinc-500 line-clamp-2">
                        {service.description}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {service.durationMinutes} min
                        </span>
                        {service.depositAmount > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Shield className="h-3.5 w-3.5" />
                            Deposit {formatCurrency(service.depositAmount)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {formatCurrency(service.price)}
                        </p>
                        {service.depositAmount > 0 && (
                          <p className="text-xs text-zinc-500">
                            Deposit: {formatCurrency(service.depositAmount)}
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/book?provider=${provider.id}&service=${service.id}`}
                        className="btn btn-primary"
                      >
                        Book
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {provider.services.length === 0 && (
                <div className="card py-12 text-center text-sm text-zinc-500">
                  This provider hasn&apos;t added any services yet.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="font-semibold">Business hours</h3>
              <div className="mt-4 space-y-2 text-sm">
                {DAYS.map((day, i) => {
                  const periods = provider.availability.filter(
                    (a) => a.dayOfWeek === i
                  );
                  return (
                    <div key={day} className="flex items-center justify-between">
                      <span className="text-zinc-500">{day}</span>
                      <span className={periods.length ? "text-zinc-300" : "text-zinc-700"}>
                        {periods.length
                          ? periods
                              .map((p) => `${p.startTime} - ${p.endTime}`)
                              .join(", ")
                          : "Closed"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold">Why book here</h3>
              <ul className="mt-4 space-y-3 text-sm text-zinc-400">
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  Secure booking & payment
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-sky-400" />
                  Real-time availability
                </li>
                <li className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  {provider.reviewCount} verified reviews
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Reviews</h2>
            {provider.rating > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {provider.rating.toFixed(1)}
                </span>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.round(provider.rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-700"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {provider.reviews.map((review) => (
              <div key={review.id} className="card">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={review.customer.image}
                    name={review.customer.name}
                    size={40}
                  />
                  <div>
                    <p className="text-sm font-semibold">{review.customer.name}</p>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-zinc-700"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-3 text-sm text-zinc-400">{review.comment}</p>
                )}
              </div>
            ))}
            {provider.reviews.length === 0 && (
              <div className="card col-span-2 py-12 text-center text-sm text-zinc-500">
                No reviews yet. Be the first to book!
              </div>
            )}
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}