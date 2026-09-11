"use client";

import Image from "next/image";
import { User } from "lucide-react";

export function Avatar({
  src,
  name,
  size = 40,
  className = "",
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size, fontSize: size * 0.4 };
  if (src) {
    return (
      <Image
        src={src}
        alt={name || "Avatar"}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        style={style}
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-primary-soft text-primary font-semibold ${className}`}
      style={style}
    >
      {name ? name.charAt(0).toUpperCase() : <User className="h-1/2 w-1/2" />}
    </div>
  );
}