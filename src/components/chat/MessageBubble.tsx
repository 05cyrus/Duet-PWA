"use client";

import { motion } from "framer-motion";
import { REACTION_EMOJIS } from "@/lib/content";
import type { ChatMessage } from "@/lib/types";
import { cn, friendlyTime } from "@/lib/utils";
import { useState } from "react";

interface BubbleProps {
  msg: ChatMessage;
  mine: boolean;
  partnerRead: boolean;
  onReact: (emoji: string) => void;
  onPin: () => void;
}

export function MessageBubble({ msg, mine, partnerRead, onReact, onPin }: BubbleProps) {
  const [actions, setActions] = useState(false);
  const reactions = Object.values(msg.reactions ?? {}).filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className={cn("group flex w-full", mine ? "justify-end" : "justify-start")}
    >
      <div className={cn("relative max-w-[80%] sm:max-w-[65%]", actions && "z-10")}>
        <button
          type="button"
          onClick={() => setActions((v) => !v)}
          className={cn(
            "block w-full rounded-3xl px-4 py-2.5 text-left text-sm shadow-sm",
            mine
              ? "rounded-br-lg bg-gradient-to-br from-blush-500 to-lilac-500 text-white"
              : "glass rounded-bl-lg",
            msg.pinned && "ring-2 ring-peach-300",
          )}
          aria-label="Message actions"
        >
          {msg.kind === "image" && msg.mediaUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- Firebase Storage URL
            <img src={msg.mediaUrl} alt="Shared" className="mb-1 max-h-64 w-full rounded-2xl object-cover" loading="lazy" />
          )}
          {msg.kind === "gif" && msg.mediaUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- Tenor CDN
            <img src={msg.mediaUrl} alt="GIF" className="mb-1 max-h-56 rounded-2xl" loading="lazy" />
          )}
          {msg.kind === "voice" && msg.mediaUrl && (
            <audio controls src={msg.mediaUrl} className="my-1 h-10 w-52 max-w-full" preload="metadata" />
          )}
          {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
          <span className={cn("mt-1 flex items-center justify-end gap-1 text-[10px]", mine ? "text-white/70" : "text-ink-soft/70")}>
            {msg.pinned && <span aria-label="Pinned">📌</span>}
            {friendlyTime(msg.createdAt)}
            {mine && (
              <span aria-label={partnerRead ? "Read" : "Sent"}>{partnerRead ? "✓✓" : "✓"}</span>
            )}
          </span>
        </button>

        {reactions.length > 0 && (
          <span className={cn(
            "absolute -bottom-3 rounded-full bg-white px-1.5 py-0.5 text-xs shadow dark:bg-[#2a1e3a]",
            mine ? "right-2" : "left-2",
          )}>
            {reactions.join("")}
          </span>
        )}

        {/* Action row (react + pin) */}
        {actions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn("glass absolute -top-10 flex items-center gap-0.5 rounded-full px-1.5 py-1", mine ? "right-0" : "left-0")}
          >
            {REACTION_EMOJIS.slice(0, 6).map((e) => (
              <button key={e} onClick={() => { onReact(e); setActions(false); }}
                className="grid size-7 place-items-center rounded-full text-base hover:scale-125" aria-label={`React ${e}`}>
                {e}
              </button>
            ))}
            <button onClick={() => { onPin(); setActions(false); }}
              className="grid size-7 place-items-center rounded-full text-sm hover:scale-125"
              aria-label={msg.pinned ? "Unpin" : "Pin"}>
              📌
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
