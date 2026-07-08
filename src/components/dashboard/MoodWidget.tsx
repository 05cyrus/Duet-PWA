"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";
import { useCoupleCollection } from "@/hooks/useCoupleCollection";
import { MOOD_META } from "@/lib/content";
import { pushAppNotification, setInCouple, where } from "@/lib/firebase/db";
import { MOODS, type Mood, type MoodEntry } from "@/lib/types";
import { isoToday } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useCouple } from "@/providers/CoupleProvider";
import { useToast } from "@/providers/ToastProvider";

/** Today's mood for both partners with one-tap check-in. */
export function MoodWidget() {
  const { user } = useAuth();
  const { coupleId, couple, partnerUid, myName } = useCouple();
  const { toast } = useToast();
  const today = isoToday();

  const { items } = useCoupleCollection<MoodEntry>(
    "moods",
    () => [where("date", "==", today)],
    [today],
  );

  const mine = items.find((m) => m.uid === user?.uid);
  const theirs = items.find((m) => m.uid === partnerUid);

  const setMood = async (mood: Mood) => {
    if (!coupleId || !user) return;
    await setInCouple(coupleId, "moods", `${today}_${user.uid}`, {
      uid: user.uid, date: today, mood, note: "", createdAt: new Date(),
    });
    if (partnerUid) {
      pushAppNotification(coupleId, {
        toUid: partnerUid,
        title: `${myName} is feeling ${MOOD_META[mood].label.toLowerCase()} ${MOOD_META[mood].emoji}`,
        body: "Tap to see today's moods.",
        href: "/moods",
      }).catch(() => {});
    }
    toast(`Mood set: ${MOOD_META[mood].emoji} ${MOOD_META[mood].label}`, "success");
  };

  return (
    <GlassCard>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold">Today&apos;s mood</h2>
        <Link href="/moods" className="text-xs font-semibold text-lilac-500 hover:underline">
          Analytics →
        </Link>
      </div>

      <div className="mb-4 flex items-center justify-around">
        {[
          { uid: user?.uid, entry: mine, label: "You" },
          { uid: partnerUid, entry: theirs, label: couple?.memberNames[partnerUid ?? ""] ?? "Partner" },
        ].map(({ uid, entry, label }) => (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <div className="relative">
              <Avatar src={uid ? couple?.memberPhotos[uid] : null} name={label} size={48} />
              <motion.span
                key={entry?.mood ?? "none"}
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-white text-sm shadow dark:bg-[#2a1e3a]"
                aria-hidden
              >
                {entry ? MOOD_META[entry.mood].emoji : "❔"}
              </motion.span>
            </div>
            <p className="text-xs font-semibold text-ink-soft">
              {label}: {entry ? MOOD_META[entry.mood].label : "not set"}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-1.5" role="group" aria-label="Set your mood">
        {MOODS.map((m) => (
          <motion.button
            key={m}
            whileTap={{ scale: 0.85 }}
            whileHover={{ y: -3 }}
            onClick={() => setMood(m)}
            aria-pressed={mine?.mood === m}
            title={MOOD_META[m].label}
            className={`grid size-10 place-items-center rounded-2xl text-xl transition-colors ${
              mine?.mood === m
                ? "bg-gradient-to-br from-blush-100 to-lilac-100 ring-2 ring-blush-400 dark:from-blush-500/25 dark:to-lilac-500/25"
                : "bg-white/50 hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10"
            }`}
          >
            <span aria-hidden>{MOOD_META[m].emoji}</span>
            <span className="sr-only">{MOOD_META[m].label}</span>
          </motion.button>
        ))}
      </div>
    </GlassCard>
  );
}
