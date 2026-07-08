"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";

const HEARTS = ["❤️", "💖", "💕", "💘", "🩷"];

/**
 * Celebration burst of floating hearts. Call `burst()` from the returned hook
 * and render the `<Hearts />` node once near the root of the page.
 */
export function useHeartBurst() {
  const [particles, setParticles] = useState<{ id: number; x: number; emoji: string; drift: number }[]>([]);
  const nextId = useRef(1);

  const burst = useCallback((count = 10) => {
    const created = Array.from({ length: count }, (_, i) => ({
      id: nextId.current++,
      x: 10 + ((i * 83) % 80),
      drift: ((i * 37) % 40) - 20,
      emoji: HEARTS[i % HEARTS.length],
    }));
    setParticles((p) => [...p, ...created]);
    setTimeout(() => {
      setParticles((p) => p.filter((x) => !created.some((c) => c.id === x.id)));
    }, 1800);
  }, []);

  const Hearts = useCallback(() => (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            className="absolute bottom-16 text-2xl"
            style={{ left: `${p.x}%` }}
            initial={{ y: 0, opacity: 1, scale: 0.6 }}
            animate={{ y: -320, x: p.drift, opacity: 0, scale: 1.6, rotate: p.drift }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: "easeOut" }}
          >
            {p.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  ), [particles]);

  return { burst, Hearts };
}
