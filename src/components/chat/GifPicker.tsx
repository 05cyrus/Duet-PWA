"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface TenorGif {
  id: string;
  media_formats: { tinygif?: { url: string }; gif?: { url: string } };
  content_description: string;
}

/**
 * GIF search via the Tenor API. Requires NEXT_PUBLIC_TENOR_API_KEY
 * (free key from https://developers.google.com/tenor). Shows setup hint if missing.
 */
export function GifPicker({ onPick }: { onPick: (url: string) => void }) {
  const key = process.env.NEXT_PUBLIC_TENOR_API_KEY;
  const [q, setQ] = useState("love");
  const [gifs, setGifs] = useState<TenorGif[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!key) return;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q || "love")}&key=${key}&limit=12&media_filter=tinygif,gif`,
        );
        const json = await res.json();
        setGifs(json.results ?? []);
      } catch {
        setGifs([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [q, key]);

  if (!key) {
    return (
      <div className="glass rounded-2xl p-4 text-center text-xs text-ink-soft">
        Add <code className="rounded bg-blush-100 px-1 dark:bg-white/10">NEXT_PUBLIC_TENOR_API_KEY</code>{" "}
        to .env.local to enable GIF search (free Tenor key).
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search GIFs…"
        aria-label="Search GIFs"
        className="mb-2 w-full rounded-xl border border-blush-200/70 bg-white/70 px-3 py-1.5 text-sm focus:outline-none dark:border-white/10 dark:bg-white/5"
      />
      <div className="grid max-h-48 grid-cols-3 gap-1.5 overflow-y-auto">
        {loading && <p className="col-span-3 py-4 text-center text-xs text-ink-soft">Searching…</p>}
        {!loading && gifs.map((g) => {
          const url = g.media_formats.tinygif?.url ?? g.media_formats.gif?.url;
          if (!url) return null;
          return (
            <button key={g.id} onClick={() => onPick(g.media_formats.gif?.url ?? url)} aria-label={g.content_description}>
              {/* eslint-disable-next-line @next/next/no-img-element -- Tenor CDN */}
              <img src={url} alt={g.content_description} className="h-20 w-full rounded-xl object-cover" loading="lazy" />
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
