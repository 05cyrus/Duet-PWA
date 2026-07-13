"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { useCoupleCollection } from "@/hooks/useCoupleCollection";
import { MEMORY_KIND_META } from "@/lib/content";
import { limitTo, orderBy } from "@/lib/firebase/db";
import type { Memory } from "@/lib/types";
import { isoToday } from "@/lib/utils";

/**
 * "On this day" memory — prefers a memory whose month/day matches today
 * (from any year), otherwise falls back to the most recent memory.
 */
export function TodayMemory() {
  const { items } = useCoupleCollection<Memory>(
    "timeline",
    () => [orderBy("date", "desc"), limitTo(60)],
  );

  const monthDay = isoToday().slice(5);
  const memory = items.find((m) => m.date.slice(5) === monthDay) ?? items[0];

  return (
    <GlassCard padded={false} className="overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4">
        <h2 className="text-sm font-bold">Today&apos;s memory</h2>
        <Link href="/timeline" className="text-xs font-semibold text-lilac-500 hover:underline">
          Timeline →
        </Link>
      </div>
      {!memory ? (
        <p className="px-5 py-6 text-center text-sm text-ink-soft">
          Your story starts now — add your first memory 📸
        </p>
      ) : (
        <Link href="/timeline" className="block">
          <div className="px-5 py-4">
            <p className="text-sm font-bold">
              <span aria-hidden className="mr-1">{MEMORY_KIND_META[memory.kind]?.emoji ?? "✨"}</span>
              {memory.title}
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs text-ink-soft">
              {memory.date.slice(5) === monthDay && memory.date !== isoToday()
                ? `On this day in ${memory.date.slice(0, 4)} — `
                : ""}
              {memory.caption || memory.location || "A moment worth keeping."}
            </p>
          </div>
        </Link>
      )}
    </GlassCard>
  );
}
