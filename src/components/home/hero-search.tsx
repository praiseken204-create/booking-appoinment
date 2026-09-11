"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ChevronDown } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (location) params.set("location", location);
    if (category) params.set("category", category);
    router.push(`/explore?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="card flex flex-col gap-3 border-border bg-surface-2 p-3 md:flex-row md:items-center"
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search services or providers..."
          className="input pl-9"
        />
      </div>
      <div className="relative md:w-44">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          className="input pl-9"
        />
      </div>
      <div className="relative md:w-48">
        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input appearance-none"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn btn-primary md:px-6">
        <Search className="h-4 w-4" />
        Search
      </button>
    </form>
  );
}