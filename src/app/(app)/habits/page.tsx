"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { HabitChart } from "@/components/charts/HabitChart";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useCoupleCollection } from "@/hooks/useCoupleCollection";
import { HABIT_PRESETS } from "@/lib/content";
import { addToCouple, awardXp, deleteFromCouple, orderBy, updateInCouple } from "@/lib/firebase/db";
import type { Habit } from "@/lib/types";
import { cn, isoToday, toISODate } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useCouple } from "@/providers/CoupleProvider";
import { useToast } from "@/providers/ToastProvider";

/** Current streak = consecutive days (ending today/yesterday) with ≥1 completion. */
function computeStreak(log: Record<string, string[]>): number {
  let streak = 0;
  const d = new Date();
  if (!(log[toISODate(d)]?.length)) d.setDate(d.getDate() - 1); // allow today pending
  while (log[toISODate(d)]?.length) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export default function HabitsPage() {
  const { user } = useAuth();
  const { coupleId, couple, partnerUid } = useCouple();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customEmoji, setCustomEmoji] = useState("💫");

  const { items: habits, loading } = useCoupleCollection<Habit>("habits", () => [orderBy("createdAt", "asc")]);
  const today = isoToday();

  const addHabit = async (name: string, emoji: string) => {
    if (!coupleId || !name.trim()) return;
    await addToCouple(coupleId, "habits", {
      name: name.trim(), emoji, schedule: [], log: {}, streak: 0,
    });
    setAddOpen(false);
    setCustomName("");
    toast(`Habit added: ${emoji} ${name}`, "success");
  };

  const toggleToday = async (habit: Habit) => {
    if (!coupleId || !user) return;
    const doneBy = habit.log?.[today] ?? [];
    const mine = doneBy.includes(user.uid);
    const nextDoneBy = mine ? doneBy.filter((u) => u !== user.uid) : [...doneBy, user.uid];
    const log = { ...(habit.log ?? {}), [today]: nextDoneBy };
    await updateInCouple(coupleId, "habits", habit.id, { log, streak: computeStreak(log) });
    if (!mine) awardXp(coupleId, 5, 1).catch(() => {});
  };

  // Last 7 day dots for each habit row.
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return toISODate(d);
  });

  return (
    <div className="space-y-4">
      <PageHeader
        emoji="✅"
        title="Habit Tracker"
        subtitle="Little rituals, done together."
        action={<Button onClick={() => setAddOpen(true)}>+ New habit</Button>}
      />

      {loading ? (
        <CardSkeleton rows={4} />
      ) : habits.length === 0 ? (
        <EmptyState
          emoji="🌱"
          title="No habits yet"
          subtitle="Start with a date night or a daily walk."
          action={<Button onClick={() => setAddOpen(true)}>Pick your first habit</Button>}
        />
      ) : (
        <>
          <div className="space-y-3">
            {habits.map((h) => {
              const doneBy = h.log?.[today] ?? [];
              const iDid = user ? doneBy.includes(user.uid) : false;
              const partnerDid = partnerUid ? doneBy.includes(partnerUid) : false;
              return (
                <motion.div key={h.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <GlassCard className="flex items-center gap-4">
                    <button
                      onClick={() => toggleToday(h)}
                      aria-pressed={iDid}
                      aria-label={`Mark ${h.name} done today`}
                      className={cn(
                        "grid size-12 shrink-0 place-items-center rounded-2xl text-2xl transition-all",
                        iDid
                          ? "bg-gradient-to-br from-blush-500 to-lilac-500 shadow-lg shadow-blush-500/30"
                          : "bg-white/50 hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10",
                      )}
                    >
                      {iDid ? "✓" : h.emoji}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{h.name}</p>
                      <p className="text-xs text-ink-soft">
                        🔥 {computeStreak(h.log ?? {})} day streak
                        {partnerDid && <span> · {couple?.memberNames[partnerUid!]} did it ✓</span>}
                      </p>
                      <div className="mt-1.5 flex gap-1" aria-label="Last 7 days">
                        {week.map((d) => {
                          const c = h.log?.[d]?.length ?? 0;
                          return (
                            <span key={d} title={d} className={cn(
                              "size-3 rounded-full",
                              c >= 2 ? "bg-blush-500" : c === 1 ? "bg-blush-300" : "bg-ink-soft/15",
                            )} />
                          );
                        })}
                      </div>
                    </div>
                    <button
                      onClick={() => confirm(`Delete habit "${h.name}"?`) && coupleId && deleteFromCouple(coupleId, "habits", h.id)}
                      aria-label={`Delete ${h.name}`}
                      className="text-ink-soft/40 transition-colors hover:text-rose-500"
                    >
                      ✕
                    </button>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>

          <GlassCard>
            <h2 className="mb-3 text-sm font-bold">Completion — last 30 days</h2>
            <HabitChart habits={habits} />
          </GlassCard>
        </>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New habit 🌱">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {HABIT_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => addHabit(p.name, p.emoji)}
                className="rounded-2xl bg-white/50 px-2 py-3 text-center text-xs font-semibold transition-colors hover:bg-blush-100 dark:bg-white/5 dark:hover:bg-white/10"
              >
                <span className="block text-xl" aria-hidden>{p.emoji}</span>
                {p.name}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <Input label="Custom emoji" value={customEmoji} maxLength={4}
              onChange={(e) => setCustomEmoji(e.target.value)} className="w-24" />
            <Input label="Custom habit" value={customName} placeholder="Water the plants"
              onChange={(e) => setCustomName(e.target.value)} className="flex-1" />
            <Button onClick={() => addHabit(customName, customEmoji || "💫")}>Add</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
