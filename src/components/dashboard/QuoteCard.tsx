"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { DAILY_QUOTES } from "@/lib/content";
import { dailyIndex } from "@/lib/utils";

/** Deterministic quote-of-the-day (same for both partners). */
export function QuoteCard() {
  const quote = DAILY_QUOTES[dailyIndex(DAILY_QUOTES.length)];
  return (
    <GlassCard className="bg-gradient-to-br from-lilac-100/70 to-blush-100/70 dark:from-lilac-500/10 dark:to-blush-500/10">
      <p className="text-sm font-bold text-ink-soft">Quote of the day</p>
      <blockquote className="mt-2">
        <p className="text-lg leading-snug" style={{ fontFamily: "var(--font-display)" }}>
          “{quote.text}”
        </p>
        <footer className="mt-2 text-xs font-semibold text-ink-soft">— {quote.author}</footer>
      </blockquote>
    </GlassCard>
  );
}
