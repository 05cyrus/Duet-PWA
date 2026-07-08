"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCoupleCollection } from "@/hooks/useCoupleCollection";
import { addToCouple, deleteFromCouple, orderBy, pushAppNotification, updateInCouple } from "@/lib/firebase/db";
import type { TS } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";
import { useCouple } from "@/providers/CoupleProvider";
import { useToast } from "@/providers/ToastProvider";

interface Song {
  id: string;
  spotifyId: string;
  kind: "track" | "playlist" | "album";
  note: string;
  dedicatedTo: string | null;
  favorite: boolean;
  addedBy: string;
  createdAt: TS;
}

/** Parse a Spotify share URL/URI into { kind, id }. */
function parseSpotify(input: string): { kind: Song["kind"]; id: string } | null {
  const url = input.trim();
  const patterns = [
    /open\.spotify\.com\/(?:intl-\w+\/)?(track|playlist|album)\/([A-Za-z0-9]+)/,
    /spotify:(track|playlist|album):([A-Za-z0-9]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return { kind: m[1] as Song["kind"], id: m[2] };
  }
  return null;
}

export default function MusicPage() {
  const { user } = useAuth();
  const { coupleId, myName, partnerUid, partnerName } = useCouple();
  const { toast } = useToast();

  const [addOpen, setAddOpen] = useState(false);
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [dedicate, setDedicate] = useState(false);
  const [filter, setFilter] = useState<"all" | "favorites" | "dedications">("all");

  const { items } = useCoupleCollection<Song>("music", () => [orderBy("createdAt", "desc")]);

  const visible = items.filter((s) =>
    filter === "all" ? true : filter === "favorites" ? s.favorite : Boolean(s.dedicatedTo),
  );

  const add = async () => {
    const parsed = parseSpotify(link);
    if (!parsed) return toast("Paste a Spotify track, album or playlist link 🎵", "error");
    if (!coupleId || !user) return;
    await addToCouple(coupleId, "music", {
      spotifyId: parsed.id,
      kind: parsed.kind,
      note: note.trim(),
      dedicatedTo: dedicate ? partnerUid : null,
      favorite: false,
      addedBy: user.uid,
    });
    if (dedicate && partnerUid) {
      pushAppNotification(coupleId, {
        toUid: partnerUid,
        title: `${myName} dedicated a song to you 🎶`,
        body: note.trim() || "Go listen — it made them think of you.",
        href: "/music",
      }).catch(() => {});
    }
    setAddOpen(false);
    setLink(""); setNote(""); setDedicate(false);
    toast(dedicate ? "Dedication sent 🎶" : "Added to your playlist 🎵", "success");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        emoji="🎵"
        title="Our Music"
        subtitle="Shared playlists, favorites & dedications."
        action={<Button onClick={() => setAddOpen(true)}>+ Add song</Button>}
      />

      <div className="flex gap-2">
        {([["all", "🎵 All"], ["favorites", "⭐ Favorites"], ["dedications", "💝 Dedications"]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filter === k ? "gradient-btn text-white" : "glass text-ink-soft"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          emoji="🎧"
          title="No songs yet"
          subtitle="Paste any Spotify link — track, album or playlist."
          action={<Button onClick={() => setAddOpen(true)}>Add your song</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence>
            {visible.map((s) => (
              <motion.div key={s.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <GlassCard padded={false} className="overflow-hidden">
                  {s.dedicatedTo && (
                    <p className="px-4 pt-3 text-xs font-bold text-blush-500">
                      💝 {s.addedBy === user?.uid ? `You dedicated this to ${partnerName}` : `${partnerName} dedicated this to you`}
                    </p>
                  )}
                  {s.note && <p className="px-4 pt-2 text-sm italic text-ink-soft">“{s.note}”</p>}
                  <div className="p-3">
                    <iframe
                      src={`https://open.spotify.com/embed/${s.kind}/${s.spotifyId}?theme=0`}
                      width="100%"
                      height={s.kind === "track" ? 152 : 352}
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="rounded-2xl"
                      title="Spotify player"
                    />
                  </div>
                  <div className="flex items-center justify-between px-4 pb-3">
                    <button
                      onClick={() => coupleId && updateInCouple(coupleId, "music", s.id, { favorite: !s.favorite })}
                      aria-pressed={s.favorite}
                      className="text-lg"
                      aria-label="Favorite"
                    >
                      {s.favorite ? "⭐" : "☆"}
                    </button>
                    <button
                      onClick={() => coupleId && confirm("Remove this song?") && deleteFromCouple(coupleId, "music", s.id)}
                      className="text-xs font-semibold text-ink-soft/50 hover:text-rose-500"
                    >
                      Remove
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add music 🎵">
        <div className="space-y-3">
          <Input
            label="Spotify link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://open.spotify.com/track/…"
            hint="Track, album or playlist — from the Spotify share button."
          />
          <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="This is so us." />
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={dedicate} onChange={(e) => setDedicate(e.target.checked)}
              className="size-4 accent-blush-500" />
            Dedicate to {partnerName} 💝
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={add}>{dedicate ? "Send dedication" : "Add"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
