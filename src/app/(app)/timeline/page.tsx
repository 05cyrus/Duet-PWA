"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { AddMemoryModal } from "@/components/timeline/AddMemoryModal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useCoupleCollection } from "@/hooks/useCoupleCollection";
import { MEMORY_KIND_META } from "@/lib/content";
import { deleteFromCouple, orderBy } from "@/lib/firebase/db";
import type { Memory } from "@/lib/types";
import { cn, formatLongDate } from "@/lib/utils";
import { useCouple } from "@/providers/CoupleProvider";

export default function TimelinePage() {
  const { coupleId } = useCouple();
  const [addOpen, setAddOpen] = useState(false);
  const [kindFilter, setKindFilter] = useState<string>("all");
  const { items, loading } = useCoupleCollection<Memory>(
    "timeline",
    () => [orderBy("date", "desc")],
  );

  const filtered = useMemo(
    () => (kindFilter === "all" ? items : items.filter((m) => m.kind === kindFilter)),
    [items, kindFilter],
  );

  return (
    <div>
      <PageHeader
        emoji="📖"
        title="Our Timeline"
        subtitle="Every chapter of your story, in order."
        action={<Button onClick={() => setAddOpen(true)}>+ Add memory</Button>}
      />

      {/* Kind filter row */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter memories">
        {[["all", "✨ All"], ...Object.entries(MEMORY_KIND_META).map(([k, v]) => [k, `${v.emoji} ${v.label}`])].map(
          ([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={kindFilter === key}
              onClick={() => setKindFilter(key)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                kindFilter === key
                  ? "gradient-btn text-white"
                  : "glass text-ink-soft hover:text-ink",
              )}
            >
              {label}
            </button>
          ),
        )}
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          emoji="🌱"
          title="No memories here yet"
          subtitle="Add your first meet, first date, or any moment worth keeping."
          action={<Button onClick={() => setAddOpen(true)}>Add the first memory</Button>}
        />
      ) : (
        <ol className="relative ml-3 space-y-6 border-l-2 border-dashed border-blush-300/50 pl-6 sm:ml-6 sm:pl-10">
          {filtered.map((m, i) => (
            <motion.li
              key={m.id}
              initial={{ opacity: 0, x: -18 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ type: "spring", stiffness: 160, damping: 20, delay: Math.min(i * 0.04, 0.3) }}
              className="relative"
            >
              {/* Timeline dot */}
              <span
                aria-hidden
                className="absolute -left-[35px] top-4 grid size-6 place-items-center rounded-full bg-gradient-to-br from-blush-400 to-lilac-500 text-[11px] shadow sm:-left-[51px]"
              >
                {MEMORY_KIND_META[m.kind]?.emoji ?? "✨"}
              </span>

              <article className="glass group overflow-hidden rounded-3xl">
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-lilac-500">
                    {formatLongDate(m.date)}
                  </p>
                  <h2 className="mt-1 text-lg font-bold">{m.title}</h2>
                  {m.caption && <p className="mt-1 text-sm text-ink-soft">{m.caption}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    {m.location && (
                      <span className="rounded-full bg-peach-100 px-2.5 py-1 font-semibold text-peach-400 dark:bg-peach-400/15">
                        📍 {m.location}
                      </span>
                    )}
                    {m.tags.map((t) => (
                      <span key={t} className="rounded-full bg-lilac-100 px-2.5 py-1 font-semibold text-lilac-600 dark:bg-lilac-500/15 dark:text-lilac-300">
                        #{t}
                      </span>
                    ))}
                    {coupleId && (
                      <button
                        onClick={() => {
                          if (confirm("Delete this memory?")) deleteFromCouple(coupleId, "timeline", m.id);
                        }}
                        className="ml-auto font-semibold text-ink-soft/50 opacity-0 transition-opacity hover:text-rose-500 focus:opacity-100 group-hover:opacity-100"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </article>
            </motion.li>
          ))}
        </ol>
      )}

      <AddMemoryModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
