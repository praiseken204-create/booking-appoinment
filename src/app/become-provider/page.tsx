import Link from "next/link";
import {
  Store,
  CalendarClock,
  CreditCard,
  LineChart,
  Bell,
  ShieldCheck,
  ArrowRight,
  Check,
} from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export default function BecomeProviderPage() {
  const features = [
    {
      icon: <Store className="h-5 w-5" />,
      title: "Create your profile",
      desc: "Showcase your business, services, and pricing to thousands of customers.",
    },
    {
      icon: <CalendarClock className="h-5 w-5" />,
      title: "Control your schedule",
      desc: "Set working hours, block times, and manage everything from one calendar.",
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      title: "Accept payments",
      desc: "Collect deposits or full payments securely with Paystack and Flutterwave.",
    },
    {
      icon: <LineChart className="h-5 w-5" />,
      title: "Track earnings",
      desc: "Monitor revenue, appointments, and performance from your dashboard.",
    },
    {
      icon: <Bell className="h-5 w-5" />,
      title: "Smart notifications",
      desc: "Get notified instantly about new bookings, cancellations, and changes.",
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: "No double bookings",
      desc: "Our booking engine prevents conflicts so your calendar stays accurate.",
    },
  ];

  const steps = [
    "Create your free account",
    "Complete your business profile",
    "Add your services and pricing",
    "Set your availability",
    "Start accepting bookings",
  ];

  return (
    <>
      <PublicHeader />
      <main>
        <section className="container-app py-16 text-center md:py-20">
          <div className="mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2/60 px-4 py-1.5 text-xs font-medium text-zinc-300">
              <Store className="h-3.5 w-3.5 text-primary" />
              For service providers
            </span>
            <h1 className="mt-6 text-3xl font-bold tracking-tight md:text-5xl">
              Grow your business with{" "}
              <span className="text-primary">BookAppoint</span>
            </h1>
            <p className="mt-4 text-base text-zinc-400 md:text-lg">
              Reach new customers, streamline bookings, and get paid faster.
              Everything you need to run your service business in one place.
            </p>
            <Link href="/signup" className="btn btn-primary mt-8 px-8 py-3 text-base">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="container-app pb-16">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="card transition-all hover:border-primary/40">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  {f.icon}
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-zinc-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container-app pb-16">
          <div className="card mx-auto max-w-2xl">
            <h2 className="text-center text-xl font-bold">How to get started</h2>
            <ol className="mt-6 space-y-4">
              {steps.map((step, i) => (
                <li key={step} className="flex items-center gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-sm text-zinc-300">{step}</span>
                  {i < steps.length - 1 && <Check className="ml-auto h-4 w-4 text-emerald-400" />}
                </li>
              ))}
            </ol>
            <div className="mt-8 text-center">
              <Link href="/signup" className="btn btn-primary">
                Create your free account
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}