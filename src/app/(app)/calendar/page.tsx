"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { nextOccurrence } from "@/components/dashboard/UpcomingEvents";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCoupleCollection } from "@/hooks/useCoupleCollection";
import { EVENT_KIND_META } from "@/lib/content";
import { addToCouple, deleteFromCouple } from "@/lib/firebase/db";
import type { CalendarEvent, EventKind } from "@/lib/types";
import { cn, isoToday, toISODate } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useCouple } from "@/providers/CoupleProvider";
import { useToast } from "@/providers/ToastProvider";

/** Google Calendar "add event" template link (no OAuth needed). */
function googleCalendarUrl(ev: CalendarEvent): string {
  const date = ev.date.replaceAll("-", "");
  const dates = ev.time
    ? `${date}T${ev.time.replace(":", "")}00/${date}T${ev.time.replace(":", "")}00`
    : `${date}/${date}`;
  const params = new URLSearchParams({
    action: "TEMPLATE", text: ev.title, dates, details: ev.notes || "From Duet 💞",
  });
  if (ev.recurring === "yearly") params.set("recur", "RRULE:FREQ=YEARLY");
  if (ev.recurring === "monthly") params.set("recur", "RRULE:FREQ=MONTHLY");
  if (ev.recurring === "weekly") params.set("recur", "RRULE:FREQ=WEEKLY");
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const { coupleId, couple } = useCouple();
  const { toast } = useToast();
  const today = isoToday();

  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selected, setSelected] = useState<string>(today);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", kind: "date" as EventKind, date: today, time: "",
    notes: "", recurring: "none" as CalendarEvent["recurring"],
  });

  const { items } = useCoupleCollection<CalendarEvent>("calendar", () => []);

  // Events shown on the grid: concrete dates + recurring projections for this month.
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    const push = (date: string, ev: CalendarEvent) => map.set(date, [...(map.get(date) ?? []), ev]);
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);

    const all = [...items];
    if (couple?.anniversary) {
      all.push({
        id: "_anniv", title: "Anniversary 💍", kind: "anniversary", date: couple.anniversary,
        time: "", notes: "", recurring: "yearly", createdBy: "", createdAt: null,
      });
    }
    for (const ev of all) {
      if (ev.recurring === "none") {
        push(ev.date, ev);
      } else {
        // project each occurrence within the displayed month
        const probe = new Date(monthStart);
        while (probe <= monthEnd) {
          const when = nextOccurrence(ev, toISODate(probe));
          if (!when) break;
          const d = new Date(when + "T00:00:00");
          if (d > monthEnd) break;
          if (d >= monthStart) push(when, ev);
          probe.setTime(d.getTime() + 86_400_000);
        }
      }
    }
    return map;
  }, [items, couple, cursor]);

  const daysGrid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startWeekday = first.getDay();
    const dayCount = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: (string | null)[] = Array(startWeekday).fill(null);
    for (let d = 1; d <= dayCount; d++) {
      cells.push(toISODate(new Date(cursor.getFullYear(), cursor.getMonth(), d)));
    }
    return cells;
  }, [cursor]);

  const selectedEvents = eventsByDate.get(selected) ?? [];

  const save = async () => {
    if (!coupleId || !user) return;
    if (!form.title.trim()) return toast("Give the event a title 📅", "info");
    await addToCouple(coupleId, "calendar", { ...form, title: form.title.trim(), createdBy: user.uid });
    setAddOpen(false);
    setForm({ title: "", kind: "date", date: selected, time: "", notes: "", recurring: "none" });
    toast("Event added 📅", "success");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        emoji="📅"
        title="Shared Calendar"
        subtitle="Birthdays, trips and every date night."
        action={<Button onClick={() => { setForm((f) => ({ ...f, date: selected })); setAddOpen(true); }}>+ Event</Button>}
      />

      <GlassCard>
        {/* Month nav */}
        <div className="mb-4 flex items-center justify-between">
          <button aria-label="Previous month"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="grid size-9 place-items-center rounded-full hover:bg-white/50 dark:hover:bg-white/10">‹</button>
          <h2 className="text-sm font-bold">
            {cursor.toLocaleDateString([], { month: "long", year: "numeric" })}
          </h2>
          <button aria-label="Next month"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="grid size-9 place-items-center rounded-full hover:bg-white/50 dark:hover:bg-white/10">›</button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <span key={i} className="py-1 text-[10px] font-bold text-ink-soft" aria-hidden>{d}</span>
          ))}
          {daysGrid.map((date, i) =>
            date === null ? <span key={`pad-${i}`} /> : (
              <button
                key={date}
                onClick={() => setSelected(date)}
                aria-pressed={selected === date}
                aria-label={new Date(date + "T00:00:00").toLocaleDateString([], { day: "numeric", month: "long" })}
                className={cn(
                  "relative mx-auto grid size-9 place-items-center rounded-xl text-xs font-semibold transition-colors sm:size-10",
                  selected === date ? "gradient-btn text-white" :
                  date === today ? "bg-blush-100 text-blush-600 dark:bg-blush-500/20 dark:text-blush-300" :
                  "hover:bg-white/60 dark:hover:bg-white/10",
                )}
              >
                {Number(date.slice(8))}
                {(eventsByDate.get(date)?.length ?? 0) > 0 && (
                  <span aria-hidden className={cn(
                    "absolute bottom-0.5 size-1.5 rounded-full",
                    selected === date ? "bg-white" : "bg-blush-500",
                  )} />
                )}
              </button>
            ),
          )}
        </div>
      </GlassCard>

      {/* Selected day events */}
      <GlassCard>
        <h2 className="mb-3 text-sm font-bold">
          {new Date(selected + "T00:00:00").toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}
        </h2>
        {selectedEvents.length === 0 ? (
          <p className="py-3 text-center text-sm text-ink-soft">Nothing planned — perfect day for a surprise 😏</p>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence>
              {selectedEvents.map((ev) => {
                const meta = EVENT_KIND_META[ev.kind] ?? EVENT_KIND_META.other;
                return (
                  <motion.li
                    key={ev.id + selected}
                    layout initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-3 rounded-2xl bg-white/40 px-3 py-2.5 dark:bg-white/5"
                  >
                    <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl text-lg"
                      style={{ background: `color-mix(in oklab, ${meta.color} 18%, transparent)` }}>
                      {meta.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{ev.title}</p>
                      <p className="text-xs text-ink-soft">
                        {meta.label}{ev.time && ` · ${ev.time}`}{ev.recurring !== "none" && ` · repeats ${ev.recurring}`}
                      </p>
                      {ev.notes && <p className="mt-0.5 truncate text-xs text-ink-soft/80">{ev.notes}</p>}
                    </div>
                    <a
                      href={googleCalendarUrl(ev)} target="_blank" rel="noreferrer"
                      title="Add to Google Calendar" aria-label="Add to Google Calendar"
                      className="text-xs font-bold text-lilac-500 hover:underline"
                    >
                      GCal ↗
                    </a>
                    {ev.id !== "_anniv" && coupleId && (
                      <button
                        onClick={() => confirm("Delete this event?") && deleteFromCouple(coupleId, "calendar", ev.id)}
                        aria-label="Delete event"
                        className="text-ink-soft/40 hover:text-rose-500"
                      >
                        ✕
                      </button>
                    )}
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </GlassCard>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New event 📅">
        <div className="space-y-3">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Dinner at our place" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Type" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as EventKind })}>
              {Object.entries(EVENT_KIND_META).map(([k, v]) => (
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </Select>
            <Select label="Repeats" value={form.recurring}
              onChange={(e) => setForm({ ...form, recurring: e.target.value as CalendarEvent["recurring"] })}>
              <option value="none">Never</option>
              <option value="yearly">Yearly</option>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </Select>
            <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Input label="Time (optional)" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </div>
          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Bring flowers 🌷" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save event</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
