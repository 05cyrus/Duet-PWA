"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { GlassCard } from "@/components/ui/GlassCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useCoupleCollection } from "@/hooks/useCoupleCollection";
import { limitTo, orderBy } from "@/lib/firebase/db";
import { GAMES, GEOMETRY_GAME } from "@/lib/games/registry";
import type { Achievement, GameScore } from "@/lib/types";
import { daysTogether, relationshipLevel } from "@/lib/utils";
import { useCouple } from "@/providers/CoupleProvider";

export default function LeaderboardPage() {
  const { couple } = useCouple();
  const { items: scores, loading } = useCoupleCollection<GameScore>(
    "scores",
    () => [orderBy("createdAt", "desc"), limitTo(400)],
  );
  const { items: achievements } = useCoupleCollection<Achievement>(
    "achievements",
    () => [orderBy("createdAt", "desc"), limitTo(50)],
  );

  if (!couple) return null;
  const days = daysTogether(couple.anniversary);
  const { level, title } = relationshipLevel(days, couple.xp);

  // Total points per member + best score per game per member.
  const totals = new Map<string, number>();
  const bests = new Map<string, GameScore>();
  for (const s of scores) {
    totals.set(s.uid, (totals.get(s.uid) ?? 0) + s.score);
    const key = `${s.gameId}:${s.uid}`;
    if ((bests.get(key)?.score ?? -1) < s.score) bests.set(key, s);
  }
  const ranked = couple.members
    .map((uid) => ({ uid, points: totals.get(uid) ?? 0 }))
    .sort((a, b) => b.points - a.points);

  const allGames = [GEOMETRY_GAME, ...GAMES];

  return (
    <div className="space-y-4">
      <PageHeader emoji="🏆" title="Leaderboard" subtitle="XP, coins, badges and bragging rights." />

      {/* Couple totals */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Level", value: `${level}`, sub: title, emoji: "💞" },
          { label: "Total XP", value: couple.xp.toLocaleString(), sub: "earned together", emoji: "⚡" },
          { label: "Coins", value: couple.coins.toLocaleString(), sub: "in the love bank", emoji: "🪙" },
        ].map((t, i) => (
          <motion.div key={t.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <GlassCard className="text-center">
              <p aria-hidden className="text-2xl">{t.emoji}</p>
              <p className="text-2xl font-bold tabular-nums">{t.value}</p>
              <p className="text-[11px] font-semibold text-ink-soft">{t.label} · {t.sub}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Player ranking */}
      <GlassCard>
        <h2 className="mb-3 text-sm font-bold">Player ranking</h2>
        {loading ? <CardSkeleton rows={2} /> : (
          <ol className="space-y-2">
            {ranked.map(({ uid, points }, i) => (
              <li key={uid} className="flex items-center gap-3 rounded-2xl bg-white/40 px-3 py-2.5 dark:bg-white/5">
                <span className="w-7 text-center text-xl" aria-hidden>{i === 0 ? "🥇" : "🥈"}</span>
                <Avatar src={couple.memberPhotos[uid]} name={couple.memberNames[uid] ?? "?"} size={36} />
                <span className="flex-1 text-sm font-bold">{couple.memberNames[uid]}</span>
                <span className="text-sm font-bold tabular-nums text-blush-500">{points.toLocaleString()} pts</span>
              </li>
            ))}
          </ol>
        )}
      </GlassCard>

      {/* Per-game bests */}
      <GlassCard>
        <h2 className="mb-3 text-sm font-bold">Best scores by game</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {allGames.map((g) => {
            const rows = couple.members
              .map((uid) => bests.get(`${g.id}:${uid}`))
              .filter((s): s is GameScore => Boolean(s))
              .sort((a, b) => b.score - a.score);
            if (rows.length === 0) return null;
            return (
              <div key={g.id} className="rounded-2xl bg-white/40 px-3 py-2.5 dark:bg-white/5">
                <p className="text-xs font-bold">
                  <span aria-hidden className="mr-1">{g.emoji}</span>{g.name}
                </p>
                {rows.map((s, i) => (
                  <p key={s.uid} className="mt-1 flex justify-between text-xs text-ink-soft">
                    <span>{i === 0 ? "👑 " : ""}{s.name}</span>
                    <span className="font-bold tabular-nums">{s.score.toLocaleString()}</span>
                  </p>
                ))}
              </div>
            );
          })}
        </div>
        {!loading && scores.length === 0 && (
          <p className="py-4 text-center text-sm text-ink-soft">Play some games to fill the board! 🎮</p>
        )}
      </GlassCard>

      {/* Achievements */}
      <GlassCard>
        <h2 className="mb-3 text-sm font-bold">Achievements & badges</h2>
        {achievements.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-soft">No badges yet — perfect scores and streaks unlock them ✨</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {achievements.map((a) => (
              <motion.span
                key={a.id}
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                title={`${a.name} · +${a.xp} XP`}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-peach-100 to-blush-100 px-3 py-1.5 text-xs font-bold dark:from-peach-400/15 dark:to-blush-500/15"
              >
                <span aria-hidden>{a.emoji}</span> {a.title}
                <span className="text-ink-soft">· {a.name}</span>
              </motion.span>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
