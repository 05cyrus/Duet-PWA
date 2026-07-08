"use client";

import { motion } from "framer-motion";
import { CHAT_EMOJIS } from "@/lib/content";

export function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="glass grid max-h-48 grid-cols-8 gap-1 overflow-y-auto rounded-2xl p-2"
      role="listbox"
      aria-label="Emoji picker"
    >
      {CHAT_EMOJIS.map((e) => (
        <button
          key={e}
          role="option"
          aria-selected={false}
          onClick={() => onPick(e)}
          className="grid size-9 place-items-center rounded-xl text-xl transition-transform hover:scale-125"
        >
          {e}
        </button>
      ))}
    </motion.div>
  );
}
