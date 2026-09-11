"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);

    try {
      const res = await signIn("credentials", {
        email: data.get("email"),
        password: data.get("password"),
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      toast("success", "Welcome back!");
      router.push(callbackUrl || "/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div>
        <label className="label">Email</label>
        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          className="input"
          autoComplete="email"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="label">Password</label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <input
          type="password"
          name="password"
          required
          placeholder="••••••••"
          className="input"
          autoComplete="current-password"
        />
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary mt-2 py-3">
        {loading ? "Signing in..." : "Login"}
      </button>

      <p className="text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}