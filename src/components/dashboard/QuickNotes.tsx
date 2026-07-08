"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useCoupleCollection } from "@/hooks/useCoupleCollection";
import { QUICK_NOTE_COLORS } from "@/lib/content";
import { addToCouple, deleteFromCouple, limitTo, orderBy } from "@/lib/firebase/db";
import type { QuickNote } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";
import { useCouple } from "@/providers/CoupleProvider";

/** Shared sticky notes — tiny thoughts for each other. */
export function QuickNotes() {
  const { user } = useAuth();
  const { coupleId } = useCouple();
  const [text, setText] = useState("");
  const { items } = useCoupleCollection<QuickNote>(
    "notes",
    () => [orderBy("createdAt", "desc"), limitTo(8)],
  );

  const add = async () => {
    const t = text.trim();
    if (!t || !coupleId || !user) return;
    setText("");
    await addToCouple(coupleId, "notes", {
      text: t.slice(0, 200),
      color: QUICK_NOTE_COLORS[items.length % QUICK_NOTE_COLORS.length],
      createdBy: user.uid,
    });
  };

  return (
    <GlassCard>
      <h2 className="mb-3 text-sm font-bold">Quick notes 📌</h2>
      <form
        className="mb-3 flex gap-2"
        onSubmit={(e) => { e.preventDefault(); add(); }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Leave a little note…"
          aria-label="New quick note"
          className="min-w-0 flex-1 rounded-2xl border border-blush-200/70 bg-white/70 px-3 py-2 text-sm placeholder:text-ink-soft/70 focus:border-blush-400 focus:outline-none dark:border-white/10 dark:bg-white/5"
        />
        <button type="submit" aria-label="Add note"
          className="gradient-btn grid size-9 shrink-0 place-items-center rounded-2xl text-white">
          ➤
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {items.map((n) => (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, scale: 0.8, rotate: -3 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="group relative max-w-full rounded-2xl px-3 py-2 text-sm font-medium text-[#3d2c3a] shadow-sm"
              style={{ background: n.color }}
            >
              <p className="break-words pr-4">{n.text}</p>
              {coupleId && (
                <button
                  aria-label="Delete note"
                  onClick={() => deleteFromCouple(coupleId, "notes", n.id)}
                  className="absolute right-1 top-1 hidden size-4 place-items-center rounded-full text-[10px] text-[#3d2c3a]/60 hover:text-[#3d2c3a] group-hover:grid"
                >
                  ✕
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {items.length === 0 && (
          <p className="w-full py-2 text-center text-sm text-ink-soft">No notes yet — say something sweet 🍬</p>
        )}
      </div>
    </GlassCard>
  );
}
