"use client";

import { MOOD_META } from "@/lib/content";
import type { MoodEntry } from "@/lib/types";
import { toISODate } from "@/lib/utils";
import { useTheme } from "@/providers/ThemeProvider";

interface MoodStripProps {
  entries: MoodEntry[];
  uids: [string, string | null];
  names: Record<string, string>;
  days?: number;
}

/**
 * Two-row mood calendar strip (one row per partner, last N days).
 * Each cell shows the mood emoji on the mood's validated color — identity is
 * carried by the emoji, color reinforces it. Hover reveals date + mood name.
 */
export function MoodStrip({ entries, uids, names, days = 14 }: MoodStripProps) {
  const { resolved } = useTheme();
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return toISODate(d);
  });

  const byKey = new Map(entries.map((e) => [`${e.date}_${e.uid}`, e]));

  return (
    <div className="space-y-1.5">
      {uids.filter(Boolean).map((uid) => (
        <div key={uid} className="flex items-center gap-2">
          <span className="w-14 shrink-0 truncate text-xs font-semibold text-ink-soft">
            {names[uid!] ?? "…"}
          </span>
          <div className="flex flex-1 gap-[3px]">
            {dates.map((date) => {
              const entry = byKey.get(`${date}_${uid}`);
              const meta = entry ? MOOD_META[entry.mood] : null;
              return (
                <span
                  key={date}
                  title={`${date}${meta ? ` — ${meta.label}` : " — no check-in"}`}
                  className="grid aspect-square min-w-0 flex-1 place-items-center rounded-md text-[10px] leading-none"
                  style={{
                    background: meta ? meta.chart[resolved] : "color-mix(in oklab, currentColor 8%, transparent)",
                  }}
                >
                  <span aria-hidden>{meta?.emoji ?? ""}</span>
                  <span className="sr-only">{`${date}: ${meta ? meta.label : "no check-in"}`}</span>
                </span>
              );
            })}
          </div>
        </div>
      ))}
      <div className="flex justify-between pl-16 text-[10px] text-ink-soft/70">
        <span>{days} days ago</span>
        <span>today</span>
      </div>
    </div>
  );
}
