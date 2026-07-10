"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useCoupleCollection } from "@/hooks/useCoupleCollection";
import { limitTo, orderBy, updateInCouple } from "@/lib/firebase/db";
import type { AppNotification } from "@/lib/types";
import { friendlyTime } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useCouple } from "@/providers/CoupleProvider";

export function NotificationsBell() {
  const { user } = useAuth();
  const { coupleId } = useCouple();
  const [open, setOpen] = useState(false);
  const { items } = useCoupleCollection<AppNotification>(
    "notifications",
    () => [orderBy("createdAt", "desc"), limitTo(20)],
  );

  const mine = items.filter((n) => n.toUid === "both" || n.toUid === user?.uid);
  const unread = mine.filter((n) => !n.read).length;

  const markAllRead = () => {
    if (!coupleId) return;
    mine.filter((n) => !n.read).forEach((n) => {
      updateInCouple(coupleId, "notifications", n.id, { read: true }).catch(() => {});
    });
  };

  return (
    <div className="relative">
      <button
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        onClick={() => { setOpen((v) => !v); if (!open) markAllRead(); }}
        className="relative grid size-9 place-items-center rounded-full transition-colors hover:bg-white/50 dark:hover:bg-white/10"
      >
        <span aria-hidden>🔔</span>
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -right-0.5 -top-0.5 grid size-4.5 min-w-4 place-items-center rounded-full bg-blush-500 px-1 text-[10px] font-bold text-white"
          >
            {unread > 9 ? "9+" : unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              className="glass-strong fixed right-3 top-[calc(env(safe-area-inset-top,0px)+4rem)] z-50 max-h-[70vh] w-[calc(100vw-1.5rem)] max-w-xs overflow-y-auto rounded-2xl p-2 sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:max-h-96 sm:w-80 sm:max-w-none"
              role="menu"
            >
              {mine.length === 0 ? (
                <p className="p-4 text-center text-sm text-ink-soft">No notifications yet 🕊️</p>
              ) : (
                mine.map((n) => (
                  <Link
                    key={n.id}
                    href={n.href || "/dashboard"}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-white/50 dark:hover:bg-white/10"
                  >
                    <p className="text-sm font-semibold">{n.title}</p>
                    <p className="text-xs text-ink-soft">{n.body}</p>
                    <p className="mt-0.5 text-[10px] text-ink-soft/70">{friendlyTime(n.createdAt)}</p>
                  </Link>
                ))
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
