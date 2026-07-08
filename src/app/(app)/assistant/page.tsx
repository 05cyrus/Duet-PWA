"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { localAssistantReply } from "@/lib/assistant/local";
import { cn } from "@/lib/utils";

interface Turn {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Plan us a cozy date 🌹",
  "Anniversary gift ideas 🎁",
  "Deep conversation starters 💬",
  "Where should we travel? ✈️",
  "What should we cook tonight? 🍳",
  "A fun game to play now 🎲",
];

const WELCOME: Turn = {
  role: "assistant",
  content:
    "Hi, I'm Cupid 💘 — your love assistant. Ask me for date ideas, gifts, trips, food, games or relationship tips!",
};

export default function AssistantPage() {
  const [turns, setTurns] = useState<Turn[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const history = [...turns, { role: "user" as const, content: q }];
    setTurns(history);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Skip the welcome message; API expects alternating turns ending in user.
        body: JSON.stringify({ messages: history.slice(1) }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      setTurns((t) => [...t, { role: "assistant", content: json.reply }]);
    } catch {
      // Offline / not configured / rate limited → local suggestion engine.
      setTurns((t) => [...t, { role: "assistant", content: localAssistantReply(q) }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-170px)] max-w-2xl flex-col lg:h-[calc(100dvh-130px)]">
      <PageHeader emoji="🤖" title="Love Assistant" subtitle="Cupid, at your service." />

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-1 pb-3" aria-live="polite">
        <AnimatePresence initial={false}>
          {turns.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex", t.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-relaxed",
                  t.role === "user"
                    ? "rounded-br-lg bg-gradient-to-br from-blush-500 to-lilac-500 text-white"
                    : "glass rounded-bl-lg",
                )}
              >
                {t.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {busy && (
          <div className="flex justify-start">
            <div className="glass flex gap-1 rounded-3xl rounded-bl-lg px-4 py-3">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="size-2 rounded-full bg-lilac-400"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick suggestions */}
      <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="glass shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:text-blush-500"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        className="glass flex items-center gap-2 rounded-3xl p-2"
        onSubmit={(e) => { e.preventDefault(); send(input); }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Cupid anything about you two…"
          aria-label="Message the assistant"
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          aria-label="Send"
          className="gradient-btn grid size-10 shrink-0 place-items-center rounded-full text-white disabled:opacity-50"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
