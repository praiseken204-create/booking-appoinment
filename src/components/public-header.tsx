import Link from "next/link";
import { auth } from "@/lib/auth";

export async function PublicHeader() {
  const session = await auth();

  const dashboardHref =
    session?.user?.role === "ADMIN"
      ? "/admin"
      : session?.user?.role === "PROVIDER"
        ? "/dashboard"
        : "/appointments";

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container-app flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white text-lg font-bold">
            B
          </span>
          <span className="text-lg font-bold tracking-tight">
            Book<span className="text-primary">Appoint</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-400">
          <Link href="/explore" className="hover:text-white transition-colors">
            Explore Services
          </Link>
          <Link href="/#how-it-works" className="hover:text-white transition-colors">
            How It Works
          </Link>
          <Link href="/become-provider" className="hover:text-white transition-colors">
            Become a Provider
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <Link
                href={dashboardHref}
                className="hidden sm:inline-flex btn btn-secondary"
              >
                Dashboard
              </Link>
              <Link
                href={dashboardHref}
                className="sm:hidden flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-sm font-semibold"
              >
                {(session.user.name || "U").charAt(0).toUpperCase()}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex btn btn-ghost text-sm font-semibold text-zinc-300 hover:text-white"
              >
                Login
              </Link>
              <Link href="/signup" className="btn btn-primary">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}