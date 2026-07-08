"use client";

import { motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { GalleryLightbox } from "@/components/gallery/GalleryLightbox";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCoupleCollection } from "@/hooks/useCoupleCollection";
import { addToCouple, orderBy } from "@/lib/firebase/db";
import { uploadCoupleFile } from "@/lib/firebase/storage";
import type { Album, GalleryItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useCouple } from "@/providers/CoupleProvider";
import { useToast } from "@/providers/ToastProvider";

export default function GalleryPage() {
  const { user } = useAuth();
  const { coupleId } = useCouple();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [albumFilter, setAlbumFilter] = useState<string>("all");
  const [uploading, setUploading] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [slideshow, setSlideshow] = useState(false);

  const { items: albums } = useCoupleCollection<Album>("albums", () => [orderBy("createdAt", "asc")]);
  const { items, loading } = useCoupleCollection<GalleryItem>("gallery", () => [orderBy("createdAt", "desc")]);

  const visible = useMemo(() => {
    if (albumFilter === "all") return items;
    if (albumFilter === "favorites") return items.filter((i) => i.favorite);
    return items.filter((i) => i.albumId === albumFilter);
  }, [items, albumFilter]);

  const createAlbum = async () => {
    const name = prompt("Album name:");
    if (!name?.trim() || !coupleId) return;
    await addToCouple(coupleId, "albums", { name: name.trim(), cover: null, count: 0 });
  };

  const upload = async (list: FileList | null) => {
    if (!list || !coupleId || !user) return;
    setUploading(true);
    try {
      for (const f of Array.from(list).slice(0, 10)) {
        if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) continue;
        const url = await uploadCoupleFile(coupleId, "gallery", f);
        await addToCouple(coupleId, "gallery", {
          albumId: albumFilter !== "all" && albumFilter !== "favorites" ? albumFilter : "",
          url,
          type: f.type.startsWith("video/") ? "video" : "image",
          caption: "", favorite: false, reactions: {}, comments: [],
          uploadedBy: user.uid,
        });
      }
      toast("Uploaded 🖼️", "success");
    } catch {
      toast("Upload failed — try again.", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <PageHeader
        emoji="🖼️"
        title="Gallery"
        subtitle="All your favorite pixels in one place."
        action={
          <div className="flex gap-2">
            {visible.length > 1 && (
              <Button variant="outline" onClick={() => { setOpenIndex(0); setSlideshow(true); }}>
                ▶ Slideshow
              </Button>
            )}
            <Button loading={uploading} onClick={() => fileRef.current?.click()}>+ Upload</Button>
          </div>
        }
      />
      <input ref={fileRef} type="file" accept="image/*,video/*" multiple hidden
        onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />

      {/* Album chips */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {[
          { id: "all", name: "✨ All" },
          { id: "favorites", name: "⭐ Favorites" },
          ...albums.map((a) => ({ id: a.id, name: `📁 ${a.name}` })),
        ].map((a) => (
          <button
            key={a.id}
            onClick={() => setAlbumFilter(a.id)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              albumFilter === a.id ? "gradient-btn text-white" : "glass text-ink-soft hover:text-ink",
            )}
          >
            {a.name}
          </button>
        ))}
        <button
          onClick={createAlbum}
          className="glass shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold text-lilac-500"
        >
          + New album
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square" />)}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          emoji="📷"
          title="No photos here yet"
          subtitle="Upload your favorite shots of each other."
          action={<Button onClick={() => fileRef.current?.click()}>Upload the first one</Button>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((item, i) => (
            <motion.button
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              onClick={() => { setOpenIndex(i); setSlideshow(false); }}
              className="group relative aspect-square overflow-hidden rounded-3xl bg-black/5 focus-visible:ring-2"
              aria-label={item.caption || "Open photo"}
            >
              {item.type === "video" ? (
                <>
                  <video src={item.url} preload="metadata" muted className="size-full object-cover" />
                  <span aria-hidden className="absolute inset-0 grid place-items-center text-3xl drop-shadow">▶️</span>
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- Firebase Storage URL
                <img src={item.url} alt={item.caption || "Memory"} loading="lazy"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
              )}
              {item.favorite && (
                <span aria-label="Favorite" className="absolute right-2 top-2 drop-shadow">⭐</span>
              )}
              {Object.keys(item.reactions ?? {}).length > 0 && (
                <span className="absolute bottom-2 left-2 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white backdrop-blur">
                  {Object.values(item.reactions).join("")}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      )}

      {openIndex !== null && visible[openIndex] && (
        <GalleryLightbox
          items={visible}
          index={openIndex}
          slideshow={slideshow}
          onNavigate={setOpenIndex}
          onClose={() => { setOpenIndex(null); setSlideshow(false); }}
        />
      )}
    </div>
  );
}
