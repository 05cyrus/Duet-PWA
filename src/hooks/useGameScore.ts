"use client";

import { useCallback } from "react";
import { addToCouple, awardXp, pushAppNotification } from "@/lib/firebase/db";
import type { GameDef } from "@/lib/games/registry";
import { useAuth } from "@/providers/AuthProvider";
import { useCouple } from "@/providers/CoupleProvider";

/**
 * Score + achievement submission for all games.
 * Writes a score doc, grants couple XP/coins, and pings the partner.
 */
export function useGameScore(game: GameDef) {
  const { user } = useAuth();
  const { coupleId, myName, partnerUid } = useCouple();

  const submitScore = useCallback(
    async (score: number, meta: Record<string, number | string> = {}) => {
      if (!coupleId || !user) return;
      try {
        await addToCouple(coupleId, "scores", {
          gameId: game.id, uid: user.uid, name: myName, score, meta,
        });
        await awardXp(coupleId, game.xp, Math.max(1, Math.round(score / 10)));
        if (partnerUid) {
          pushAppNotification(coupleId, {
            toUid: partnerUid,
            title: `${myName} scored ${score} in ${game.name} ${game.emoji}`,
            body: "Think you can beat it?",
            href: `/games/${game.id}`,
          }).catch(() => {});
        }
      } catch {
        // Offline — Firestore queues the writes automatically.
      }
    },
    [coupleId, user, myName, partnerUid, game],
  );

  const unlockAchievement = useCallback(
    async (key: string, title: string, emoji: string, xp = 15) => {
      if (!coupleId || !user) return;
      try {
        await addToCouple(coupleId, "achievements", {
          uid: user.uid, name: myName, key: `${game.id}:${key}`, title, emoji, xp,
        });
        await awardXp(coupleId, xp, 5);
      } catch { /* offline queue */ }
    },
    [coupleId, user, myName, game.id],
  );

  return { submitScore, unlockAchievement };
}
