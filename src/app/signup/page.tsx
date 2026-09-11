import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <>
      <PublicHeader />
      <main className="container-app flex flex-1 items-center justify-center py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Whether you&apos;re booking or offering services
            </p>
          </div>
          <div className="card">
            <SignupForm />
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}