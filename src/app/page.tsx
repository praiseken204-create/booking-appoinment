import Link from "next/link";
import {
  Search,
  MapPin,
  Sparkles,
  CalendarClock,
  ShieldCheck,
  ArrowRight,
  Star,
  BadgeCheck,
  Zap,
  Clock,
  CreditCard,
  Bell,
} from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/constants";
import { HeroSearch } from "@/components/home/hero-search";
import { ProviderCard } from "@/components/provider-card";

export const dynamic = "force-dynamic";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  sparkles: <Sparkles className="h-5 w-5" />,
  "heart-pulse": <Sparkles className="h-5 w-5" />,
  dumbbell: <Sparkles className="h-5 w-5" />,
  "graduation-cap": <Sparkles className="h-5 w-5" />,
  briefcase: <Sparkles className="h-5 w-5" />,
  camera: <Sparkles className="h-5 w-5" />,
  home: <Sparkles className="h-5 w-5" />,
  flower: <Sparkles className="h-5 w-5" />,
  grid: <Sparkles className="h-5 w-5" />,
};

export default async function HomePage() {
  const [featuredProviders, popularCategories] = await Promise.all([
    prisma.providerProfile.findMany({
      where: { isActive: true, isSuspended: false },
      take: 6,
      orderBy: [{ isVerified: "desc" }, { rating: "desc" }],
      include: {
        user: { select: { name: true, image: true } },
        services: {
          where: { isActive: true },
          orderBy: { price: "asc" },
          take: 1,
          select: { price: true, name: true, currency: true },
        },
      },
    }),
    prisma.providerProfile.groupBy({
      by: ["category"],
      _count: { _all: true },
      orderBy: { _count: { category: "desc" } },
    }),
  ]);

  const categoryCounts = new Map(
    popularCategories.map((c) => [c.category, c._count._all])
  );

  return (
    <>
      <PublicHeader />
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-soft/40 via-transparent to-background pointer-events-none" />
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-[48rem] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="container-app relative py-20 md:py-28 text-center">
            <div className="mx-auto max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2/60 px-4 py-1.5 text-xs font-medium text-zinc-300">
                <Zap className="h-3.5 w-3.5 text-primary" />
                Book the right service at the right time
              </div>
              <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight md:text-6xl">
                Discover providers.
                <br />
                <span className="text-primary">Book instantly.</span>
              </h1>
              <p className="mt-5 text-base text-zinc-400 md:text-lg">
                From barbers to doctors to trainers — find trusted providers,
                view real-time availability, and confirm your appointment with
                a few taps.
              </p>
            </div>

            <div className="mx-auto mt-10 max-w-2xl">
              <HeroSearch />
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Secure payments
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-sky-400" />
                Real-time availability
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Bell className="h-4 w-4 text-amber-400" />
                Smart reminders
              </span>
            </div>
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="container-app py-12">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Popular Categories</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Find the right service for what you need
              </p>
            </div>
            <Link
              href="/explore"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.filter((c) => c.slug !== "other" && c.slug !== "beauty-spa")
              .slice(0, 6)
              .map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/explore?category=${cat.slug}`}
                  className="card flex flex-col items-center gap-3 text-center transition-all duration-200 hover:-translate-y-1 hover:border-primary/40"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                    {CATEGORY_ICONS[cat.icon] || <Sparkles className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{cat.name}</p>
                    <p className="text-xs text-zinc-500">
                      {categoryCounts.get(cat.name) || 0} providers
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </section>

        {/* FEATURED PROVIDERS */}
        <section className="container-app py-12">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Featured Providers</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Hand-picked professionals ready to help
              </p>
            </div>
          </div>

          {featuredProviders.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProviders.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          ) : (
            <div className="card mt-6 py-16 text-center text-sm text-zinc-500">
              No providers available yet.
            </div>
          )}
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="container-app py-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight">How It Works</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Booking an appointment takes less than a minute
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: <Search className="h-6 w-6" />,
                step: "01",
                title: "Find a Service",
                desc: "Search and discover trusted providers in your area with transparent pricing and real reviews.",
              },
              {
                icon: <CalendarClock className="h-6 w-6" />,
                step: "02",
                title: "Choose a Time",
                desc: "Select a date and pick an available time slot that works for you. Live availability, always up to date.",
              },
              {
                icon: <CreditCard className="h-6 w-6" />,
                step: "03",
                title: "Confirm Your Booking",
                desc: "Complete payment if required, receive instant confirmation, and get reminders before your appointment.",
              },
            ].map((s) => (
              <div key={s.step} className="card relative overflow-hidden transition-all hover:border-primary/40">
                <span className="absolute -right-2 -top-4 text-6xl font-bold text-surface-2 select-none">
                  {s.step}
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                  {s.icon}
                </div>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container-app py-16">
          <div className="card relative overflow-hidden bg-gradient-to-br from-primary-soft via-card to-card p-8 md:p-12">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative max-w-xl">
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Are you a service provider?
              </h2>
              <p className="mt-3 text-sm text-zinc-400 md:text-base">
                Create your free profile, set your services and availability,
                and start accepting bookings today. Manage everything from a
                single dashboard.
              </p>
              <Link
                href="/become-provider"
                className="btn btn-primary mt-6 inline-flex"
              >
                Become a Provider
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}