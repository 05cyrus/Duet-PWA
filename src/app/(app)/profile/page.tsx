"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCoupleCollection } from "@/hooks/useCoupleCollection";
import { useLoveStats } from "@/hooks/useLoveStats";
import { limitTo, orderBy, where } from "@/lib/firebase/db";
import type { Achievement, GalleryItem } from "@/lib/types";
import { daysTogether, formatLongDate, isoToday, relationshipLevel } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useCouple } from "@/providers/CoupleProvider";
import { useToast } from "@/providers/ToastProvider";

export default function ProfilePage() {
  const { user } = useAuth();
  const { couple, myName, partnerName, updateCouple } = useCouple();
  const { toast } = useToast();
  const stats = useLoveStats();

  const [editOpen, setEditOpen] = useState(false);
  const [coupleName, setCoupleName] = useState("");
  const [anniversary, setAnniversary] = useState("");

  const { items: favorites } = useCoupleCollection<GalleryItem>(
    "gallery",
    () => [where("favorite", "==", true), limitTo(6)],
  );
  const { items: achievements } = useCoupleCollection<Achievement>(
    "achievements",
    () => [orderBy("createdAt", "desc"), limitTo(12)],
  );

  if (!couple) return null;
  const days = daysTogether(couple.anniversary);
  const { level, title } = relationshipLevel(days, couple.xp);

  const saveEdits = async () => {
    await updateCouple({
      ...(coupleName.trim() ? { coupleName: coupleName.trim() } : {}),
      ...(anniversary ? { anniversary } : {}),
    });
    setEditOpen(false);
    toast("Profile updated 💞", "success");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader emoji="🧸" title="Couple Profile" subtitle="Your story at a glance."
        action={<Button variant="outline" onClick={() => {
          setCoupleName(couple.coupleName);
          setAnniversary(couple.anniversary ?? "");
          setEditOpen(true);
        }}>Edit</Button>} />

      {/* Header card */}
      <GlassCard className="relative overflow-hidden text-center">
        <div aria-hidden className="pointer-events-none absolute -left-10 -top-14 size-40 rounded-full bg-gradient-to-br from-blush-300/40 to-lilac-300/40 blur-2xl" />
        <div className="relative flex items-center justify-center gap-4">
          {couple.members.map((uid, i) => (
            <motion.div key={uid} initial={{ opacity: 0, x: i === 0 ? -18 : 18 }} animate={{ opacity: 1, x: 0 }}>
              <Avatar src={couple.memberPhotos[uid]} name={couple.memberNames[uid] ?? "?"} size={72} />
              <p className="mt-1.5 text-xs font-bold">{uid === user?.uid ? myName : partnerName}</p>
            </motion.div>
          ))}
          <span aria-hidden className="heartbeat absolute text-3xl">💞</span>
        </div>
        <h2 className="mt-4 text-2xl font-bold gradient-text" style={{ fontFamily: "var(--font-display)" }}>
          {couple.coupleName}
        </h2>
        {couple.anniversary && (
          <p className="mt-1 text-xs text-ink-soft">Together since {formatLongDate(couple.anniversary)}</p>
        )}
        <div className="mt-4 flex justify-center gap-6 text-center">
          {[
            [days.toLocaleString(), "days"],
            [`Lv ${level}`, title],
            [couple.xp.toLocaleString(), "XP"],
            [couple.coins.toLocaleString(), "coins"],
          ].map(([v, l]) => (
            <div key={l as string}>
              <p className="text-lg font-bold tabular-nums">{v}</p>
              <p className="text-[10px] font-semibold text-ink-soft">{l}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Stats */}
      <GlassCard>
        <h3 className="mb-3 text-sm font-bold">Relationship statistics</h3>
        <div className="grid grid-cols-3 gap-3 text-center sm:grid-cols-6">
          {[
            ["💬", stats.messages, "Messages"],
            ["📖", stats.memories, "Memories"],
            ["📸", stats.photos, "Photos"],
            ["💌", stats.letters, "Letters"],
            ["🎮", stats.gamesPlayed, "Games"],
            ["🪣", stats.wishesDone, "Wishes"],
          ].map(([emoji, v, l]) => (
            <div key={l as string} className="rounded-2xl bg-white/40 px-2 py-3 dark:bg-white/5">
              <p aria-hidden>{emoji}</p>
              <p className="text-lg font-bold tabular-nums">{(v as number).toLocaleString()}</p>
              <p className="text-[10px] font-semibold text-ink-soft">{l}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Favorite memories */}
      <GlassCard>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold">Favorite memories ⭐</h3>
          <Link href="/gallery" className="text-xs font-semibold text-lilac-500 hover:underline">Gallery →</Link>
        </div>
        {favorites.length === 0 ? (
          <p className="py-3 text-center text-sm text-ink-soft">Star photos in the gallery to pin them here.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {favorites.map((f) => (
              <Link key={f.id} href="/gallery" className="aspect-square overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element -- Firebase Storage URL */}
                <img src={f.url} alt={f.caption || "Favorite"} loading="lazy"
                  className="size-full object-cover transition-transform hover:scale-105" />
              </Link>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Achievements */}
      <GlassCard>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold">Recent achievements 🏅</h3>
          <Link href="/leaderboard" className="text-xs font-semibold text-lilac-500 hover:underline">Leaderboard →</Link>
        </div>
        {achievements.length === 0 ? (
          <p className="py-3 text-center text-sm text-ink-soft">Win games and keep streaks to earn badges.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {achievements.map((a) => (
              <span key={a.id} title={`${a.name} · +${a.xp} XP`}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-peach-100 to-blush-100 px-3 py-1.5 text-xs font-bold dark:from-peach-400/15 dark:to-blush-500/15">
                <span aria-hidden>{a.emoji}</span> {a.title}
              </span>
            ))}
          </div>
        )}
      </GlassCard>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit profile 🧸">
        <div className="space-y-3">
          <Input label="Couple name" value={coupleName} onChange={(e) => setCoupleName(e.target.value)} />
          <Input label="Anniversary" type="date" max={isoToday()} value={anniversary}
            onChange={(e) => setAnniversary(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdits}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
