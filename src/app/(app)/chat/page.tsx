"use client";

import { arrayUnion, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { EmojiPicker } from "@/components/chat/EmojiPicker";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { Avatar } from "@/components/ui/Avatar";
import { useCoupleCollection } from "@/hooks/useCoupleCollection";
import { db } from "@/lib/firebase/client";
import { addToCouple, limitTo, orderBy, updateInCouple } from "@/lib/firebase/db";
import type { ChatMessage } from "@/lib/types";
import { toDate } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useCouple } from "@/providers/CoupleProvider";

type Panel = "none" | "emoji" | "search" | "pins";

export default function ChatPage() {
  const { user } = useAuth();
  const { coupleId, couple, partnerUid, partnerName, partnerPhoto } = useCouple();

  const [text, setText] = useState("");
  const [panel, setPanel] = useState<Panel>("none");
  const [search, setSearch] = useState("");
  const [partnerTyping, setPartnerTyping] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { items } = useCoupleCollection<ChatMessage>(
    "messages",
    () => [orderBy("createdAt", "desc"), limitTo(120)],
  );
  const messages = useMemo(() => [...items].reverse(), [items]);
  const pinned = useMemo(() => messages.filter((m) => m.pinned), [messages]);
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return messages.filter((m) => m.text.toLowerCase().includes(q));
  }, [messages, search]);

  /* ------------------------------ read receipts ---------------------------- */
  useEffect(() => {
    if (!coupleId || !user) return;
    messages
      .filter((m) => m.senderId !== user.uid && !(m.readBy ?? []).includes(user.uid))
      .forEach((m) => {
        updateInCouple(coupleId, "messages", m.id, { readBy: arrayUnion(user.uid) }).catch(() => {});
      });
  }, [messages, coupleId, user]);

  /* ---------------------------- typing indicator --------------------------- */
  useEffect(() => {
    if (!coupleId || !partnerUid) return;
    return onSnapshot(doc(db(), "couples", coupleId, "meta", "typing"), (snap) => {
      const at = snap.data()?.[partnerUid];
      const ts = at ? toDate(at) : null;
      setPartnerTyping(Boolean(ts && Date.now() - ts.getTime() < 6000));
    });
  }, [coupleId, partnerUid]);

  // Re-check staleness so the indicator disappears without a new snapshot.
  useEffect(() => {
    if (!partnerTyping) return;
    const t = setTimeout(() => setPartnerTyping(false), 6000);
    return () => clearTimeout(t);
  }, [partnerTyping]);

  const signalTyping = () => {
    if (!coupleId || !user) return;
    if (typingTimer.current) return; // throttle to one write / 2.5s
    typingTimer.current = setTimeout(() => { typingTimer.current = null; }, 2500);
    setDoc(doc(db(), "couples", coupleId, "meta", "typing"),
      { [user.uid]: serverTimestamp() }, { merge: true }).catch(() => {});
  };

  /* -------------------------------- scrolling ------------------------------ */
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, partnerTyping]);

  /* --------------------------------- sending ------------------------------- */
  const sendText = async () => {
    if (!coupleId || !user) return;
    const body = text.trim();
    if (!body) return;
    setText("");
    setPanel("none");
    await addToCouple(coupleId, "messages", {
      senderId: user.uid, kind: "text", text: body,
      pinned: false, readBy: [user.uid], reactions: {},
    });
  };

  const jumpTo = (id: string) => {
    setPanel("none");
    document.getElementById(`msg-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-160px)] max-w-3xl flex-col lg:h-[calc(100dvh-120px)]">
      {/* Chat header */}
      <div className="glass mb-2 flex items-center gap-3 rounded-2xl px-4 py-2.5">
        <Avatar src={partnerPhoto} name={partnerName} size={38} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{partnerName}</p>
          <AnimatePresence mode="wait">
            {partnerTyping ? (
              <motion.p key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-xs font-semibold text-blush-500">
                typing<span className="animate-pulse">…</span>
              </motion.p>
            ) : (
              <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-ink-soft">
                {couple?.coupleName}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <button onClick={() => setPanel(panel === "pins" ? "none" : "pins")}
          aria-label={`Pinned messages (${pinned.length})`}
          className="grid size-9 place-items-center rounded-full hover:bg-white/40 dark:hover:bg-white/10">
          📌{pinned.length > 0 && <span className="sr-only">{pinned.length}</span>}
        </button>
        <button onClick={() => setPanel(panel === "search" ? "none" : "search")}
          aria-label="Search messages"
          className="grid size-9 place-items-center rounded-full hover:bg-white/40 dark:hover:bg-white/10">
          🔍
        </button>
      </div>

      {/* Search / pins panels */}
      <AnimatePresence>
        {panel === "search" && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="mb-2 overflow-hidden">
            <div className="glass rounded-2xl p-3">
              <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages…" aria-label="Search messages"
                className="w-full rounded-xl border border-blush-200/70 bg-white/70 px-3 py-2 text-sm focus:outline-none dark:border-white/10 dark:bg-white/5" />
              {search && (
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                  {searchResults.length === 0 && <li className="text-xs text-ink-soft">No matches in recent messages.</li>}
                  {searchResults.map((m) => (
                    <li key={m.id}>
                      <button onClick={() => jumpTo(m.id)}
                        className="w-full truncate rounded-xl px-3 py-1.5 text-left text-sm hover:bg-white/50 dark:hover:bg-white/10">
                        {m.text}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
        {panel === "pins" && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="mb-2 overflow-hidden">
            <div className="glass rounded-2xl p-3">
              <h3 className="mb-1 text-xs font-bold text-ink-soft">Pinned 📌</h3>
              {pinned.length === 0 && <p className="text-xs text-ink-soft">Tap a message → 📌 to pin it.</p>}
              <ul className="max-h-40 space-y-1 overflow-y-auto">
                {pinned.map((m) => (
                  <li key={m.id}>
                    <button onClick={() => jumpTo(m.id)}
                      className="w-full truncate rounded-xl px-3 py-1.5 text-left text-sm hover:bg-white/50 dark:hover:bg-white/10">
                      {m.text}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-1 py-2" aria-live="polite">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-soft">
            Say hi — this space is just for you two 💌
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} id={`msg-${m.id}`}>
            <MessageBubble
              msg={m}
              mine={m.senderId === user?.uid}
              partnerRead={Boolean(partnerUid && (m.readBy ?? []).includes(partnerUid))}
              onReact={(emoji) => {
                if (!coupleId || !user) return;
                const curr = m.reactions?.[user.uid];
                updateInCouple(coupleId, "messages", m.id, {
                  [`reactions.${user.uid}`]: curr === emoji ? "" : emoji,
                });
              }}
              onPin={() => coupleId && updateInCouple(coupleId, "messages", m.id, { pinned: !m.pinned })}
            />
          </div>
        ))}
        {partnerTyping && (
          <div className="flex justify-start">
            <div className="glass flex gap-1 rounded-3xl rounded-bl-lg px-4 py-3">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="size-2 rounded-full bg-blush-400"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pickers */}
      <AnimatePresence>
        {panel === "emoji" && (
          <motion.div exit={{ opacity: 0, y: 8 }} className="mb-2">
            <EmojiPicker onPick={(e) => setText((t) => t + e)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <form
        className="glass flex items-end gap-1.5 rounded-3xl p-2"
        onSubmit={(e) => { e.preventDefault(); sendText(); }}
      >
        <button type="button" aria-label="Emoji" aria-expanded={panel === "emoji"}
          onClick={() => setPanel(panel === "emoji" ? "none" : "emoji")}
          className="grid size-10 shrink-0 place-items-center rounded-full text-xl hover:bg-white/40 dark:hover:bg-white/10">
          😊
        </button>

        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); signalTyping(); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(); }
          }}
          rows={1}
          placeholder="Message…"
          aria-label="Message"
          className="max-h-28 min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm focus:outline-none"
        />

        <button type="submit" aria-label="Send"
          className="gradient-btn grid size-10 shrink-0 place-items-center rounded-full text-white">
          ➤
        </button>
      </form>
    </div>
  );
}
