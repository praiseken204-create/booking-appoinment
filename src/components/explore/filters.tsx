"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, SlidersHorizontal } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

export function ExploreFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.push(`/explore?${params.toString()}`);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        update({
          q: form.get("q") as string,
          location: form.get("location") as string,
        });
      }}
      className="mt-5 flex flex-col gap-3 md:flex-row md:items-center"
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          name="q"
          defaultValue={searchParams.get("q") || ""}
          placeholder="Search providers or services..."
          className="input pl-9"
        />
      </div>
      <div className="relative md:w-48">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          name="location"
          defaultValue={searchParams.get("location") || ""}
          placeholder="Location"
          className="input pl-9"
        />
      </div>
      <div className="relative md:w-52">
        <SlidersHorizontal className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        <select
          value={searchParams.get("category") || ""}
          onChange={(e) => update({ category: e.target.value })}
          className="input appearance-none pl-9"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn btn-secondary">
        Apply Filters
      </button>
    </form>
  );
}