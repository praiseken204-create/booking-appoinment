import Link from "next/link";
import { SearchX } from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export default function NotFound() {
  return (
    <>
      <PublicHeader />
      <main className="container-app flex flex-1 items-center justify-center py-24">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-2">
            <SearchX className="h-9 w-9 text-zinc-500" />
          </div>
          <h1 className="mt-6 text-3xl font-bold">Page not found</h1>
          <p className="mt-2 text-sm text-zinc-500">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <Link href="/" className="btn btn-primary mt-6">
            Back to Home
          </Link>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}