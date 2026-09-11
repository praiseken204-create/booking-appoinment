"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import { User, Store } from "lucide-react";

export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [role, setRole] = useState<"CUSTOMER" | "PROVIDER">("CUSTOMER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          password: data.get("password"),
          role,
          businessName: data.get("businessName"),
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Registration failed");
        setLoading(false);
        return;
      }

      toast("success", "Account created!", "You can now log in.");
      router.push("/login");
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
        <label className="label">I want to...</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("CUSTOMER")}
            className={`btn justify-center border py-3 ${
              role === "CUSTOMER"
                ? "border-primary bg-primary-soft text-white"
                : "border-border bg-surface-2 text-zinc-400"
            }`}
          >
            <User className="h-4 w-4" />
            Book Services
          </button>
          <button
            type="button"
            onClick={() => setRole("PROVIDER")}
            className={`btn justify-center border py-3 ${
              role === "PROVIDER"
                ? "border-primary bg-primary-soft text-white"
                : "border-border bg-surface-2 text-zinc-400"
            }`}
          >
            <Store className="h-4 w-4" />
            Offer Services
          </button>
        </div>
      </div>

      <div>
        <label className="label">{role === "PROVIDER" ? "Your Name" : "Full Name"}</label>
        <input type="text" name="name" required placeholder="John Doe" className="input" />
      </div>

      {role === "PROVIDER" && (
        <div>
          <label className="label">Business Name</label>
          <input
            type="text"
            name="businessName"
            required
            placeholder="Elite Barbers"
            className="input"
          />
        </div>
      )}

      <div>
        <label className="label">Email</label>
        <input type="email" name="email" required placeholder="you@example.com" className="input" />
      </div>

      <div>
        <label className="label">Phone</label>
        <input type="tel" name="phone" placeholder="+234 800 000 0000" className="input" />
      </div>

      <div>
        <label className="label">Password</label>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          placeholder="At least 8 characters"
          className="input"
        />
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary mt-2 py-3">
        {loading ? "Creating account..." : "Create Account"}
      </button>

      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Login
        </Link>
      </p>
    </form>
  );
}