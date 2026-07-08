"use client";

import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
  ring?: boolean;
}

/** Circular avatar with gradient-initial fallback. */
export function Avatar({ src, name, size = 40, className, ring = true }: AvatarProps) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full",
        ring && "ring-2 ring-blush-300/60 dark:ring-blush-500/40",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote user photos, size unknown
        <img src={src} alt={name} className="size-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <span
          className="grid size-full place-items-center bg-gradient-to-br from-blush-400 to-lilac-500 font-bold text-white"
          style={{ fontSize: size * 0.42 }}
          aria-hidden
        >
          {initial}
        </span>
      )}
    </span>
  );
}
