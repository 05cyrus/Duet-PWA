"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { MEMORY_KIND_META } from "@/lib/content";
import { addToCouple } from "@/lib/firebase/db";
import type { MemoryKind } from "@/lib/types";
import { isoToday } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useCouple } from "@/providers/CoupleProvider";
import { useToast } from "@/providers/ToastProvider";

export function AddMemoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { coupleId } = useCouple();
  const { toast } = useToast();

  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<MemoryKind>("special");
  const [date, setDate] = useState(isoToday());
  const [location, setLocation] = useState("");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");

  const reset = () => {
    setTitle(""); setKind("special"); setDate(isoToday());
    setLocation(""); setCaption(""); setTags("");
  };

  const save = async () => {
    if (!coupleId || !user) return;
    if (!title.trim()) return toast("Give this memory a title 💭", "info");
    setBusy(true);
    try {
      await addToCouple(coupleId, "timeline", {
        kind, title: title.trim(), caption: caption.trim(), date,
        location: location.trim(),
        tags: tags.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean).slice(0, 6),
        createdBy: user.uid,
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

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={busy}>Save memory</Button>
        </div>
      </div>
    </Modal>
  );
}
