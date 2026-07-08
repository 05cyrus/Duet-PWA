"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { RichTextEditor } from "@/components/letters/RichTextEditor";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCoupleCollection } from "@/hooks/useCoupleCollection";
import { addToCouple, deleteFromCouple, orderBy, pushAppNotification, updateInCouple } from "@/lib/firebase/db";
import type { Letter } from "@/lib/types";
import { cn, friendlyTime, sanitizeHtml, sha256 } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useCouple } from "@/providers/CoupleProvider";
import { useToast } from "@/providers/ToastProvider";

export default function LettersPage() {
  const { user } = useAuth();
  const { coupleId, myName, partnerUid, partnerName } = useCouple();
  const { toast } = useToast();

  const [writeOpen, setWriteOpen] = useState(false);
  const [reading, setReading] = useState<Letter | null>(null);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());

  const [title, setTitle] = useState("");
  const [html, setHtml] = useState("");
  const [deliverAt, setDeliverAt] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [saving, setSaving] = useState(false);

  const { items } = useCoupleCollection<Letter>("letters", () => [orderBy("createdAt", "desc")]);

  const now = new Date().toISOString();
  const visible = useMemo(
    () =>
      items.filter((l) => {
        if (l.authorId === user?.uid) return true;           // my letters & drafts
        if (l.draft) return false;                            // partner's drafts hidden
        if (l.deliverAt && l.deliverAt > now) return false;   // sealed until delivery
        return true;
      }),
    [items, user, now],
  );

  const resetForm = () => { setTitle(""); setHtml(""); setDeliverAt(""); setPassphrase(""); };

  const save = async (draft: boolean) => {
    if (!coupleId || !user) return;
    if (!title.trim() && !html.trim()) return toast("Write something from the heart first 💌", "info");
    setSaving(true);
    try {
      await addToCouple(coupleId, "letters", {
        authorId: user.uid,
        title: title.trim() || "Untitled letter",
        html: sanitizeHtml(html),
        draft,
        favorite: false,
        deliverAt: deliverAt ? new Date(deliverAt).toISOString() : null,
        lockHash: passphrase ? await sha256(passphrase) : null,
        updatedAt: new Date(),
      });
      if (!draft && partnerUid && (!deliverAt || new Date(deliverAt) <= new Date())) {
        pushAppNotification(coupleId, {
          toUid: partnerUid,
          title: `${myName} sent you a love letter 💌`,
          body: title.trim() || "Open it when you're ready.",
          href: "/letters",
        }).catch(() => {});
      }
      toast(draft ? "Draft saved 📝" : deliverAt ? "Letter scheduled 💌⏰" : "Letter sent 💌", "success");
      resetForm();
      setWriteOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const open = async (letter: Letter) => {
    if (letter.lockHash && !unlocked.has(letter.id)) {
      const attempt = prompt("This letter is sealed 🔐 — enter the passphrase:");
      if (!attempt) return;
      if ((await sha256(attempt)) !== letter.lockHash) {
        return toast("That's not the magic word 💔", "error");
      }
      setUnlocked((s) => new Set([...s, letter.id]));
    }
    setReading(letter);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        emoji="💌"
        title="Love Letters"
        subtitle="Slow words for fast times."
        action={<Button onClick={() => setWriteOpen(true)}>✍️ Write</Button>}
      />

      {visible.length === 0 ? (
        <EmptyState
          emoji="🕊️"
          title="No letters yet"
          subtitle="Write the first one — future you will thank you."
          action={<Button onClick={() => setWriteOpen(true)}>Start writing</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {visible.map((l) => {
              const mine = l.authorId === user?.uid;
              const sealed = Boolean(l.lockHash) && !unlocked.has(l.id);
              const scheduled = l.deliverAt && l.deliverAt > now;
              return (
                <motion.button
                  key={l.id}
                  layout
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  whileHover={{ y: -4, rotate: mine ? 0.5 : -0.5 }}
                  onClick={() => open(l)}
                  className="glass relative rounded-3xl p-5 text-left"
                >
                  <span aria-hidden className="text-2xl">
                    {sealed ? "🔐" : l.draft ? "📝" : scheduled ? "⏰" : "💌"}
                  </span>
                  <h3 className="mt-2 line-clamp-1 text-sm font-bold">{l.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-ink-soft">
                    {sealed ? "Sealed with a passphrase." :
                      l.html.replace(/<[^>]+>/g, " ").slice(0, 120) || "…"}
                  </p>
                  <p className="mt-3 text-[10px] font-semibold text-ink-soft/80">
                    {mine ? "You" : partnerName} · {friendlyTime(l.createdAt)}
                    {l.draft && " · draft"}
                    {scheduled && mine && ` · delivers ${new Date(l.deliverAt!).toLocaleDateString()}`}
                  </p>
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={l.favorite ? "Unfavorite" : "Favorite"}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (coupleId) updateInCouple(coupleId, "letters", l.id, { favorite: !l.favorite });
                    }}
                    onKeyDown={(e) => e.key === "Enter" && e.stopPropagation()}
                    className="absolute right-4 top-4 text-lg"
                  >
                    {l.favorite ? "⭐" : "☆"}
                  </span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Writer */}
      <Modal open={writeOpen} onClose={() => setWriteOpen(false)} title="New letter 💌" wide>
        <div className="space-y-3">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="To the love of my life" />
          <RichTextEditor initialHtml="" onChange={setHtml} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Deliver at (optional)" type="datetime-local" value={deliverAt}
              onChange={(e) => setDeliverAt(e.target.value)}
              hint="Hidden from your partner until this moment."
            />
            <Input
              label="Passphrase (optional)" type="password" value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              hint="They'll need this word to open it."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setWriteOpen(false)}>Cancel</Button>
            <Button variant="outline" loading={saving} onClick={() => save(true)}>Save draft</Button>
            <Button loading={saving} onClick={() => save(false)}>
              {deliverAt ? "Schedule 💌" : "Send 💌"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reader */}
      <Modal open={Boolean(reading)} onClose={() => setReading(null)} title={reading?.title} wide>
        {reading && (
          <div>
            <div
              className={cn(
                "rounded-2xl bg-gradient-to-br from-blush-50/80 to-lilac-50/80 px-5 py-6 text-sm leading-relaxed dark:from-white/5 dark:to-white/5",
                "[&_blockquote]:border-l-4 [&_blockquote]:border-blush-300 [&_blockquote]:pl-3 [&_blockquote]:italic",
                "[&_h3]:text-lg [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-5",
              )}
              // Sanitised at save time; sanitise again on render for defence in depth.
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(reading.html) }}
            />
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-ink-soft">
                {reading.authorId === user?.uid ? `You · ${friendlyTime(reading.createdAt)}` : `${partnerName} · ${friendlyTime(reading.createdAt)}`}
              </p>
              {reading.authorId === user?.uid && coupleId && (
                <Button
                  variant="danger" size="sm"
                  onClick={() => {
                    if (!confirm("Delete this letter forever?")) return;
                    deleteFromCouple(coupleId, "letters", reading.id);
                    setReading(null);
                  }}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
