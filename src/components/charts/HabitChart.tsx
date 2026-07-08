"use client";

import { useState } from "react";
import type { Habit } from "@/lib/types";
import { toISODate } from "@/lib/utils";

/**
 * Habit completion over the last `days` days — one thin bar per habit,
 * sequential single-hue (blush) since this encodes magnitude, direct-labeled
 * with emoji + name + %, per-bar tooltip. Single measure → no legend.
 */
export function HabitChart({ habits, days = 30 }: { habits: Habit[]; days?: number }) {
  const [hover, setHover] = useState<string | null>(null);

  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return toISODate(d);
  });

  const rows = habits.map((h) => {
    const done = dates.filter((date) => (h.log?.[date]?.length ?? 0) > 0).length;
    return { habit: h, pct: done / days, done };
  }).sort((a, b) => b.pct - a.pct);

  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-ink-soft">Add a habit to see progress here.</p>;
  }

  return (
    <div className="space-y-2" role="img"
      aria-label={`Habit completion last ${days} days: ${rows.map((r) => `${r.habit.name} ${Math.round(r.pct * 100)}%`).join(", ")}`}>
      {rows.map(({ habit, pct, done }) => {
        const isHover = hover === habit.id;
        return (
          <div key={habit.id} className="group relative flex items-center gap-2"
            onMouseEnter={() => setHover(habit.id)} onMouseLeave={() => setHover(null)}>
            <span className="w-32 shrink-0 truncate text-xs font-semibold text-ink-soft">
              <span aria-hidden className="mr-1">{habit.emoji}</span>{habit.name}
            </span>
            <div className="relative h-4 flex-1 rounded-full bg-ink-soft/8 dark:bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blush-400 to-blush-600 transition-all duration-500"
                style={{ width: `max(${pct * 100}%, ${done > 0 ? "4px" : "0px"})`, opacity: hover && !isHover ? 0.45 : 1 }}
              />
              {isHover && (
                <span className="glass absolute -top-9 left-0 z-10 whitespace-nowrap rounded-xl px-2.5 py-1 text-xs font-semibold">
                  {habit.emoji} {habit.name}: {done}/{days} days
                </span>
              )}
            </div>
            <span className="w-10 text-right text-xs font-bold tabular-nums text-ink-soft">
              {Math.round(pct * 100)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
