"use client";

import {
  getCountFromServer, query, where, Timestamp, type QueryConstraint,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { coupleCol } from "@/lib/firebase/db";
import { toISODate } from "@/lib/utils";
import { useCouple } from "@/providers/CoupleProvider";

export interface LoveStats {
  messages: number;
  memories: number;
  photos: number;
  letters: number;
  gamesPlayed: number;
  wishesDone: number;
  /** 0–100 heuristic from the last 7 days of shared activity. */
  loveScore: number;
  loading: boolean;
}

const EMPTY: LoveStats = {
  messages: 0, memories: 0, photos: 0, letters: 0,
  gamesPlayed: 0, wishesDone: 0, loveScore: 0, loading: true,
};

/** Aggregate counts (server-side count queries — cheap, no doc reads). */
export function useLoveStats(): LoveStats {
  const { coupleId } = useCouple();
  const [stats, setStats] = useState<LoveStats>(EMPTY);

  useEffect(() => {
    if (!coupleId) return;
    let cancelled = false;

    (async () => {
      try {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekTs = Timestamp.fromDate(weekAgo);
        const weekIso = toISODate(weekAgo);

        const count = async (sub: string, ...constraints: QueryConstraint[]) => {
          const snap = await getCountFromServer(query(coupleCol(coupleId, sub), ...constraints));
          return snap.data().count;
        };

        const [messages, memories, photos, letters, gamesPlayed, wishesDone,
               recentMessages, recentMoods, recentScores] = await Promise.all([
          count("messages"),
          count("timeline"),
          count("gallery"),
          count("letters"),
          count("scores"),
          count("bucketList", where("done", "==", true)),
          count("messages", where("createdAt", ">=", weekTs)),
          count("moods", where("date", ">=", weekIso)),
          count("scores", where("createdAt", ">=", weekTs)),
        ]);

        const loveScore = Math.min(100, Math.round(
          recentMoods * 5 +          // both partners checking in daily ≈ 70
          Math.min(recentMessages, 60) * 0.35 + // active chatting ≈ 21
          recentScores * 3,          // playing together
        ));

        if (!cancelled) {
          setStats({ messages, memories, photos, letters, gamesPlayed, wishesDone, loveScore, loading: false });
        }
      } catch {
        if (!cancelled) setStats((s) => ({ ...s, loading: false }));
      }
    })();

    return () => { cancelled = true; };
  }, [coupleId]);

  return stats;
}
