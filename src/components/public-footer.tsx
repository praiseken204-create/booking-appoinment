import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-border/60 mt-16">
      <div className="container-app py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white text-lg font-bold">
                B
              </span>
              <span className="text-lg font-bold tracking-tight">
                Book<span className="text-primary">Appoint</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-zinc-500">
              Book the right service at the right time. Discover providers,
              manage appointments, and pay securely.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-zinc-200 mb-3">Explore</h4>
            <div className="flex flex-col gap-2 text-sm text-zinc-500">
              <Link href="/explore" className="hover:text-zinc-300">Find Providers</Link>
              <Link href="/#how-it-works" className="hover:text-zinc-300">How It Works</Link>
              <Link href="/categories/beauty" className="hover:text-zinc-300">Categories</Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-zinc-200 mb-3">Providers</h4>
            <div className="flex flex-col gap-2 text-sm text-zinc-500">
              <Link href="/become-provider" className="hover:text-zinc-300">Become a Provider</Link>
              <Link href="/signup" className="hover:text-zinc-300">Create Account</Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-border/60 pt-6 text-xs text-zinc-600">
          <p>&copy; {new Date().getFullYear()} BookAppoint. All rights reserved.</p>
          <p>Built for providers and customers.</p>
        </div>
      </div>
    </footer>
  );
}