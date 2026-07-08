"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { MEMORY_KIND_META } from "@/lib/content";
import { addToCouple } from "@/lib/firebase/db";
import { uploadCoupleFile } from "@/lib/firebase/storage";
import type { MemoryKind } from "@/lib/types";
import { isoToday } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useCouple } from "@/providers/CoupleProvider";
import { useToast } from "@/providers/ToastProvider";

const MAX_FILES = 4;
const MAX_VIDEO_MB = 50;

export function AddMemoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { coupleId } = useCouple();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<MemoryKind>("special");
  const [date, setDate] = useState(isoToday());
  const [location, setLocation] = useState("");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const reset = () => {
    setTitle(""); setKind("special"); setDate(isoToday());
    setLocation(""); setCaption(""); setTags(""); setFiles([]);
  };

  const pickFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) {
      if (next.length >= MAX_FILES) break;
      if (f.type.startsWith("video/") && f.size > MAX_VIDEO_MB * 1024 * 1024) {
        toast(`Videos must be under ${MAX_VIDEO_MB}MB`, "error");
        continue;
      }
      if (f.type.startsWith("image/") || f.type.startsWith("video/")) next.push(f);
    }
    setFiles(next);
  };

  const save = async () => {
    if (!coupleId || !user) return;
    if (!title.trim()) return toast("Give this memory a title 💭", "info");
    setBusy(true);
    try {
      const mediaUrls: string[] = [];
      const mediaTypes: ("image" | "video")[] = [];
      for (const f of files) {
        const url = await uploadCoupleFile(coupleId, "timeline", f);
        mediaUrls.push(url);
        mediaTypes.push(f.type.startsWith("video/") ? "video" : "image");
      }
      await addToCouple(coupleId, "timeline", {
        kind, title: title.trim(), caption: caption.trim(), date,
        location: location.trim(),
        tags: tags.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean).slice(0, 6),
        mediaUrls, mediaTypes, createdBy: user.uid,
      });
      toast("Memory saved 📖", "success");
      reset();
      onClose();
    } catch {
      toast("Couldn't save — check your connection.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New memory ✨" wide>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Our first road trip" required />
          <Select label="Type" value={kind} onChange={(e) => setKind(e.target.value as MemoryKind)}>
            {Object.entries(MEMORY_KIND_META).map(([k, v]) => (
              <option key={k} value={k}>{v.emoji} {v.label}</option>
            ))}
          </Select>
          <Input label="Date" type="date" value={date} max={isoToday()}
            onChange={(e) => setDate(e.target.value)} />
          <Input label="Location (optional)" value={location}
            onChange={(e) => setLocation(e.target.value)} placeholder="Lake Como, Italy" />
        </div>
        <Textarea label="Caption" value={caption} onChange={(e) => setCaption(e.target.value)}
          placeholder="What made this moment special?" />
        <Input label="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)}
          placeholder="trip, summer, icecream" />

        {/* Media picker */}
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-ink-soft">
            Photos & videos ({files.length}/{MAX_FILES})
          </span>
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <div key={i} className="relative size-20 overflow-hidden rounded-2xl bg-black/5">
                {f.type.startsWith("video/") ? (
                  <span className="grid size-full place-items-center text-2xl" aria-label={f.name}>🎥</span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                  <img src={URL.createObjectURL(f)} alt={f.name} className="size-full object-cover" />
                )}
                <button
                  aria-label={`Remove ${f.name}`}
                  onClick={() => setFiles(files.filter((_, j) => j !== i))}
                  className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/50 text-[10px] text-white"
                >
                  ✕
                </button>
              </div>
            ))}
            {files.length < MAX_FILES && (
              <button
                onClick={() => fileRef.current?.click()}
                className="grid size-20 place-items-center rounded-2xl border-2 border-dashed border-blush-300/60 text-2xl text-blush-400 transition-colors hover:bg-blush-50 dark:hover:bg-white/5"
                aria-label="Add photos or videos"
              >
                +
              </button>
            )}
          </div>
          <input
            ref={fileRef} type="file" accept="image/*,video/*" multiple hidden
            onChange={(e) => { pickFiles(e.target.files); e.target.value = ""; }}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={busy}>Save memory</Button>
        </div>
      </div>
    </Modal>
  );
}
