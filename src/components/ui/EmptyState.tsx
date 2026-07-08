"use client";

import { motion } from "framer-motion";

interface EmptyStateProps {
  emoji?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function EmptyState({ emoji = "💌", title, subtitle, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass mx-auto flex max-w-sm flex-col items-center gap-3 rounded-3xl px-6 py-10 text-center"
    >
      <motion.span
        aria-hidden
        className="text-5xl"
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
      >
        {emoji}
      </motion.span>
      <h3 className="text-base font-bold">{title}</h3>
      {subtitle && <p className="text-sm text-ink-soft">{subtitle}</p>}
      {action}
    </motion.div>
  );
}
