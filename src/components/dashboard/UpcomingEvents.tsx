"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { useCoupleCollection } from "@/hooks/useCoupleCollection";
import { EVENT_KIND_META } from "@/lib/content";
import type { CalendarEvent } from "@/lib/types";
import { daysBetween, isoToday } from "@/lib/utils";
import { useCouple } from "@/providers/CoupleProvider";

/** Compute the next occurrence (ISO date) of an event, honouring recurrence. */
export function nextOccurrence(ev: CalendarEvent, todayIso: string): string | null {
  if (ev.recurring === "none") return ev.date >= todayIso ? ev.date : null;
  const today = new Date(todayIso + "T00:00:00");
  const base = new Date(ev.date + "T00:00:00");
  const next = new Date(base);
  if (ev.recurring === "yearly") {
    next.setFullYear(today.getFullYear());
    if (next < today) next.setFullYear(today.getFullYear() + 1);
  } else if (ev.recurring === "monthly") {
    next.setFullYear(today.getFullYear(), today.getMonth());
    if (next < today) next.setMonth(next.getMonth() + 1);
  } else if (ev.recurring === "weekly") {
    const diff = (base.getDay() - today.getDay() + 7) % 7;
    next.setTime(today.getTime());
    next.setDate(today.getDate() + diff);
  }
  const y = next.getFullYear(), m = String(next.getMonth() + 1).padStart(2, "0"), d = String(next.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function UpcomingEvents() {
  const { couple } = useCouple();
  const { items } = useCoupleCollection<CalendarEvent>("calendar", () => []);
  const today = isoToday();

  const upcoming: { ev: CalendarEvent; when: string }[] = items
    .map((ev) => ({ ev, when: nextOccurrence(ev, today) }))
    .filter((x): x is { ev: CalendarEvent; when: string } => x.when !== null);

  // Anniversary countdown as a synthetic event.
  if (couple?.anniversary) {
    const anniv: CalendarEvent = {
      id: "_anniv", title: "Anniversary 💍", kind: "anniversary", date: couple.anniversary,
      time: "", notes: "", recurring: "yearly", createdBy: "", createdAt: null,
    };
    const when = nextOccurrence(anniv, today);
    if (when) upcoming.push({ ev: anniv, when });
  }

  upcoming.sort((a, b) => a.when.localeCompare(b.when));
  const top = upcoming.slice(0, 5);

  return (
    <GlassCard>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold">Upcoming</h2>
        <Link href="/calendar" className="text-xs font-semibold text-lilac-500 hover:underline">
          Calendar →
        </Link>
      </div>
      {top.length === 0 ? (
        <p className="py-4 text-center text-sm text-ink-soft">Nothing planned — add a date night? 🌹</p>
      ) : (
        <ul className="space-y-2">
          {top.map(({ ev, when }) => {
            const meta = EVENT_KIND_META[ev.kind] ?? EVENT_KIND_META.other;
            const inDays = daysBetween(new Date(today + "T00:00:00"), new Date(when + "T00:00:00"));
            return (
              <li key={ev.id + when} className="flex items-center gap-3 rounded-2xl bg-white/40 px-3 py-2 dark:bg-white/5">
                <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-xl text-lg"
                  style={{ background: `color-mix(in oklab, ${meta.color} 18%, transparent)` }}>
                  {meta.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{ev.title}</p>
                  <p className="text-xs text-ink-soft">
                    {new Date(when + "T00:00:00").toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}
                    {ev.time && ` · ${ev.time}`}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-blush-100 px-2.5 py-1 text-xs font-bold text-blush-600 dark:bg-blush-500/15 dark:text-blush-300">
                  {inDays === 0 ? "Today!" : inDays === 1 ? "Tomorrow" : `${inDays}d`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </GlassCard>
  );
}
