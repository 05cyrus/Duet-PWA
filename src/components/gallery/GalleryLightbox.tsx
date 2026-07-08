"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { REACTION_EMOJIS } from "@/lib/content";
import { deleteFromCouple, updateInCouple } from "@/lib/firebase/db";
import { deleteByUrl } from "@/lib/firebase/storage";
import type { GalleryItem } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";
import { useCouple } from "@/providers/CoupleProvider";
import { useToast } from "@/providers/ToastProvider";

interface LightboxProps {
  items: GalleryItem[];
  index: number;
  slideshow: boolean;
  onNavigate: (i: number) => void;
  onClose: () => void;
}

/** Full-screen media viewer: navigation, slideshow, favorite, reactions, comments, download. */
export function GalleryLightbox({ items, index, slideshow, onNavigate, onClose }: LightboxProps) {
  const { user } = useAuth();
  const { coupleId, myName } = useCouple();
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const item = items[index];

  const next = useCallback(
    () => onNavigate((index + 1) % items.length),
    [index, items.length, onNavigate],
  );
  const prev = () => onNavigate((index - 1 + items.length) % items.length);

  // Keyboard navigation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  // Auto-advance slideshow.
  useEffect(() => {
    if (!slideshow) return;
    const t = setInterval(next, 3500);
    return () => clearInterval(t);
  }, [slideshow, next]);

  if (!item) return null;

  const toggleFavorite = () =>
    coupleId && updateInCouple(coupleId, "gallery", item.id, { favorite: !item.favorite });

  const react = (emoji: string) => {
    if (!coupleId || !user) return;
    const mine = item.reactions?.[user.uid];
    updateInCouple(coupleId, "gallery", item.id, {
      [`reactions.${user.uid}`]: mine === emoji ? "" : emoji,
    });
  };

  const addComment = () => {
    const text = comment.trim();
    if (!text || !coupleId || !user) return;
    setComment("");
    updateInCouple(coupleId, "gallery", item.id, {
      comments: [...(item.comments ?? []), { uid: user.uid, name: myName, text, at: Date.now() }],
    });
  };

  const download = async () => {
    try {
      const res = await fetch(item.url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `duet-${item.id}.${item.type === "video" ? "mp4" : "jpg"}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast("Download failed.", "error");
    }
  };

  const remove = async () => {
    if (!coupleId || !confirm("Delete this from your gallery?")) return;
    onClose();
    await deleteFromCouple(coupleId, "gallery", item.id);
    deleteByUrl(item.url);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col bg-black/90 backdrop-blur"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      role="dialog" aria-modal="true" aria-label="Photo viewer"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 text-white">
        <span className="text-sm font-semibold tabular-nums">{index + 1} / {items.length}</span>
        <div className="flex items-center gap-1">
          <button onClick={toggleFavorite} aria-pressed={item.favorite} aria-label="Favorite"
            className="grid size-10 place-items-center rounded-full text-lg hover:bg-white/10">
            {item.favorite ? "⭐" : "☆"}
          </button>
          <button onClick={download} aria-label="Download" className="grid size-10 place-items-center rounded-full hover:bg-white/10">⬇️</button>
          <button onClick={() => setShowInfo((v) => !v)} aria-label="Comments" aria-expanded={showInfo}
            className="grid size-10 place-items-center rounded-full hover:bg-white/10">
            💬{(item.comments?.length ?? 0) > 0 && <span className="sr-only">{item.comments.length} comments</span>}
          </button>
          <button onClick={remove} aria-label="Delete" className="grid size-10 place-items-center rounded-full hover:bg-white/10">🗑️</button>
          <button onClick={onClose} aria-label="Close" className="grid size-10 place-items-center rounded-full hover:bg-white/10">✕</button>
        </div>
      </div>

      {/* Media */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2">
        <button onClick={prev} aria-label="Previous"
          className="absolute left-2 z-10 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">‹</button>
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.25 }}
            className="max-h-full"
          >
            {item.type === "video" ? (
              <video src={item.url} controls autoPlay className="max-h-[70dvh] max-w-full rounded-2xl" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- Firebase Storage URL
              <img src={item.url} alt={item.caption || "Memory"} className="max-h-[70dvh] max-w-full rounded-2xl object-contain" />
            )}
          </motion.div>
        </AnimatePresence>
        <button onClick={next} aria-label="Next"
          className="absolute right-2 z-10 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">›</button>
      </div>

      {/* Reactions */}
      <div className="flex justify-center gap-1.5 p-3">
        {REACTION_EMOJIS.map((e) => (
          <motion.button key={e} whileTap={{ scale: 1.4 }} onClick={() => react(e)}
            aria-label={`React ${e}`}
            className={`grid size-9 place-items-center rounded-full text-lg transition-colors ${
              user && item.reactions?.[user.uid] === e ? "bg-white/25" : "hover:bg-white/10"
            }`}>
            {e}
          </motion.button>
        ))}
      </div>

      {/* Comments drawer */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="glass max-h-64 overflow-y-auto rounded-t-3xl p-4"
          >
            <h3 className="mb-2 text-sm font-bold">Comments</h3>
            {(item.comments ?? []).length === 0 && (
              <p className="text-sm text-ink-soft">Be the first to say something sweet.</p>
            )}
            <ul className="space-y-2">
              {(item.comments ?? []).map((c, i) => (
                <li key={i} className="text-sm">
                  <span className="font-bold">{c.name}: </span>
                  <span className="text-ink-soft">{c.text}</span>
                </li>
              ))}
            </ul>
            <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); addComment(); }}>
              <input
                value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment…" aria-label="Add a comment"
                className="min-w-0 flex-1 rounded-2xl border border-blush-200/70 bg-white/70 px-3 py-2 text-sm focus:outline-none dark:border-white/10 dark:bg-white/10"
              />
              <button type="submit" className="gradient-btn rounded-2xl px-4 text-sm font-semibold text-white">Send</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
