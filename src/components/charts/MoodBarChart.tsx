"use client";

import { useState } from "react";
import { MOOD_META } from "@/lib/content";
import { MOODS, type Mood, type MoodEntry } from "@/lib/types";
import { useTheme } from "@/providers/ThemeProvider";

/**
 * Horizontal bar chart of mood counts over a period.
 * Each bar is a distinct mood entity: emoji + name direct-labeled on every
 * mark (identity never color-alone), thin bars with rounded data ends,
 * count labels at the end, per-bar hover tooltip, no legend needed.
 */
export function MoodBarChart({ entries, title }: { entries: MoodEntry[]; title: string }) {
  const { resolved } = useTheme();
  const [hover, setHover] = useState<Mood | null>(null);

  const counts = MOODS.map((m) => ({
    mood: m,
    count: entries.filter((e) => e.mood === m).length,
  }));
  const max = Math.max(1, ...counts.map((c) => c.count));
  const total = entries.length;

  return (
    <figure>
      <figcaption className="mb-3 text-sm font-bold">{title}</figcaption>
      {total === 0 ? (
        <p className="py-6 text-center text-sm text-ink-soft">No mood check-ins yet.</p>
      ) : (
        <div className="space-y-2" role="img" aria-label={`Mood distribution: ${counts.filter(c => c.count).map(c => `${MOOD_META[c.mood].label} ${c.count}`).join(", ")}`}>
          {counts.map(({ mood, count }) => {
            const meta = MOOD_META[mood];
            const pct = (count / max) * 100;
            const isHover = hover === mood;
            return (
              <div
                key={mood}
                className="group relative flex items-center gap-2"
                onMouseEnter={() => setHover(mood)}
                onMouseLeave={() => setHover(null)}
              >
                <span className="w-24 shrink-0 truncate text-xs font-semibold text-ink-soft">
                  <span aria-hidden className="mr-1">{meta.emoji}</span>
                  {meta.label}
                </span>
                <div className="relative h-4 flex-1 overflow-visible rounded-full bg-ink-soft/8 dark:bg-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `max(${pct}%, ${count > 0 ? "4px" : "0px"})`,
                      background: meta.chart[resolved],
                      opacity: hover && !isHover ? 0.45 : 1,
                    }}
                  />
                  {isHover && count > 0 && (
                    <span className="glass absolute -top-9 left-0 z-10 whitespace-nowrap rounded-xl px-2.5 py-1 text-xs font-semibold">
                      {meta.emoji} {meta.label}: {count} day{count === 1 ? "" : "s"} ({Math.round((count / total) * 100)}%)
                    </span>
                  )}
                </div>
                <span className="w-6 text-right text-xs font-bold tabular-nums text-ink-soft">{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </figure>
  );
}
