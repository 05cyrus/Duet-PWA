"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { useHeartBurst } from "@/components/ui/HeartBurst";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useCoupleCollection } from "@/hooks/useCoupleCollection";
import { BUCKET_CATEGORIES } from "@/lib/content";
import { addToCouple, awardXp, deleteFromCouple, orderBy, updateInCouple } from "@/lib/firebase/db";
import type { BucketCategory, BucketItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useCouple } from "@/providers/CoupleProvider";
import { useToast } from "@/providers/ToastProvider";

export default function BucketListPage() {
  const { user } = useAuth();
  const { coupleId } = useCouple();
  const { toast } = useToast();
  const { burst, Hearts } = useHeartBurst();

  const [filter, setFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: "", category: "travel" as BucketCategory, target: "" });

  const { items } = useCoupleCollection<BucketItem>("bucketList", () => [orderBy("createdAt", "desc")]);

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.category === filter)),
    [items, filter],
  );
  const doneCount = items.filter((i) => i.done).length;

  const add = async () => {
    if (!coupleId || !user || !form.title.trim()) return;
    await addToCouple(coupleId, "bucketList", {
      title: form.title.trim(),
      category: form.category,
      done: false,
      notes: "",
      createdBy: user.uid,
      completedAt: null,
      ...(form.category === "savings" && Number(form.target) > 0
        ? { target: Number(form.target), saved: 0 } : {}),
    });
    setAddOpen(false);
    setForm({ title: "", category: "travel", target: "" });
    toast("Added to your list 🪣", "success");
  };

  const toggleDone = async (item: BucketItem) => {
    if (!coupleId) return;
    const nowDone = !item.done;
    await updateInCouple(coupleId, "bucketList", item.id, {
      done: nowDone, completedAt: nowDone ? new Date() : null,
    });
    if (nowDone) {
      burst(12);
      awardXp(coupleId, 15, 5).catch(() => {});
      toast("Dream unlocked! ✨", "success");
    }
  };

  const addSavings = async (item: BucketItem) => {
    if (!coupleId) return;
    const raw = prompt(`Add to "${item.title}" savings (current: ${item.saved ?? 0}/${item.target}):`, "50");
    const amount = Number(raw);
    if (!raw || Number.isNaN(amount) || amount <= 0) return;
    const saved = (item.saved ?? 0) + amount;
    await updateInCouple(coupleId, "bucketList", item.id, { saved });
    if (item.target && saved >= item.target && !item.done) toggleDone({ ...item, saved });
  };

  return (
    <div className="space-y-4">
      <Hearts />
      <PageHeader
        emoji="🪣"
        title="Bucket List"
        subtitle={`${doneCount}/${items.length} dreams unlocked`}
        action={<Button onClick={() => setAddOpen(true)}>+ New dream</Button>}
      />

      {items.length > 0 && (
        <GlassCard className="flex items-center gap-4">
          <span className="text-3xl" aria-hidden>🎯</span>
          <div className="flex-1">
            <p className="mb-1.5 text-xs font-bold text-ink-soft">
              Overall progress · {items.length ? Math.round((doneCount / items.length) * 100) : 0}%
            </p>
            <ProgressBar value={items.length ? doneCount / items.length : 0} label="Bucket list progress" />
          </div>
        </GlassCard>
      )}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[["all", { label: "All", emoji: "✨" }] as const, ...Object.entries(BUCKET_CATEGORIES)].map(([key, meta]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              filter === key ? "gradient-btn text-white" : "glass text-ink-soft hover:text-ink",
            )}
          >
            {meta.emoji} {meta.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          emoji="🗺️"
          title="Nothing on the list yet"
          subtitle="Where do you two want to go? What do you want to build?"
          action={<Button onClick={() => setAddOpen(true)}>Dream something up</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <AnimatePresence>
            {visible.map((item) => {
              const meta = BUCKET_CATEGORIES[item.category] ?? BUCKET_CATEGORIES.other;
              return (
                <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                  <GlassCard className={cn("group h-full", item.done && "opacity-75")}>
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleDone(item)}
                        aria-pressed={item.done}
                        aria-label={`Mark "${item.title}" ${item.done ? "not done" : "done"}`}
                        className={cn(
                          "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 text-sm transition-all",
                          item.done
                            ? "border-transparent bg-gradient-to-br from-blush-500 to-lilac-500 text-white"
                            : "border-blush-300 hover:border-blush-500",
                        )}
                      >
                        {item.done && "✓"}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm font-bold", item.done && "line-through")}>{item.title}</p>
                        <p className="text-xs text-ink-soft">{meta.emoji} {meta.label}</p>
                        {item.target !== undefined && (
                          <div className="mt-2">
                            <div className="mb-1 flex justify-between text-[11px] font-semibold text-ink-soft">
                              <span>💰 {(item.saved ?? 0).toLocaleString()} / {item.target.toLocaleString()}</span>
                              <button onClick={() => addSavings(item)} className="text-lilac-500 hover:underline">
                                + add savings
                              </button>
                            </div>
                            <ProgressBar value={(item.saved ?? 0) / item.target} label={`${item.title} savings`} />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => confirm("Remove this dream?") && coupleId && deleteFromCouple(coupleId, "bucketList", item.id)}
                        aria-label="Delete"
                        className="text-ink-soft/30 opacity-0 transition-opacity hover:text-rose-500 focus:opacity-100 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New dream 🪣">
        <div className="space-y-3">
          <Input label="What's the dream?" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="See the northern lights together" />
          <Select label="Category" value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as BucketCategory })}>
            {Object.entries(BUCKET_CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>{v.emoji} {v.label}</option>
            ))}
          </Select>
          {form.category === "savings" && (
            <Input label="Target amount" type="number" min={1} value={form.target}
              onChange={(e) => setForm({ ...form, target: e.target.value })} placeholder="5000" />
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={add}>Add dream</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
