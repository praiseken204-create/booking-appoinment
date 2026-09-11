import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  return (
    <>
      <PublicHeader />
      <main className="container-app flex flex-1 items-center justify-center py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Log in to manage your bookings
            </p>
          </div>
          <div className="card">
            <LoginForm />
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}